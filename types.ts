export interface ImageAttachment {
  id: string;
  data: string; // base64 data URL
  mimeType: string;
}

export interface UserSettings {
  id: 'main_settings'; // Static ID for single settings object in DB
  uiLanguage: string;
  aiLanguage: string;
  apiKey?: string; // Optional user-provided API key
  theme?: 'light' | 'dark'; // New
  aiPerformanceProfile?: 'max-quality' | 'balanced' | 'max-savings'; // New
}

export interface GraphDataItem {
  label: string;
  value: number;
}

export interface GraphData {
  type: 'bar' | 'line' | 'pie';
  data: GraphDataItem[];
  config: {
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
  };
}

export interface Subject {
  id: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  subjects: Subject[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  attachments: ImageAttachment[];
  createdAt: string;
  updatedAt: string;
  projectId: string;
  subjectId: string;
  summary: string;
  detailedSummary: string; // For longer, more detailed meeting minutes etc.
  todos: string[];
  keyPeople: string[];   // New: Extracted key people
  tags: string[]; // New: Extracted tags, now user-manageable
  decisions: string[]; // New: Extracted key decisions from meetings
  isArchived: boolean;
  isTemplate?: boolean; // New: To mark a note as a template
  graphData?: GraphData | null; // New: To store structured data for charts
  disableAiSync?: boolean; // New
}

export interface NoteVersion {
    id: string; // combo of noteId and savedAt timestamp
    noteId: string;
    title: string;
    content: string;
    savedAt: string;
}

export interface OrganizedNote {
  project: string; // The NAME of the project
  subject: string; // The NAME of the subject
  summary: string;
  detailedSummary: string;
  todos: string[];
  keyPeople: string[];
  tags: string[];
  decisions: string[];
  graphData?: GraphData | null;
}

export interface ChatMessage {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    sourceNoteIds?: string[]; // New: To link back to notes
}

export interface OrganizedContentData extends OrganizedNote {
    title:string;
}

export interface ExportData {
    notes: Note[];
    projects: Project[];
    settings: UserSettings | undefined;
    versions?: NoteVersion[];
}

// For the new AI Service Router
export type AiTask =
  | { type: 'FULL_ANALYSIS'; note: Note }
  | { type: 'UPLOAD_ANALYSIS'; file: File; fileContent: string; targetProjectName?: string }
  | { type: 'MEETING_ANALYSIS'; transcript: string; screenshots: string[] }
  | { type: 'TRANSCRIBE_AUDIO', audioData: string; mimeType: string, screenshots: string[] }
  | { type: 'CHAT_QUERY'; question: string; notes: Note[] }
  | { type: 'CONTINUE_WRITING'; note: Note }
  | { type: 'TRANSLATE'; content: string; targetLanguage: string }
  | { type: 'CHANGE_TONE'; content: string; tone: string }
  | { type: 'SUMMARIZE_SELECTION'; content: string }
  | { type: 'SEMANTIC_SEARCH'; query: string; notes: Note[] };

export type AiTaskResult =
  | { type: 'organizedNote'; data: OrganizedNote }
  | { type: 'organizedContent'; data: OrganizedContentData }
  | { type: 'chatResponse'; data: { answer: string; sourceNoteIds: string[] } }
  | { type: 'string'; data: string }
  | { type: 'string_append', data: string }
  | { type: 'semantic_search_results', data: string[] };