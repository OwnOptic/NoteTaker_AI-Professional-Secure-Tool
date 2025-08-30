
import React, { useState, useRef } from 'react';
import { IconClose, IconUpload } from './Icons';
import Spinner from './Spinner';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalization } from '../hooks/useLocalization';
import { Project } from '../types';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpload: (files: FileList, projectId: string | null, newProjectName: string) => void;
    isUploading: boolean;
    projects: Project[];
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onUpload, isUploading, projects }) => {
    const [files, setFiles] = useState<FileList | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('ai');
    const [newProjectName, setNewProjectName] = useState('');
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();
    useFocusTrap(modalRef, isOpen, onClose);

    if (!isOpen) return null;

    const handleUploadClick = () => {
        if (files) {
            const finalProjectId = selectedProjectId === 'ai' || selectedProjectId === 'new' ? null : selectedProjectId;
            const finalNewProjectName = selectedProjectId === 'new' ? newProjectName : '';
            onUpload(files, finalProjectId, finalNewProjectName);
        }
    };
    
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files) {
            setFiles(e.target.files);
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
            onClick={onClose}
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-lg m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                onClick={(e) => e.stopPropagation()}
                style={{animationFillMode: 'forwards'}}
            >
                <header className="p-4 border-b border-tertiary flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <IconUpload className="w-6 h-6 text-accent"/>
                        <h2 className="text-lg font-bold">{t('upload.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label="Close modal">
                        <IconClose className="w-6 h-6"/>
                    </button>
                </header>

                <main className="p-6 space-y-6">
                    <div>
                        <h3 className="text-md font-semibold text-light mb-2">{t('upload.selectFiles')}</h3>
                        <p className="text-subtle text-sm mb-3">
                            {t('upload.info')}
                        </p>
                        <div 
                            className="w-full p-6 border-2 border-dashed border-tertiary rounded-md text-center cursor-pointer hover:border-highlight hover:bg-primary/50 transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept=".txt,.md,.docx,.pdf,image/png,image/jpeg,image/webp,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" />
                            <IconUpload className="w-8 h-8 mx-auto text-subtle mb-2"/>
                            {files && files.length > 0 ? (
                                <p className="text-light">{t('upload.dropzone.selected').replace('{count}', files.length.toString())}</p>
                            ) : (
                                <p className="text-subtle">{t('upload.dropzone.browse')}</p>
                            )}
                            <p className="text-xs text-subtle mt-1">{t('upload.dropzone.supported')}</p>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="project-select" className="text-md font-semibold text-light mb-2 block">{t('upload.assignProject.label')}</label>
                        <select
                            id="project-select"
                            value={selectedProjectId}
                            onChange={(e) => setSelectedProjectId(e.target.value)}
                            className="w-full bg-primary p-3 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                        >
                            <option value="ai">{t('upload.assignProject.ai')}</option>
                            <option value="new" className="font-bold text-accent">{t('upload.assignProject.new')}</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        {selectedProjectId === 'new' && (
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder={t('upload.assignProject.placeholder')}
                                className="w-full bg-primary p-2 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight mt-2"
                            />
                        )}
                    </div>
                </main>

                <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-end">
                    <button 
                        onClick={handleUploadClick}
                        disabled={!files || isUploading || (selectedProjectId === 'new' && !newProjectName.trim())}
                        className="px-6 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors flex items-center gap-2 disabled:bg-tertiary disabled:cursor-not-allowed"
                    >
                        {isUploading ? <><Spinner /> {t('upload.buttons.uploading')}</> : t('upload.buttons.upload')}
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

export default UploadModal;