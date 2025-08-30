import React, { useState, useRef, useEffect } from 'react';
import { Note, AiTask } from '../types';
import { IconWand, IconArchive, IconBookmark, IconTranslate, IconClipboardText, IconChevronDown, IconDownload, IconFileText, IconShare, IconClock, IconAiActions } from './Icons';
import Spinner from './Spinner';
import { useLocalization } from '../hooks/useLocalization';

const LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Chinese", "Russian", "Portuguese", "Italian"];
const TONES = ["Professional", "Casual", "Confident", "Friendly", "Formal"];

interface ActionModalProps {
    title: string;
    options: string[];
    onSelect: (option: string) => void;
    onClose: () => void;
}

const ActionModal: React.FC<ActionModalProps> = ({ title, options, onSelect, onClose }) => (
    <div className="absolute top-full right-0 mt-2 w-48 bg-secondary rounded-md shadow-lg ring-1 ring-tertiary ring-opacity-50 z-40">
        <div className="p-2">
            <h4 className="text-xs font-bold text-subtle px-2 pb-1 uppercase">{title}</h4>
            <ul className="max-h-60 overflow-y-auto">
                {options.map(opt => (
                    <li key={opt}>
                        <button 
                            onClick={() => onSelect(opt)}
                            className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-tertiary"
                        >{opt}</button>
                    </li>
                ))}
            </ul>
        </div>
    </div>
);

interface NoteEditorToolbarProps {
    note: Note;
    onAiAction: (task: AiTask) => void;
    isProcessing: boolean;
    onArchive: (archive: boolean) => void;
    onSaveAsTemplate: (isTemplate: boolean) => void;
    onToggleAiSync: (disable: boolean) => void;
    onShowHistory: (noteId: string) => void;
    getSelectedText: () => string;
}

const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({
    note, onAiAction, isProcessing,
    onArchive, onSaveAsTemplate, onToggleAiSync, onShowHistory, getSelectedText
}) => {
    const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [activeAction, setActiveAction] = useState<'translate' | 'tone' | null>(null);
    
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();

    const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, handler: () => void) => {
      useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                handler();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }, [ref, handler]);
    }

    useOutsideClick(actionsMenuRef, () => setIsActionsMenuOpen(false));
    useOutsideClick(shareMenuRef, () => setIsShareMenuOpen(false));
    
    const executeAction = (taskType: 'TRANSLATE' | 'CHANGE_TONE' | 'SUMMARIZE_SELECTION', param: any) => {
        let task: AiTask;
        const content = taskType === 'SUMMARIZE_SELECTION' ? param : note.content;
        
        switch (taskType) {
            case 'TRANSLATE': task = { type: 'TRANSLATE', content, targetLanguage: param }; break;
            case 'CHANGE_TONE': task = { type: 'CHANGE_TONE', content, tone: param }; break;
            case 'SUMMARIZE_SELECTION': task = { type: 'SUMMARIZE_SELECTION', content }; break;
            default: return;
        }
        onAiAction(task);
        setIsActionsMenuOpen(false);
        setActiveAction(null);
    };

    const handleExportHTML = () => {
        const blob = new Blob([note.content], { type: 'text/html' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        a.click();
        URL.revokeObjectURL(a.href);
        setIsShareMenuOpen(false);
    }
    
    const handlePrint = () => {
        window.print();
        setIsShareMenuOpen(false);
    }

    return (
        <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => onToggleAiSync(!note.disableAiSync)} className={`p-2 rounded-md transition-colors duration-200 ${note.disableAiSync ? 'bg-tertiary text-subtle hover:bg-secondary' : 'bg-highlight/20 text-highlight'}`} title={note.disableAiSync ? t('noteEditor.menu.enableAiSync') : t('noteEditor.menu.disableAiSync')}>
                <IconWand className="w-5 h-5" />
            </button>
            <button onClick={() => onShowHistory(note.id)} className="p-2 rounded-md bg-tertiary text-light hover:bg-secondary transition-colors duration-200" title={t('noteEditor.menu.history')} aria-label={t('noteEditor.menu.history')}>
                <IconClock className="w-5 h-5"/>
            </button>
            <button onClick={() => onSaveAsTemplate(!note.isTemplate)} className={`p-2 rounded-md transition-colors duration-200 ${note.isTemplate ? 'bg-highlight/20 text-highlight' : 'bg-tertiary text-light hover:bg-secondary'}`} title={note.isTemplate ? t('noteEditor.menu.removeFromTemplate') : t('noteEditor.menu.saveAsTemplate')} aria-label={note.isTemplate ? t('noteEditor.menu.removeFromTemplate') : t('noteEditor.menu.saveAsTemplate')}>
                <IconBookmark className={`w-5 h-5 ${note.isTemplate ? 'fill-current' : ''}`}/>
            </button>
            <button onClick={() => onArchive(!note.isArchived)} className="p-2 rounded-md bg-tertiary text-light hover:bg-secondary transition-colors duration-200" title={note.isArchived ? t('noteEditor.menu.unarchive') : t('noteEditor.menu.archive')} aria-label={note.isArchived ? t('noteEditor.menu.unarchive') : t('noteEditor.menu.archive')}>
                <IconArchive className="w-5 h-5"/>
            </button>

             <div className="relative" ref={shareMenuRef}>
                 <button onClick={() => setIsShareMenuOpen(!isShareMenuOpen)} className="p-2 rounded-md bg-tertiary text-light hover:bg-secondary transition-colors duration-200" title={t('noteEditor.menu.share')} aria-haspopup="true" aria-expanded={isShareMenuOpen}>
                     <IconShare className="w-5 h-5"/>
                 </button>
                 {isShareMenuOpen && (
                     <div className="absolute top-full right-0 mt-2 w-56 bg-secondary rounded-md shadow-lg ring-1 ring-tertiary ring-opacity-50 z-30 p-2 space-y-1" role="menu">
                         <button onClick={handleExportHTML} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md" role="menuitem">
                             <IconDownload className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.exportHTML')}</span>
                         </button>
                         <button onClick={handlePrint} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md" role="menuitem">
                            <IconFileText className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.printPDF')}</span>
                         </button>
                     </div>
                 )}
            </div>

            <div className="relative" ref={actionsMenuRef}>
                <button id="quick-actions-button" onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)} disabled={isProcessing} className="px-3 py-2 rounded-md bg-accent text-white hover:bg-highlight transition-colors duration-200 flex items-center gap-2 shrink-0 disabled:bg-tertiary disabled:cursor-not-allowed" title={t('noteEditor.menu.aiActions')} aria-haspopup="true" aria-expanded={isActionsMenuOpen}>
                    {isProcessing ? <Spinner /> : <IconAiActions className="w-5 h-5" />}
                    <span className="hidden md:inline font-semibold">{isProcessing ? t('noteEditor.menu.aiActions.working') : t('noteEditor.menu.aiActions.actions')}</span>
                    <IconChevronDown className={`w-4 h-4 transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isActionsMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-64 bg-secondary rounded-md shadow-lg ring-1 ring-tertiary ring-opacity-50 z-30 p-2 space-y-1" role="menu">
                        <button onClick={() => onAiAction({ type: 'CONTINUE_WRITING', note })} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md" role="menuitem">
                            <IconWand className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.aiActions.continueWriting')}</span>
                        </button>
                        <button onClick={() => setActiveAction('translate')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md" role="menuitem">
                            <IconTranslate className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.aiActions.translate')}</span>
                        </button>
                        <button onClick={() => setActiveAction('tone')} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md" role="menuitem">
                            <IconAiActions className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.aiActions.changeTone')}</span>
                        </button>
                        <button onClick={() => executeAction('SUMMARIZE_SELECTION', getSelectedText())} disabled={!getSelectedText()} className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed" role="menuitem">
                            <IconClipboardText className="w-5 h-5 text-highlight"/><span>{t('noteEditor.menu.aiActions.summarizeSelection')}</span>
                        </button>
                        {activeAction === 'translate' && <ActionModal title={t('noteEditor.menu.aiActions.translateTo')} options={LANGUAGES} onSelect={(lang) => executeAction('TRANSLATE', lang)} onClose={() => setActiveAction(null)} />}
                        {activeAction === 'tone' && <ActionModal title={t('noteEditor.menu.aiActions.changeToneTo')} options={TONES} onSelect={(tone) => executeAction('CHANGE_TONE', tone)} onClose={() => setActiveAction(null)} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoteEditorToolbar;