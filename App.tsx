


import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Note, ChatMessage, UserSettings, Project, Subject, ExportData, AiTask, NoteVersion } from './types';
import * as dbService from './services/dbService';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import Chatbot from './components/Chatbot';
import { processAiTask } from './services/geminiService';
import { Logo, IconCognito, IconBrainCircuit } from './components/Icons';
import SettingsModal from './components/SettingsModal';
import DropdownMenu from './components/DropdownMenu';
import MeetingModeModal from './components/MeetingModeModal';
import Spinner from './components/Spinner';
import UploadModal from './components/UploadModal';
import InteractiveTutorial from './components/InteractiveTutorial';
import TemplateSelectionModal from './components/TemplateSelectionModal';
import OnboardingModal from './components/OnboardingModal';
import NameEditModal from './components/NameEditModal';
import ConfirmModal from './components/ConfirmModal';
import MindMapModal from './components/MindMapModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import CommandPalette from './components/CommandPalette';
import * as mammoth from 'mammoth';
import * as pdfjs from 'pdfjs-dist/build/pdf.mjs';
import { WELCOME_NOTE_CONTENT } from './utils/welcomeNote';
import { PREBUILT_TEMPLATES } from './utils/templateNotes';
import Dashboard from './components/Dashboard';
import { useLocalization } from './hooks/useLocalization';
import { debounce } from './utils/debounce';
import ProcessingOverlay from './components/ProcessingOverlay';

pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@4.4.168/build/pdf.worker.mjs`;

const App: React.FC = () => {
  const { t, setLanguage: setUiLanguage, language: uiLanguage } = useLocalization();
  
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const errorTimerRef = useRef<number | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [isProcessingMeeting, setIsProcessingMeeting] = useState(false);
  const [isMindMapOpen, setIsMindMapOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(false);
  const [isProcessingSemantic, setIsProcessingSemantic] = useState(false);
  const [semanticSearchResults, setSemanticSearchResults] = useState<string[] | null>(null);

  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  const [showArchived, setShowArchived] = useState(false);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<{ type: 'project' | 'subject', id: string, name: string, description?: string } | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<{ type: 'project' | 'subject', id: string, name: string } | null>(null);
  
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState<any>(null);

  const displayError = useCallback((err: unknown) => {
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    const message = err instanceof Error ? err.message : t('prompts.unknownError');
    console.error("Displaying error:", err);
    setError(message);
    setShowError(true);
    errorTimerRef.current = window.setTimeout(() => {
        setShowError(false);
        window.setTimeout(() => setError(null), 300);
    }, 5000);
  }, [t]);

  const findOrCreateProjectAndSubject = async (projectName: string, subjectName: string, projectDescription?: string) => {
    let allProjects = await dbService.getProjects();
    
    let project = allProjects.find(p => p.name.toLowerCase() === projectName.toLowerCase());
    let projectWasCreated = false;
    if (!project) {
        project = { id: crypto.randomUUID(), name: projectName, description: projectDescription, subjects: [] };
        projectWasCreated = true;
    }

    let subject = project.subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
    if (!subject) {
        subject = { id: crypto.randomUUID(), name: subjectName };
        project.subjects.push(subject);
        if (projectWasCreated) await dbService.addProject(project);
        else await dbService.updateProject(project);
    }

    setProjects(await dbService.getProjects());
    return { projectId: project.id, subjectId: subject.id };
  };

  const initializeNewUser = async () => {
    const { projectId: welcomeProjectId, subjectId: welcomeSubjectId } = await findOrCreateProjectAndSubject(
        'Getting Started', 'Welcome', 'Your first project for learning the ropes of NoteTaker AI.'
    );
    
    const now = new Date().toISOString();
    const initialNotesToAdd: Note[] = [];

    const welcomeNote: Note = {
        id: crypto.randomUUID(), createdAt: now, updatedAt: now,
        title: 'Welcome to NoteTaker AI!', content: WELCOME_NOTE_CONTENT,
        projectId: welcomeProjectId, subjectId: welcomeSubjectId,
        summary: 'A guide to getting started with NoteTaker AI.',
        detailedSummary: '', todos: ["Try creating a new note", "Explore the editor and insights panel"],
        attachments: [], keyPeople: ["Cognito AI"], tags: ["welcome", "guide", "tutorial"], decisions: [],
        isArchived: false, isTemplate: false, graphData: null, disableAiSync: false,
    };
    initialNotesToAdd.push(welcomeNote);
    
    for (const template of PREBUILT_TEMPLATES) {
        const { projectId: pId, subjectId: sId } = await findOrCreateProjectAndSubject(template.project, template.subject, template.projectDescription);
        initialNotesToAdd.push({
            id: crypto.randomUUID(), createdAt: now, updatedAt: now,
            title: template.title, content: template.content,
            projectId: pId, subjectId: sId,
            summary: template.summary, detailedSummary: template.detailedSummary,
            todos: template.todos, attachments: template.attachments,
            keyPeople: template.keyPeople, tags: template.tags,
            decisions: template.decisions, isArchived: false, isTemplate: true, graphData: null, disableAiSync: false,
        });
    }

    await dbService.bulkAddNotes(initialNotesToAdd);
    const allNotes = await dbService.getAllNotes();
    const sortedNotes = allNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    setNotes(sortedNotes);
    setProjects(await dbService.getProjects());
    setActiveNoteId(welcomeNote.id);
    setIsTutorialOpen(true);
  };

  const handleOnboardingComplete = async (newSettings: Pick<UserSettings, 'uiLanguage' | 'apiKey'>) => {
    const fullSettings: UserSettings = {
        id: 'main_settings',
        aiLanguage: 'English', // default
        ...newSettings,
        theme: 'dark',
        aiPerformanceProfile: 'max-quality',
    };
    await dbService.saveUserSettings(fullSettings);
    setUserSettings(fullSettings);
    setUiLanguage(fullSettings.uiLanguage);
    setIsFirstTimeSetup(false);
    await initializeNewUser();
  };

  // Effect for initial data loading. Runs ONLY ONCE.
  useEffect(() => {
    const loadAppData = async () => {
        setIsAppLoading(true);
        try {
            let settings = await dbService.getUserSettings();
            if (!settings) {
                setIsFirstTimeSetup(true);
            } else {
                setUserSettings(settings);
                setUiLanguage(settings.uiLanguage); 
                
                const [localNotes, localProjects] = await Promise.all([dbService.getAllNotes(), dbService.getProjects()]);
                const sortedNotes = localNotes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                setNotes(sortedNotes);
                setProjects(localProjects);
            }
        } catch (err) {
            if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
            const message = err instanceof Error ? err.message : "An unknown error occurred on startup.";
            console.error("Error during initial app load:", err);
            setError(message);
            setShowError(true);
            errorTimerRef.current = window.setTimeout(() => {
                setShowError(false);
                window.setTimeout(() => setError(null), 300);
            }, 5000);
        } finally {
            setIsAppLoading(false);
        }
    };
    loadAppData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to manage the theme class on the body element.
  useEffect(() => {
    if (userSettings?.theme) {
        document.body.classList.toggle('light', userSettings.theme === 'light');
    }
  }, [userSettings?.theme]);


  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (notes.length > 0) {
        const message = t('prompts.unsavedWarning');
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [notes.length, t]);

  useEffect(() => {
    const handleNoteLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const link = target.closest('a[data-note-link]');
        if (link) {
            e.preventDefault();
            const noteId = link.getAttribute('data-note-link');
            if (noteId) setActiveNoteId(noteId);
        }
    };
    document.addEventListener('click', handleNoteLinkClick);
    return () => document.removeEventListener('click', handleNoteLinkClick);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            setIsCommandPaletteOpen(p => !p);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
        e.preventDefault();
        setDeferredInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => a.name.localeCompare(b.name));
  }, [projects]);
  
  const templates = useMemo(() => notes.filter(n => n.isTemplate && !n.isArchived).sort((a,b) => a.title.localeCompare(b.title)), [notes]);
  
  const handleSaveSettings = async (settings: Partial<UserSettings>) => {
    if(userSettings) {
      const updatedSettings = { ...userSettings, ...settings };
      await dbService.saveUserSettings(updatedSettings);
      setUserSettings(updatedSettings);
      if (settings.uiLanguage) setUiLanguage(settings.uiLanguage);
      setIsSettingsModalOpen(false);
    }
  };
  
  const activeNote = useMemo(() => notes.find(note => note.id === activeNoteId), [notes, activeNoteId]);

  const ensureApiKey = useCallback((featureName: string) => {
      if (!userSettings?.apiKey) {
          const errorMessage = `A Gemini API key is required for the '${featureName}' feature. Please add one in Settings.`;
          displayError(new Error(errorMessage));
          return false;
      }
      return true;
  }, [userSettings, displayError]);

  const handleAddNote = useCallback(async (fromTemplateId?: string): Promise<Note | null> => {
    setIsProcessing(true);
    try {
        let newNoteData: Partial<Note> & { project: string, subject: string };

        if (fromTemplateId) {
            const template = notes.find(n => n.id === fromTemplateId);
            if (template) {
                const project = projects.find(p => p.id === template.projectId);
                const subject = project?.subjects.find(s => s.id === template.subjectId);
                let content = template.content;
                if (content.includes('{{Today}}')) {
                    content = content.replace(/{{Today}}/g, new Date().toLocaleDateString());
                }
                newNoteData = {
                    title: `New from ${template.title}`, content, project: project?.name || 'Personal', subject: subject?.name || 'General',
                    attachments: template.attachments, tags: template.tags, decisions: template.decisions, keyPeople: template.keyPeople, todos: template.todos,
                };
            } else { throw new Error("Template not found"); }
        } else {
            const project = projectFilter ? projects.find(p => p.id === projectFilter) : projects.find(p => p.name === 'Personal');
            newNoteData = {
                title: 'New Note', content: '', project: project?.name || 'Personal', subject: 'General',
            };
        }

        const { projectId, subjectId } = await findOrCreateProjectAndSubject(newNoteData.project, newNoteData.subject);
        
        const now = new Date().toISOString();
        const finalNote: Note = {
            id: crypto.randomUUID(),
            title: newNoteData.title || 'Untitled', content: newNoteData.content || '',
            createdAt: now, updatedAt: now, projectId, subjectId,
            summary: 'A new empty note.', detailedSummary: '', todos: newNoteData.todos || [],
            attachments: newNoteData.attachments || [], keyPeople: newNoteData.keyPeople || [], tags: newNoteData.tags || [], 
            decisions: newNoteData.decisions || [], isArchived: false, isTemplate: false, graphData: null, disableAiSync: false,
        };

        await dbService.addNote(finalNote);
        setNotes(prevNotes => [finalNote, ...prevNotes]);
        setActiveNoteId(finalNote.id);
        return finalNote;
    } catch(err) {
        displayError(err);
        return null;
    } finally {
        setIsProcessing(false);
    }
  }, [notes, projects, projectFilter, displayError]);

  const debouncedAiSync = useCallback(
    debounce(async (noteId: string) => {
        const freshNote = await dbService.getNote(noteId);
        if (!freshNote || !freshNote.content.trim() || freshNote.disableAiSync) return;
        if (!ensureApiKey('Auto-Sync')) return;

        setIsSyncing(true);
        try {
            const task: AiTask = { type: 'FULL_ANALYSIS', note: freshNote };
            const result = await processAiTask(task, userSettings!, projects);

            if (result.type === 'organizedNote') {
                const organizedData = result.data;
                const { projectId, subjectId } = await findOrCreateProjectAndSubject(organizedData.project, organizedData.subject);
                
                const combinedTags = [...new Set([...(freshNote.tags || []), ...(organizedData.tags || [])])];
                const finalUpdate: Note = { ...freshNote, ...organizedData, projectId, subjectId, tags: combinedTags, updatedAt: new Date().toISOString() };
                
                await dbService.updateNote(finalUpdate);
                
                setNotes(prev => prev.map(n => n.id === noteId ? finalUpdate : n));
            }
        } catch (err) { 
            displayError(err); 
        } finally { 
            setIsSyncing(false); 
        }
    }, 3000),
    [userSettings, displayError, projects, ensureApiKey]
  );
  
  const saveNoteChanges = useCallback(
    debounce(async (noteToSave: Note) => {
      setIsSaving(true);
      try {
        const originalNote = await dbService.getNote(noteToSave.id);
        if (originalNote && (originalNote.content !== noteToSave.content || originalNote.title !== noteToSave.title)) {
            const version: NoteVersion = {
                id: `${originalNote.id}-${new Date().toISOString()}`,
                noteId: originalNote.id,
                title: originalNote.title,
                content: originalNote.content,
                savedAt: new Date().toISOString()
            };
            await dbService.addNoteVersion(version);
        }
        
        await dbService.updateNote(noteToSave);
        
        if (originalNote && (noteToSave.content !== originalNote.content || noteToSave.title !== originalNote.title)) {
          debouncedAiSync(noteToSave.id);
        }
      } catch (err) {
        displayError(err);
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    [displayError, debouncedAiSync]
  );

  const handleNoteUpdate = useCallback((noteId: string, updates: Partial<Note>) => {
      const noteToUpdate = notes.find(n => n.id === noteId);
      if (!noteToUpdate) return;
      
      const updatedNote = { ...noteToUpdate, ...updates, updatedAt: new Date().toISOString() };
      
      setNotes(prevNotes => prevNotes.map(note => note.id === noteId ? updatedNote : note));
      
      saveNoteChanges(updatedNote);
    }, [notes, saveNoteChanges]);

  const handleDeleteNote = async (id: string) => {
    const noteToDelete = notes.find(note => note.id === id);
    if (!noteToDelete) return;

    const notesAfterDelete = notes.filter(note => note.id !== id);
    setNotes(notesAfterDelete);
    if (activeNoteId === id) {
        const sorted = notesAfterDelete.filter(n => !n.isArchived).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setActiveNoteId(sorted.length > 0 ? sorted[0].id : null);
    }
    
    try {
      await dbService.deleteNote(id);
    } catch (err) {
      displayError(err);
      setNotes(notes);
    }
  };
  
  const handleFilesUpload = async (files: FileList, projectId: string | null, newProjectName: string) => {
    if (!files || files.length === 0 || !ensureApiKey('File Upload & Analysis')) return;
    
    setIsUploading(true);
    setIsUploadModalOpen(false);

    let targetProjectName: string | undefined = undefined;

    try {
        if (newProjectName) {
            const newProject: Project = { id: crypto.randomUUID(), name: newProjectName.trim(), description: 'Uploaded content project', subjects: [] };
            await dbService.addProject(newProject);
            setProjects(prev => [...prev, newProject]);
            targetProjectName = newProject.name;
        } else if (projectId) {
            const project = projects.find(p => p.id === projectId);
            if (project) targetProjectName = project.name;
        }
    } catch (err) {
        displayError(err);
        setIsUploading(false);
        return;
    }
    
    const processFile = async (file: File): Promise<{ note: Note | null; error?: string }> => {
        try {
            let contentForAI: string = '', textContent: string = '';
            
            if (file.type.startsWith('image/') || file.type === 'application/pdf') {
                contentForAI = await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result as string);
                    reader.onerror = rej;
                    reader.readAsDataURL(file);
                });
                textContent = `Content from ${file.name}.`;
                if(file.type === 'application/pdf') {
                  const arrayBuffer = await file.arrayBuffer();
                  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                  let fullText = '';
                  for (let i = 1; i <= pdf.numPages; i++) {
                      const page = await pdf.getPage(i);
                      const content = await page.getTextContent();
                      fullText += content.items.map((s: any) => s.str).join(' ') + '\n';
                  }
                  if(fullText.trim()) textContent = fullText;
                }
            } else if (file.name.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
                textContent = result.value;
                contentForAI = textContent;
            } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                const readXlsxFile = (await import('read-excel-file')).default;
                const rows = await readXlsxFile(file);
                if (rows.length === 0) throw new Error("Excel file is empty.");
                let markdownTable = `| ${rows[0].map(c => c ?? '').join(' | ')} |\n| ${rows[0].map(() => '---').join(' | ')} |\n`;
                for (let i = 1; i < rows.length; i++) markdownTable += `| ${rows[i].map(c => c ?? '').join(' | ')} |\n`;
                textContent = markdownTable;
                contentForAI = textContent;
            } else { 
                textContent = await file.text();
                contentForAI = textContent;
            }
            if (!contentForAI.trim()) throw new Error("Could not extract content from file.");
            
            const task: AiTask = { type: 'UPLOAD_ANALYSIS', file, fileContent: contentForAI, targetProjectName };
            const result = await processAiTask(task, userSettings!, projects);
            if (result.type !== 'organizedContent') throw new Error("Unexpected AI response for file upload.");
            
            const organizedData = result.data;
            const { projectId, subjectId } = await findOrCreateProjectAndSubject(organizedData.project, organizedData.subject);

            const now = new Date().toISOString();
            const newNote: Note = {
                id: crypto.randomUUID(), createdAt: now, updatedAt: now, 
                isArchived: false, attachments: [], content: textContent, 
                ...organizedData, projectId, subjectId, disableAiSync: false,
            };
            return { note: newNote };
        } catch (err) {
            return { note: null, error: `Failed processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}` };
        }
    };
    const results = await Promise.all(Array.from(files).map(processFile));
    const createdNotes = results.filter(r => r.note).map(r => r.note as Note);
    if (results.some(r=>r.error)) displayError(new Error(results.filter(r => r.error).map(r => r.error).join('\n')));
    if (createdNotes.length > 0) {
        await dbService.bulkAddNotes(createdNotes);
        setNotes(prevNotes => [...createdNotes, ...prevNotes]);
        setActiveNoteId(createdNotes[0].id);
    }
    setIsUploading(false);
  };
  
  const handleFinishMeeting = async (data: { transcript?: string; audioBase64?: string, audioMimeType?: string }, screenshots: string[]) => {
      if (!ensureApiKey('Meeting Assistant')) return;
      setIsMeetingModalOpen(false);
      
      const hasContent = data.transcript?.trim() || data.audioBase64?.trim();
      if (!hasContent) {
          displayError(new Error("Meeting contained no audio or transcript."));
          return;
      }
  
      setIsProcessingMeeting(true);
      try {
          const task: AiTask = data.transcript
              ? { type: 'MEETING_ANALYSIS', transcript: data.transcript, screenshots }
              : { type: 'TRANSCRIBE_AUDIO', audioData: data.audioBase64!, mimeType: data.audioMimeType!, screenshots };
          
          const result = await processAiTask(task, userSettings!, projects);
          if (result.type !== 'organizedContent') throw new Error("Unexpected AI response for meeting processing.");
  
          const organizedData = result.data;
          const { projectId, subjectId } = await findOrCreateProjectAndSubject(organizedData.project, organizedData.subject);
          
          const now = new Date().toISOString();
          const content = data.transcript ? data.transcript : organizedData.detailedSummary;
          
          const newNote: Note = {
              id: crypto.randomUUID(), 
              content: content, 
              createdAt: now, 
              updatedAt: now, 
              isArchived: false, 
              attachments: [], 
              ...organizedData,
              projectId, 
              subjectId, 
              disableAiSync: false,
          };
          
          await dbService.addNote(newNote);
          setNotes(prevNotes => [newNote, ...prevNotes]);
          setActiveNoteId(newNote.id);
      } catch(err) { 
          displayError(err); 
      } finally { 
          setIsProcessingMeeting(false); 
      }
  };

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !ensureApiKey('Cognito AI Chat')) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), text: message, sender: 'user' };
    setChatMessages(prev => [...prev, userMessage]);
    setIsBotThinking(true);
    try {
        const task: AiTask = { type: 'CHAT_QUERY', question: message, notes };
        const result = await processAiTask(task, userSettings!, projects);
        if (result.type !== 'chatResponse') throw new Error("Unexpected AI response for chat.");
        
        const { answer, sourceNoteIds } = result.data;
        const aiMessage: ChatMessage = { id: crypto.randomUUID(), text: answer, sender: 'ai', sourceNoteIds };
        setChatMessages(prev => [...prev, aiMessage]);
    } catch (err) { displayError(err); } 
    finally { setIsBotThinking(false); }
  };

  const handleExportNotes = async () => {
    try {
        const dataToExport: ExportData = {
            notes: await dbService.getAllNotes(),
            projects: await dbService.getProjects(),
            settings: await dbService.getUserSettings(),
            versions: await dbService.getNoteVersions(activeNoteId || '')
        };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `notetaker-ai-export-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    } catch (err) { displayError(err); }
  };

  const handleImportNotes = async () => {
    try {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            const text = await file.text();
            const importedData: ExportData = JSON.parse(text);

            if (!importedData.notes || !importedData.projects) {
                throw new Error("Invalid import file format.");
            }
            
            const message = t('prompts.import.confirm.message')
                .replace('{noteCount}', importedData.notes.length.toString())
                .replace('{projectCount}', importedData.projects.length.toString());
            
            const confirmed = window.confirm(message);

            if (confirmed) {
                setIsAppLoading(true);
                await dbService.importData(importedData);
                window.location.reload();
            }
        };
        input.click();
    } catch(err) {
        console.error("Import failed:", err);
        displayError(new Error(t('prompts.import.error')));
    }
  }

  const handleAiAction = async (task: AiTask) => {
      if (!activeNote || !ensureApiKey('AI Quick Actions')) return;
      setIsProcessing(true);
      try {
          const result = await processAiTask(task, userSettings!, projects);
          if (result.type === 'string') {
              handleNoteUpdate(activeNote.id, { content: result.data });
          } else if(result.type === 'string_append') {
              handleNoteUpdate(activeNote.id, { content: activeNote.content + result.data });
          }
      } catch (err) { displayError(err); } 
      finally { setIsProcessing(false); }
  };

  const handleGoToNote = (noteId: string) => {
    setActiveNoteId(noteId);
    setIsChatOpen(false);
    setIsSidebarOpen(false);
    setIsCommandPaletteOpen(false);
  };
  
  const handleGoToNoteFromMindMap = (noteId: string) => {
      setActiveNoteId(noteId);
      setIsMindMapOpen(false);
      setIsSidebarOpen(true);
  };
  
  const handleShowHistory = (noteId: string) => {
      setActiveNoteId(noteId);
      setIsHistoryModalOpen(true);
  }

  const handleRestoreVersion = (version: NoteVersion) => {
      handleNoteUpdate(version.noteId, { content: version.content, title: version.title });
  }

  const handleSetSearchFilter = (term: string) => {
    setSearchFilter(term);
    setTagFilter(null);
    setProjectFilter(null);
    setSemanticSearchResults(null);
  };
  
  const handleTagSelect = (tag: string) => {
    setTagFilter(tag);
    setProjectFilter(null);
    setSearchFilter('');
    setSearchTerm('');
    setSemanticSearchResults(null);
    setIsSidebarOpen(true);
  };
  
  const handleProjectSelect = (projectId: string | null) => {
    setProjectFilter(projectId);
    setTagFilter(null);
    setSearchFilter('');
    setSearchTerm('');
    setSemanticSearchResults(null);
    if(projectId) setActiveNoteId(null);
    setIsCommandPaletteOpen(false);
  }
  
  const handleSemanticSearch = useCallback(async (query: string) => {
      if (!query.trim() || !ensureApiKey('Semantic Search')) return;
      setIsProcessingSemantic(true);
      setSearchFilter(query);
      try {
          const task: AiTask = { type: 'SEMANTIC_SEARCH', query, notes };
          const result = await processAiTask(task, userSettings!, projects);
          if (result.type === 'semantic_search_results') {
              setSemanticSearchResults(result.data);
          }
      } catch (err) {
          displayError(err);
          setSemanticSearchResults([]);
      } finally {
          setIsProcessingSemantic(false);
      }
  }, [notes, userSettings, ensureApiKey, displayError]);

  const handleSaveCategory = async (type: 'project' | 'subject', newName: string, newDescription?: string) => {
    if (!editingCategory || !newName.trim()) {
        setEditingCategory(null);
        return;
    }

    const { id } = editingCategory;
    
    if (id === 'new' && type === 'project') {
        const newProject: Project = { id: crypto.randomUUID(), name: newName.trim(), description: newDescription, subjects: [{ id: crypto.randomUUID(), name: 'General' }] };
        await dbService.addProject(newProject);
        setProjects(prev => [...prev, newProject]);
    } else if (id.length > 1 && id !== 'new') {
        if (type === 'subject' && projects.some(p => p.id === id)) {
            const projectToUpdate = projects.find(p => p.id === id);
            if (!projectToUpdate || projectToUpdate.subjects.some(s => s.name.toLowerCase() === newName.toLowerCase().trim())) {
                displayError(new Error(`Subject "${newName}" already exists in this project.`));
                setEditingCategory(null);
                return;
            }
            const newSubject: Subject = { id: crypto.randomUUID(), name: newName.trim() };
            projectToUpdate.subjects.push(newSubject);
            await dbService.updateProject(projectToUpdate);
            setProjects(prev => prev.map(p => p.id === id ? projectToUpdate : p));
        } else {
            if (type === 'project') {
                const projectToUpdate = projects.find(p => p.id === id);
                if (projectToUpdate) {
                    projectToUpdate.name = newName;
                    projectToUpdate.description = newDescription;
                    await dbService.updateProject(projectToUpdate);
                    setProjects(prev => prev.map(p => p.id === id ? projectToUpdate : p));
                }
            } else { // subject
                const projectToUpdate = projects.find(p => p.subjects.some(s => s.id === id));
                if (projectToUpdate) {
                    const subjectToUpdate = projectToUpdate.subjects.find(s => s.id === id);
                    if (subjectToUpdate) subjectToUpdate.name = newName;
                    await dbService.updateProject(projectToUpdate);
                    setProjects(prev => prev.map(p => p.id === projectToUpdate.id ? projectToUpdate : p));
                }
            }
        }
    }
    setEditingCategory(null);
  };
  
  const handleAddSubjectToProject = async (name: string, projectId: string): Promise<string | null> => {
    const projectToUpdate = projects.find(p => p.id === projectId);
    if (!projectToUpdate) {
        displayError(new Error("Project not found."));
        return null;
    }

    const existingSubject = projectToUpdate.subjects.find(s => s.name.toLowerCase() === name.trim().toLowerCase());
    if (existingSubject) {
        return existingSubject.id;
    }

    const newSubject: Subject = { id: crypto.randomUUID(), name: name.trim() };
    const updatedProject = {
        ...projectToUpdate,
        subjects: [...projectToUpdate.subjects, newSubject]
    };

    await dbService.updateProject(updatedProject);
    setProjects(prev => prev.map(p => p.id === projectId ? updatedProject : p));
    return newSubject.id;
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    const { type, id } = deletingCategory;
    if (type === 'project') {
      const notesInProject = await dbService.getNotesByProjectId(id);
      if (notesInProject.length > 0) {
        displayError(new Error("Cannot delete a project that contains notes."));
        setDeletingCategory(null);
        return;
      }
      await dbService.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } else { // subject
      const notesInSubject = notes.filter(n => n.subjectId === id);
      if (notesInSubject.length > 0) {
        displayError(new Error("Cannot delete a subject that contains notes."));
        setDeletingCategory(null);
        return;
      }
      const projectToUpdate = projects.find(p => p.subjects.some(s => s.id === id));
      if (projectToUpdate) {
        projectToUpdate.subjects = projectToUpdate.subjects.filter(s => s.id !== id);
        await dbService.updateProject(projectToUpdate);
        setProjects(prev => prev.map(p => p.id === projectToUpdate.id ? projectToUpdate : p));
      }
    }
    setDeletingCategory(null);
  };
  
  const handleInstallApp = async () => {
    if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const { outcome } = await deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        setDeferredInstallPrompt(null);
    }
  };

  const commandPaletteActions = {
      onNewNote: () => { setIsTemplateModalOpen(true); setIsCommandPaletteOpen(false); },
      onStartMeeting: () => { setIsMeetingModalOpen(true); setIsCommandPaletteOpen(false); },
      onUploadContent: () => { setIsUploadModalOpen(true); setIsCommandPaletteOpen(false); },
      onSettings: () => { setIsSettingsModalOpen(true); setIsCommandPaletteOpen(false); },
      onToggleTheme: () => handleSaveSettings({ theme: userSettings?.theme === 'light' ? 'dark' : 'light' }),
      onGoToNote: handleGoToNote,
      onGoToProject: handleProjectSelect,
  };

  if (isAppLoading) {
    return <div className="flex h-screen items-center justify-center bg-primary"><Spinner /></div>;
  }

  return (
    <>
      <OnboardingModal isOpen={isFirstTimeSetup} onComplete={handleOnboardingComplete} />
      <InteractiveTutorial isOpen={isTutorialOpen} onComplete={() => setIsTutorialOpen(false)} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)}
        notes={notes} projects={projects} actions={commandPaletteActions}
      />
      {editingCategory && (
        <NameEditModal 
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSave={(newName, newDescription) => handleSaveCategory(editingCategory.type, newName, newDescription)}
          currentName={editingCategory.name}
          currentDescription={editingCategory.description}
          itemType={editingCategory.type}
        />
      )}
      {deletingCategory && (
        <ConfirmModal
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onConfirm={handleDeleteCategory}
          title={`Delete ${deletingCategory.type}`}
          message={`Are you sure you want to delete the ${deletingCategory.type} "${deletingCategory.name}"? This action cannot be undone.`}
        />
      )}
      {userSettings && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          onSave={handleSaveSettings}
          currentSettings={userSettings}
        />
      )}
       <MeetingModeModal
        isOpen={isMeetingModalOpen} onClose={() => setIsMeetingModalOpen(false)} onFinish={handleFinishMeeting} isProcessing={isProcessingMeeting}
      />
      <ProcessingOverlay isOpen={isProcessingMeeting} message={t('meeting.buttons.processing')} />
      <UploadModal
        isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUpload={handleFilesUpload} isUploading={isUploading}
        projects={projects}
      />
      <TemplateSelectionModal
        isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} templates={templates} projects={projects}
        onCreate={(templateId?: string) => { handleAddNote(templateId); setIsTemplateModalOpen(false); }}
      />
       <MindMapModal
        isOpen={isMindMapOpen}
        onClose={() => setIsMindMapOpen(false)}
        notes={notes.filter(n => !n.isArchived)}
        projects={projects}
        onSelectNote={handleGoToNoteFromMindMap}
       />
       {activeNoteId && (
          <VersionHistoryModal 
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            noteId={activeNoteId}
            onRestore={handleRestoreVersion}
          />
       )}

      <div className="flex h-screen font-sans bg-primary text-light relative overflow-hidden">
        {isSidebarOpen && (<div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>)}

        <aside className={`fixed inset-y-0 left-0 z-40 w-80 h-full flex flex-col bg-secondary border-r border-tertiary transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 md:w-1/3 md:max-w-sm shrink-0`}>
          <header className="p-4 border-b border-tertiary flex justify-between items-center shrink-0">
            <button onClick={() => { setActiveNoteId(null); setProjectFilter(null); setTagFilter(null); }} className="flex items-center gap-3" aria-label="Go to dashboard">
                <Logo id="app-logo" className={`w-9 h-9 transition-all duration-500 ${isSyncing ? 'animate-pulse' : ''}`}/>
                <h1 className="text-xl font-bold tracking-tight">NoteTaker AI</h1>
            </button>
            <div className="flex items-center gap-2">
                 <button
                    onClick={() => setIsMindMapOpen(true)}
                    className="p-2 rounded-md hover:bg-tertiary transition-colors duration-200"
                    title="Mind Map"
                    aria-label="Open Mind Map View"
                >
                    <IconBrainCircuit className="w-6 h-6 text-subtle hover:text-light" />
                </button>
                <DropdownMenu 
                    onNewNote={() => setIsTemplateModalOpen(true)} 
                    onUpload={() => setIsUploadModalOpen(true)} 
                    isUploading={isUploading} 
                    onExport={handleExportNotes} 
                    onImport={handleImportNotes}
                    onSettings={() => setIsSettingsModalOpen(true)} 
                    onStartMeeting={() => setIsMeetingModalOpen(true)} 
                    isProcessingMeeting={isProcessingMeeting}
                    deferredInstallPrompt={deferredInstallPrompt}
                    onInstallApp={handleInstallApp}
                />
            </div>
          </header>
          {isAppLoading ? (
            <div className="flex-grow flex items-center justify-center"><Spinner /></div>
          ) : (
            <NoteList 
              notes={notes} projects={sortedProjects} activeNoteId={activeNoteId} onSelectNote={(id) => {setActiveNoteId(id); setIsSidebarOpen(false);}} onDeleteNote={handleDeleteNote}
              searchTerm={searchTerm} setSearchTerm={setSearchTerm}
              searchFilter={searchFilter} onSetSearchFilter={handleSetSearchFilter}
              sortBy={sortBy} setSortBy={setSortBy}
              showArchived={showArchived} setShowArchived={setShowArchived}
              tagFilter={tagFilter} onTagSelect={handleTagSelect} onClearTagFilter={() => { setTagFilter(null); }}
              projectFilter={projectFilter} onProjectSelect={handleProjectSelect}
              onAddProject={() => setEditingCategory({type: 'project', id: 'new', name: '', description: ''})}
              onAddSubject={(projectId) => setEditingCategory({type: 'subject', id: projectId, name: ''})}
              onEditCategory={setEditingCategory}
              onDeleteCategory={setDeletingCategory}
              isSemanticSearch={isSemanticSearch}
              setIsSemanticSearch={setIsSemanticSearch}
              onSemanticSearch={handleSemanticSearch}
              semanticSearchResults={semanticSearchResults}
              isProcessingSemantic={isProcessingSemantic}
            />
          )}
        </aside>

        <main className="w-full flex-grow flex flex-col md:w-2/3">
          {error && (<div className={`absolute top-4 right-4 bg-red-500 text-white p-3 rounded-lg shadow-lg z-50 max-w-sm transition-all duration-300 ease-in-out ${showError ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`} role="alert"> <p className="font-bold mb-1">{t('prompts.error.title')}</p> <pre className="whitespace-pre-wrap font-sans text-sm">{error}</pre> </div>)}
          {activeNote ? (
            <NoteEditor 
              key={activeNote.id} note={activeNote} onNoteUpdate={handleNoteUpdate}
              isProcessing={isProcessing} isSaving={isSaving} isSyncing={isSyncing}
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} onTagSelect={handleTagSelect}
              projects={projects}
              allNotes={notes}
              settings={userSettings!}
              onAiAction={handleAiAction}
              onShowHistory={handleShowHistory}
              onAddSubject={handleAddSubjectToProject}
            />
          ) : ( 
            <Dashboard
                notes={notes} onNewNote={() => setIsTemplateModalOpen(true)} onStartMeeting={() => setIsMeetingModalOpen(true)} onUploadContent={() => setIsUploadModalOpen(true)}
                onSelectNote={setActiveNoteId} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
                projects={sortedProjects} onSelectProject={handleProjectSelect}
                onEditCategory={(category) => setEditingCategory({ ...category, id: category.id, name: category.name, description: category.description })}
                onDeleteCategory={setDeletingCategory}
                onAddProject={() => setEditingCategory({type: 'project', id: 'new', name: '', description: ''})}
                onExportNotes={handleExportNotes}
             /> 
           )}
        </main>

        <button onClick={() => setIsChatOpen(true)} id="chatbot-button" className="absolute bottom-6 right-6 bg-accent text-white p-4 rounded-full shadow-lg hover:bg-highlight transition-all duration-300 z-20 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-highlight focus:ring-opacity-50" title={t('chatbot.title')} aria-label={t('chatbot.title')}>
          <IconCognito className="w-8 h-8"/>
        </button>

        <Chatbot 
          isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={chatMessages} onSendMessage={handleSendMessage}
          isThinking={isBotThinking} notes={notes} onGoToNote={handleGoToNote}
        />
      </div>
    </>
  );
};

export default App;