import { GoogleGenAI, Type, Part } from "@google/genai";
import { OrganizedNote, OrganizedContentData, Note, UserSettings, Project, AiTask, AiTaskResult } from "../types";

const getClient = (userApiKey?: string) => {
  const apiKey = userApiKey; // No longer falls back to process.env.API_KEY
  if (!apiKey) {
      throw new Error("A Gemini API key is required. Please add one in Settings to enable AI features.");
  }
  return new GoogleGenAI({ apiKey });
};

const parseJsonResponse = <T>(jsonString: string, errorMessage: string): T => {
    if (!jsonString) {
        throw new Error(errorMessage);
    }
    try {
        const sanitizedJson = jsonString.replace(/"graphData":\s*null/g, '"graphData": {}');
        return JSON.parse(sanitizedJson);
    } catch (e) {
        console.error("Failed to parse JSON response from AI:", jsonString);
        throw new Error(`The AI returned an invalid response format, which could be due to a malformed response or an API error. Please try again. Raw response: ${jsonString.substring(0, 200)}...`);
    }
};

const graphDataSchema = {
    type: Type.OBJECT,
    description: "If the note contains structured data (like a table, CSV, or key-value pairs) that can be visualized, extract it into this object. If not, this entire object MUST be null.",
    properties: {
        type: { type: Type.STRING, enum: ['bar', 'line', 'pie'], description: "The best chart type for the data. Default to 'bar'." },
        data: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } } } },
        config: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, xAxisLabel: { type: Type.STRING }, yAxisLabel: { type: Type.STRING } } }
    },
    nullable: true
};

const organizationSchema = {
    type: Type.OBJECT,
    properties: {
        project: { type: Type.STRING }, subject: { type: Type.STRING }, summary: { type: Type.STRING },
        detailedSummary: { type: Type.STRING }, todos: { type: Type.ARRAY, items: { type: Type.STRING } },
        keyPeople: { type: Type.ARRAY, items: { type: Type.STRING } }, tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        decisions: { type: Type.ARRAY, items: { type: Type.STRING } }, graphData: graphDataSchema
    },
    required: ["project", "subject", "summary", "detailedSummary", "todos", "keyPeople", "tags", "decisions", "graphData"],
};

const chatResponseSchema = {
    type: Type.OBJECT, properties: { answer: { type: Type.STRING }, sourceNoteIds: { type: Type.ARRAY, items: { type: Type.STRING } } },
    required: ["answer", "sourceNoteIds"],
};

const semanticSearchResultsSchema = {
    type: Type.OBJECT,
    properties: {
        relevantNoteIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of IDs of the notes that are most semantically relevant to the user's query."
        }
    },
    required: ["relevantNoteIds"]
};

const buildContentRequest = (note: Note | { content: string, attachments?: any[] }, basePrompt: string): Part[] => {
    const parts: Part[] = [{ text: `${basePrompt}\n\nText to analyze:\n---\n${note.content}\n---` }];
    if (note.attachments && note.attachments.length > 0) {
        parts[0].text += "\n\nAlso consider the following attached image(s):";
        note.attachments.forEach(att => {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.data.split(',')[1] } });
        });
    }
    return parts;
};

// Main AI Router
export const processAiTask = async (task: AiTask, settings: UserSettings, projects: Project[]): Promise<AiTaskResult> => {
    const profile = settings.aiPerformanceProfile || 'max-quality';
    const ai = getClient(settings.apiKey);
    let model: string = 'gemini-2.5-flash';
    let parts: Part[];

    const projectContext = projects.map(p => `{name: "${p.name}", description: "${p.description || 'No description.'}"}`).join('; ');

    switch (task.type) {
        case 'FULL_ANALYSIS':
        case 'UPLOAD_ANALYSIS':
        case 'MEETING_ANALYSIS':
        case 'TRANSCRIBE_AUDIO':
            model = profile === 'max-quality' ? 'gemini-2.5-flash' : 'gemini-2.5-flash';
            
            const baseSchema = organizationSchema;
            const fullSchema = (task.type !== 'FULL_ANALYSIS')
                ? { type: Type.OBJECT, properties: { title: { type: Type.STRING }, ...baseSchema.properties }, required: ["title", ...baseSchema.required] }
                : baseSchema;

            let prompt: string;
            if (task.type === 'FULL_ANALYSIS') {
                prompt = `Analyze the note content and structure it. Considering existing projects [${projectContext}], assign the most appropriate project and subject. Extract summaries, todos, people, tags, decisions, and any graphable data. Respond in ${settings.aiLanguage}.`;
                parts = buildContentRequest(task.note, prompt);
            } else if (task.type === 'UPLOAD_ANALYSIS') {
                let categorizationInstruction = `Assign a project and subject, considering this list: [${projectContext}].`;
                if(task.targetProjectName) {
                    categorizationInstruction = `The user has specified this note belongs in the '${task.targetProjectName}' project. Set the project field to this value and determine a relevant subject.`;
                }
                prompt = `Analyze the provided file content, create a title, and structure it. ${categorizationInstruction} Extract summaries, todos, people, tags, decisions, and graphable data. Respond in ${settings.aiLanguage}.`;
                parts = [{ text: prompt }];
                if (task.file.type.startsWith('image/') || task.file.type === 'application/pdf') {
                    parts.push({ inlineData: { mimeType: task.file.type, data: task.fileContent.split(',')[1] } });
                } else {
                    parts[0].text += `\n\nProvided Text:\n---\n${task.fileContent.substring(0, 30000)}\n---`;
                }
            } else if (task.type === 'MEETING_ANALYSIS') {
                prompt = `Analyze the meeting transcript and screenshots. Create a title and format as professional meeting minutes in the detailedSummary. Assign to a project considering [${projectContext}]. Extract todos, attendees, decisions, and tags. The meeting was on ${new Date().toLocaleDateString()}. Respond in ${settings.aiLanguage}.`;
                parts = [{ text: prompt }, { text: `Transcript:\n---\n${task.transcript.substring(0, 40000)}\n---` }];
                task.screenshots.forEach(ss => parts.push({ inlineData: { mimeType: 'image/jpeg', data: ss.split(',')[1] } }));
            } else { // TRANSCRIBE_AUDIO
                prompt = `First, transcribe the provided audio recording of a meeting. Then, using the transcription and any provided screenshots, analyze the meeting. Create a title and format the transcription as professional meeting minutes in the 'detailedSummary' field. Assign to a project considering [${projectContext}]. Extract todos, attendees, decisions, and tags. The meeting was on ${new Date().toLocaleDateString()}. Respond in ${settings.aiLanguage}.`;
                parts = [{ text: prompt }, { inlineData: { mimeType: task.mimeType, data: task.audioData } }];
                task.screenshots.forEach(ss => parts.push({ inlineData: { mimeType: 'image/jpeg', data: ss.split(',')[1] } }));
            }
            
            const response = await ai.models.generateContent({
                model, contents: { parts }, config: { responseMimeType: "application/json", responseSchema: fullSchema, temperature: 0.1 }
            });
            const parsed = parseJsonResponse<any>(response.text, "AI failed to organize content.");
            if (parsed.graphData && Object.keys(parsed.graphData).length === 0) parsed.graphData = null;

            if (task.type === 'FULL_ANALYSIS') return { type: 'organizedNote', data: parsed };
            return { type: 'organizedContent', data: parsed };

        case 'CHAT_QUERY':
            model = 'gemini-2.5-flash';
            const notesContext = task.notes.filter(n => !n.isArchived).map(note => `<note id="${note.id}"><title>${note.title}</title><content>${note.content.substring(0, 500)}</content></note>`).join('\n');
            const chatPrompt = `You are Cognito, an AI assistant. Answer the user's question based *only* on the provided notes context. If the answer is not in the notes, say so. Cite the note 'id' for every note used in \`sourceNoteIds\`. Respond in ${settings.aiLanguage}. Question: "${task.question}"\n\nContext:\n${notesContext}`;
            
            const chatResponse = await ai.models.generateContent({
                model, contents: chatPrompt, config: { temperature: 0.2, responseMimeType: "application/json", responseSchema: chatResponseSchema }
            });
            return { type: 'chatResponse', data: parseJsonResponse(chatResponse.text, "AI failed to generate chat response.") };

        case 'SEMANTIC_SEARCH':
            model = 'gemini-2.5-flash';
            const searchContext = task.notes.filter(n => !n.isArchived).map(note => `<note id="${note.id}"><title>${note.title}</title><content>${(note.summary || note.content).substring(0, 300)}</content></note>`).join('\n');
            const searchPrompt = `Based on the user's query, identify the most semantically relevant notes from the context provided. Return only the IDs of the top 5 most relevant notes. User Query: "${task.query}"\n\nContext:\n${searchContext}`;
            const searchResponse = await ai.models.generateContent({
                model, contents: searchPrompt, config: { temperature: 0.1, responseMimeType: "application/json", responseSchema: semanticSearchResultsSchema }
            });
            const parsedSearch = parseJsonResponse<{ relevantNoteIds: string[] }>(searchResponse.text, "AI failed to perform semantic search.");
            return { type: 'semantic_search_results', data: parsedSearch.relevantNoteIds };

        case 'CONTINUE_WRITING':
        case 'TRANSLATE':
        case 'CHANGE_TONE':
        case 'SUMMARIZE_SELECTION':
            model = 'gemini-2.5-flash';
            let simplePrompt: string;

            switch (task.type) {
                case 'CONTINUE_WRITING':
                    simplePrompt = profile === 'max-savings' ? `Briefly continue this text with one sentence: ${task.note.content}` : `You are a seamless writing partner. Continue the following text with 1-3 new sentences that logically follow. Do not repeat the original text. Your response must be **only the new text**. Respond in ${settings.aiLanguage}.`;
                    parts = buildContentRequest(task.note, simplePrompt);
                    break;
                case 'TRANSLATE':
                    simplePrompt = `Translate the following text into ${task.targetLanguage}. Output only the translated text.\n\n---\n${task.content}\n---`;
                    parts = [{text: simplePrompt}];
                    break;
                case 'CHANGE_TONE':
                    simplePrompt = `Rewrite the following text in a ${task.tone} tone. Keep the core meaning the same. Output only the rewritten text in ${settings.aiLanguage}.\n\n---\n${task.content}\n---`;
                    parts = [{text: simplePrompt}];
                    break;
                case 'SUMMARIZE_SELECTION':
                    simplePrompt = `Summarize the following text into a few key points. Output only the summary in ${settings.aiLanguage}.\n\n---\n${task.content}\n---`;
                    parts = [{text: simplePrompt}];
                    break;
            }

            const simpleResponse = await ai.models.generateContent({ model, contents: { parts }, config: { temperature: 0.5 } });
            const text = simpleResponse.text.trim();
            if (!text) throw new Error("The AI returned an empty response.");
            
            if (task.type === 'CONTINUE_WRITING') return { type: 'string', data: task.note.content + '\n' + text };
            if (task.type === 'SUMMARIZE_SELECTION') return { type: 'string_append', data: `\n\n---\n**Selection Summary:**\n${text}\n---` };
            return { type: 'string', data: text };

        default:
            throw new Error("Unknown AI task type");
    }
};