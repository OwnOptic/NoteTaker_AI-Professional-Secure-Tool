import { Note, UserSettings, Project, ExportData, NoteVersion, Subject } from '../types';
import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'NoteTakerDB';
const DB_VERSION = 10; // Incremented version for note history

const NOTES_STORE = 'notes';
const USER_SETTINGS_STORE = 'userSettings';
const PROJECTS_STORE = 'projects';
const NOTE_VERSIONS_STORE = 'noteVersions';
const SETTINGS_KEY = 'main_settings';

interface NoteTakerDB {
  [NOTES_STORE]: {
    key: string;
    value: Note;
    indexes: { 'by_projectId': string };
  };
  [USER_SETTINGS_STORE]: {
    key: string;
    value: UserSettings;
  };
  [PROJECTS_STORE]: {
      key: string;
      value: Project;
      indexes: { 'by_name': string };
  };
  [NOTE_VERSIONS_STORE]: {
    key: string;
    value: NoteVersion;
    indexes: { 'by_noteId': string };
  }
}

let dbPromise: Promise<IDBPDatabase<NoteTakerDB>> | null = null;

const initDB = () => {
  if (dbPromise) return dbPromise;
  
  dbPromise = openDB<NoteTakerDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, tx) {
      if (oldVersion < 9) { // Previous migrations consolidated
          if (!db.objectStoreNames.contains(NOTES_STORE)) {
              const noteStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
              noteStore.createIndex('by_projectId', 'projectId');
          }
          if (!db.objectStoreNames.contains(USER_SETTINGS_STORE)) {
              db.createObjectStore(USER_SETTINGS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
              const projectStore = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
              projectStore.createIndex('by_name', 'name', { unique: true });
          }
           const settingsStore = tx.objectStore(USER_SETTINGS_STORE);
           settingsStore.get('main_settings').then(settings => {
              if (settings) {
                  settings.theme = settings.theme || 'dark';
                  settings.aiPerformanceProfile = settings.aiPerformanceProfile || 'max-quality';
                  settingsStore.put(settings);
              }
          });
          const notesStore = tx.objectStore(NOTES_STORE);
          notesStore.getAll().then(notes => {
              const updatePromises = notes.map(note => {
                  if (note.disableAiSync === undefined) { note.disableAiSync = false; }
                  return notesStore.put(note);
              });
              return Promise.all(updatePromises);
          });
      }
      if (oldVersion < 10) { // Add note versions store
        if (!db.objectStoreNames.contains(NOTE_VERSIONS_STORE)) {
            const versionStore = db.createObjectStore(NOTE_VERSIONS_STORE, { keyPath: 'id' });
            versionStore.createIndex('by_noteId', 'noteId');
        }
      }
    },
  });
  return dbPromise;
};

// Notes
export const getAllNotes = async (): Promise<Note[]> => {
    const db = await initDB();
    return await db.getAll(NOTES_STORE);
};
export const getNotesByProjectId = async (projectId: string): Promise<Note[]> => {
    const db = await initDB();
    return await db.getAllFromIndex(NOTES_STORE, 'by_projectId', projectId);
};
export const getNote = async (id: string): Promise<Note | undefined> => {
    const db = await initDB();
    return await db.get(NOTES_STORE, id);
};
export const addNote = async (note: Note): Promise<void> => {
    const db = await initDB();
    await db.add(NOTES_STORE, note);
};
export const updateNote = async (note: Note): Promise<void> => {
    const db = await initDB();
    await db.put(NOTES_STORE, note);
};
export const deleteNote = async (id: string): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction([NOTES_STORE, NOTE_VERSIONS_STORE], 'readwrite');
    await tx.objectStore(NOTES_STORE).delete(id);
    const versions = await tx.objectStore(NOTE_VERSIONS_STORE).index('by_noteId').getAll(id);
    await Promise.all(versions.map(v => tx.objectStore(NOTE_VERSIONS_STORE).delete(v.id)));
    await tx.done;
};
export const bulkAddNotes = async (notes: Note[]): Promise<void> => {
    const db = await initDB();
    const tx = db.transaction(NOTES_STORE, 'readwrite');
    await Promise.all(notes.map(note => tx.store.put(note)));
    await tx.done;
};

// Note Versions
export const addNoteVersion = async (version: NoteVersion): Promise<void> => {
    const db = await initDB();
    await db.add(NOTE_VERSIONS_STORE, version);
};
export const getNoteVersions = async (noteId: string): Promise<NoteVersion[]> => {
    const db = await initDB();
    const versions = await db.getAllFromIndex(NOTE_VERSIONS_STORE, 'by_noteId', noteId);
    return versions.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
};
export const clearAllVersions = async (): Promise<void> => {
    const db = await initDB();
    await db.clear(NOTE_VERSIONS_STORE);
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
    const db = await initDB();
    return await db.getAll(PROJECTS_STORE);
}
export const addProject = async (project: Project): Promise<void> => {
    const db = await initDB();
    await db.add(PROJECTS_STORE, project);
}
export const updateProject = async (project: Project): Promise<void> => {
    const db = await initDB();
    await db.put(PROJECTS_STORE, project);
}
export const deleteProject = async (projectId: string): Promise<void> => {
    const db = await initDB();
    await db.delete(PROJECTS_STORE, projectId);
}


// User Settings
export const getUserSettings = async (): Promise<UserSettings | undefined> => {
    const db = await initDB();
    return await db.get(USER_SETTINGS_STORE, SETTINGS_KEY);
};
export const saveUserSettings = async (settings: UserSettings): Promise<void> => {
    const db = await initDB();
    await db.put(USER_SETTINGS_STORE, settings);
};

// Import/Export
export const importData = async (data: ExportData): Promise<void> => {
    const db = await initDB();
    const stores: ('notes' | 'projects' | 'userSettings' | 'noteVersions')[] = [NOTES_STORE, PROJECTS_STORE, USER_SETTINGS_STORE];
    if(data.versions) stores.push(NOTE_VERSIONS_STORE);

    const tx = db.transaction(stores, 'readwrite');

    if (data.settings) {
        data.settings.theme = data.settings.theme || 'dark';
        data.settings.aiPerformanceProfile = data.settings.aiPerformanceProfile || 'max-quality';
        await tx.objectStore(USER_SETTINGS_STORE).put(data.settings);
    }

    for (const importedProject of data.projects) {
        // FIX: Explicitly typing `existingProject` resolves an issue where TypeScript
        // infers it as `unknown`, causing errors when accessing its properties.
        const existingProject: Project | undefined = await tx.objectStore(PROJECTS_STORE).index('by_name').get(importedProject.name);
        if (existingProject) {
            const subjectNames = new Set((existingProject.subjects || []).map(s => s.name));
            (importedProject.subjects || []).forEach(importedSub => {
                if (!subjectNames.has(importedSub.name)) {
                    existingProject.subjects.push(importedSub);
                }
            });
            await tx.objectStore(PROJECTS_STORE).put(existingProject);
        } else {
            await tx.objectStore(PROJECTS_STORE).put(importedProject);
        }
    }
    
    const allProjects = await tx.objectStore(PROJECTS_STORE).getAll();
    const projectMap = new Map(allProjects.map(p => [p.name, p]));

    for (const importedNote of data.notes) {
        importedNote.disableAiSync = importedNote.disableAiSync || false;
        
        const originalProject = data.projects.find(p => p.id === importedNote.projectId);
        const originalProjectSubjects = (originalProject && Array.isArray(originalProject.subjects)) ? originalProject.subjects : [];
        const originalSubject = originalProjectSubjects.find(s => s.id === importedNote.subjectId);

        if (originalProject && originalSubject) {
            const newProject = projectMap.get(originalProject.name);
            if(newProject){
                const newProjectSubjects = (newProject && Array.isArray(newProject.subjects)) ? newProject.subjects : [];
                const newSubject = newProjectSubjects.find(s => s.name === originalSubject.name);
                if(newSubject){
                    importedNote.projectId = newProject.id;
                    importedNote.subjectId = newSubject.id;
                }
            }
        }
        // Always add the note, even if re-linking fails, to prevent data loss.
        await tx.objectStore(NOTES_STORE).put(importedNote);
    }
    
    if (data.versions) {
        for(const version of data.versions) {
            await tx.objectStore(NOTE_VERSIONS_STORE).put(version);
        }
    }

    await tx.done;
};