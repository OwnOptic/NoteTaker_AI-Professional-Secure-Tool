import React, { useState, useEffect, useRef } from 'react';
import { NoteVersion } from '../types';
import * as dbService from '../services/dbService';
import { IconClose, IconClock } from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalization } from '../hooks/useLocalization';
import Spinner from './Spinner';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    noteId: string;
    onRestore: (version: NoteVersion) => void;
}

const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose, noteId, onRestore }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();
    useFocusTrap(modalRef, isOpen, onClose);

    const [versions, setVersions] = useState<NoteVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && noteId) {
            setIsLoading(true);
            dbService.getNoteVersions(noteId)
                .then(fetchedVersions => {
                    setVersions(fetchedVersions);
                    setSelectedVersion(fetchedVersions[0] || null);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else {
            setVersions([]);
            setSelectedVersion(null);
        }
    }, [isOpen, noteId]);

    if (!isOpen) return null;

    const handleRestoreClick = () => {
        if (selectedVersion) {
            onRestore(selectedVersion);
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
            onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="history-title"
        >
            <div 
                ref={modalRef} tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-4xl m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} style={{animationFillMode: 'forwards'}}
            >
                <header className="p-4 border-b border-tertiary flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <IconClock className="w-6 h-6 text-accent"/>
                        <h2 id="history-title" className="text-lg font-bold">{t('history.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label={t('settings.buttons.close')}>
                        <IconClose className="w-6 h-6"/>
                    </button>
                </header>

                <main className="flex-grow flex overflow-hidden">
                    <aside className="w-1/3 border-r border-tertiary overflow-y-auto">
                        {isLoading ? <div className="flex justify-center items-center h-full"><Spinner /></div> : (
                            versions.length > 0 ? (
                                <ul>
                                    {versions.map(v => (
                                        <li key={v.id}>
                                            <button 
                                                onClick={() => setSelectedVersion(v)}
                                                className={`w-full text-left p-3 border-l-4 ${selectedVersion?.id === v.id ? 'bg-tertiary border-accent' : 'border-transparent hover:bg-tertiary/50'}`}
                                            >
                                                <p className="font-semibold">{new Date(v.savedAt).toLocaleString()}</p>
                                                <p className="text-sm text-subtle truncate">{v.title}</p>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className="p-4 text-subtle text-center">{t('history.empty')}</p>
                        )}
                    </aside>
                    <section className="w-2/3 overflow-y-auto p-6 bg-primary">
                        {selectedVersion ? (
                            <div className="prose text-light max-w-none" dangerouslySetInnerHTML={{ __html: selectedVersion.content }} />
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center text-subtle">
                                <IconClock className="w-16 h-16 text-tertiary mb-4" />
                                <h3 className="text-xl font-semibold text-light">{t('history.selectVersion')}</h3>
                            </div>
                        )}
                    </section>
                </main>

                <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-end">
                    <button 
                        onClick={handleRestoreClick}
                        disabled={!selectedVersion}
                        className="px-6 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors disabled:bg-tertiary disabled:cursor-not-allowed"
                    >
                        {t('history.restore')}
                    </button>
                </footer>
                 <style>{`
                    @keyframes fade-in-scale {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                    }
                    .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                 `}</style>
            </div>
        </div>
    );
};

export default VersionHistoryModal;
