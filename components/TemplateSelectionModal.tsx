

import React, { useRef } from 'react';
import { Note, Project } from '../types';
import { IconClose, IconFileText, IconFolder, IconDocumentAdd } from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalization } from '../hooks/useLocalization';

interface TemplateSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    templates: Note[];
    onCreate: (templateId?: string) => void;
    projects: Project[];
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ isOpen, onClose, templates, onCreate, projects }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();
    useFocusTrap(modalRef, isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="template-selection-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-2xl m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animationFillMode: 'forwards'}}
            >
                <header className="p-4 border-b border-tertiary flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <IconDocumentAdd className="w-6 h-6 text-accent"/>
                        <h2 id="template-selection-title" className="text-lg font-bold">{t('menu.newNote')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label={t('settings.buttons.close')}>
                        <IconClose className="w-6 h-6"/>
                    </button>
                </header>

                <main className="p-4 md:p-6 max-h-[60vh] overflow-y-auto">
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <li>
                            <button 
                                onClick={() => onCreate()}
                                className="w-full h-full text-left bg-primary p-4 rounded-lg border border-tertiary hover:border-highlight hover:bg-tertiary transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <h3 className="font-semibold text-light flex items-center gap-2"><IconDocumentAdd className="w-4 h-4 text-highlight"/>{t('template.blankNote.title')}</h3>
                                    <p className="text-sm text-subtle line-clamp-2 mt-2">{t('template.blankNote.description')}</p>
                                </div>
                                <div className="text-right text-xs text-accent font-semibold mt-3">
                                    {t('template.buttons.create')}
                                </div>
                            </button>
                        </li>
                       {templates.map(template => {
                            const project = projects.find(p => p.id === template.projectId);
                            const subject = project?.subjects.find(s => s.id === template.subjectId);
                           return (
                           <li key={template.id}>
                               <button 
                                    onClick={() => onCreate(template.id)}
                                    className="w-full h-full text-left bg-primary p-4 rounded-lg border border-tertiary hover:border-highlight hover:bg-tertiary transition-all flex flex-col justify-between"
                                >
                                   <div>
                                        <h3 className="font-semibold text-light flex items-center gap-2"><IconFileText className="w-4 h-4 text-highlight"/>{template.title}</h3>
                                        <p className="text-xs text-subtle mt-1 flex items-center gap-2"><IconFolder className="w-3 h-3"/>{project?.name} / {subject?.name}</p>
                                        <p className="text-sm text-subtle line-clamp-2 mt-2">{template.summary}</p>
                                   </div>
                                   <div className="text-right text-xs text-accent font-semibold mt-3">
                                       {t('template.buttons.use')}
                                   </div>
                               </button>
                           </li>
                       )})}
                         {templates.length === 0 && (
                            <div className="flex items-center justify-center p-4 bg-primary rounded-lg text-center text-subtle h-full">
                                <div>
                                    <p className="font-semibold text-light">{t('template.empty.title')}</p>
                                    <p>{t('template.empty.description')}</p>
                                </div>
                            </div>
                        )}
                    </ul>
                </main>

                 <style>{`
                    @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                    }
                    .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                    .line-clamp-2 {
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-box-orient: vertical;
                        -webkit-line-clamp: 2;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default TemplateSelectionModal;
