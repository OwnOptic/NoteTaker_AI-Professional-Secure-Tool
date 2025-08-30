import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Note, Project } from '../types';
import { IconSearch, IconDocumentAdd, IconFolder, IconSettings, IconVideo, IconUpload, IconClose } from './Icons';
import { useLocalization } from '../hooks/useLocalization';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface Command {
    id: string;
    type: 'action' | 'note' | 'project';
    title: string;
    icon: React.FC<React.SVGProps<SVGSVGElement>>;
    action: () => void;
    keywords?: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    notes: Note[];
    projects: Project[];
    actions: {
        onNewNote: () => void;
        onStartMeeting: () => void;
        onUploadContent: () => void;
        onSettings: () => void;
        onToggleTheme: () => void;
        onGoToNote: (noteId: string) => void;
        onGoToProject: (projectId: string | null) => void;
    };
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, notes, projects, actions }) => {
    const { t } = useLocalization();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLUListElement>(null);
    useFocusTrap(modalRef, isOpen, onClose);

    const commands: Command[] = useMemo(() => {
        const commandList: Command[] = [
            { id: 'new-note', type: 'action', title: t('command.newNote'), icon: IconDocumentAdd, action: actions.onNewNote, keywords: 'create blank empty' },
            { id: 'start-meeting', type: 'action', title: t('command.startMeeting'), icon: IconVideo, action: actions.onStartMeeting, keywords: 'record transcribe' },
            { id: 'upload-content', type: 'action', title: t('command.uploadContent'), icon: IconUpload, action: actions.onUploadContent, keywords: 'import file pdf' },
            { id: 'toggle-theme', type: 'action', title: t('command.toggleTheme'), icon: IconSettings, action: actions.onToggleTheme, keywords: 'dark light mode' },
            { id: 'open-settings', type: 'action', title: t('command.openSettings'), icon: IconSettings, action: actions.onSettings, keywords: 'configure api key' },
        ];
        
        notes.filter(n => !n.isArchived).forEach(note => {
            commandList.push({
                id: `note-${note.id}`, type: 'note', title: note.title, icon: IconDocumentAdd, action: () => actions.onGoToNote(note.id)
            });
        });
        
        projects.forEach(project => {
            commandList.push({
                id: `project-${project.id}`, type: 'project', title: project.name, icon: IconFolder, action: () => actions.onGoToProject(project.id)
            });
        });

        return commandList;
    }, [t, notes, projects, actions]);
    
    const filteredCommands = useMemo(() => {
        if (!query) return commands.slice(0, 10); // Show some default commands
        const lowerQuery = query.toLowerCase();
        return commands.filter(cmd => 
            cmd.title.toLowerCase().includes(lowerQuery) || 
            cmd.type.toLowerCase().includes(lowerQuery) ||
            (cmd.keywords && cmd.keywords.toLowerCase().includes(lowerQuery))
        ).slice(0, 20);
    }, [query, commands]);

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
        } else {
            inputRef.current?.focus();
        }
    }, [isOpen]);
    
    useEffect(() => {
      setSelectedIndex(0);
    }, [filteredCommands]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => (i + 1) % filteredCommands.length);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => (i - 1 + filteredCommands.length) % filteredCommands.length);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const command = filteredCommands[selectedIndex];
                if (command) {
                    command.action();
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filteredCommands, selectedIndex, onClose]);

    useEffect(() => {
        resultsRef.current?.children[selectedIndex]?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex]);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-start z-50 pt-24"
            onClick={onClose} role="dialog" aria-modal="true"
        >
            <div
                ref={modalRef} tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-xl m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()} style={{animationFillMode: 'forwards'}}
            >
                <div className="p-3 border-b border-tertiary flex items-center gap-3">
                    <IconSearch className="w-5 h-5 text-subtle shrink-0"/>
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={t('command.placeholder')}
                        className="w-full bg-transparent focus:outline-none text-light placeholder-subtle"
                    />
                     <button onClick={onClose} className="p-1 text-xs font-semibold bg-tertiary rounded">ESC</button>
                </div>

                <ul ref={resultsRef} className="max-h-[60vh] overflow-y-auto p-2">
                    {filteredCommands.length > 0 ? filteredCommands.map((cmd, index) => (
                        <li key={cmd.id}>
                            <button
                                onClick={() => { cmd.action(); onClose(); }}
                                className={`w-full text-left flex items-center gap-3 p-3 rounded-md transition-colors ${selectedIndex === index ? 'bg-accent' : 'hover:bg-tertiary'}`}
                            >
                                <cmd.icon className={`w-5 h-5 shrink-0 ${selectedIndex === index ? 'text-white' : 'text-highlight'}`}/>
                                <span className={`${selectedIndex === index ? 'text-white' : 'text-light'}`}>{cmd.title}</span>
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${selectedIndex === index ? 'bg-white/20 text-white' : 'bg-tertiary text-subtle'}`}>{t(`command.type.${cmd.type}`)}</span>
                            </button>
                        </li>
                    )) : (
                        <p className="text-center p-8 text-subtle">{t('command.noResults')}</p>
                    )}
                </ul>
                <style>{`
                    @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                    .animate-fade-in-scale { animation: fade-in-scale 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
                `}</style>
            </div>
        </div>
    );
};

export default CommandPalette;