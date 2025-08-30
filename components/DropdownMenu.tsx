

import React, { useState, useRef, useEffect } from 'react';
import { IconMenu, IconDocumentAdd, IconUpload, IconDownload, IconSettings, IconVideo } from './Icons';
import { useLocalization } from '../hooks/useLocalization';

interface DropdownMenuProps {
    onNewNote: () => void;
    onUpload: () => void;
    isUploading: boolean;
    onExport: () => void;
    onImport: () => void;
    onSettings: () => void;
    onStartMeeting: () => void;
    isProcessingMeeting: boolean;
    deferredInstallPrompt: any;
    onInstallApp: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ 
    onNewNote, onUpload, isUploading, onExport, onImport, onSettings, onStartMeeting, isProcessingMeeting,
    deferredInstallPrompt, onInstallApp
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleSelect = (action: () => void) => {
        action();
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                id="main-menu-button"
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-md hover:bg-tertiary transition-colors duration-200"
                title="Menu"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <IconMenu className="w-6 h-6 text-subtle hover:text-light" />
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 origin-top-right bg-secondary rounded-md shadow-lg ring-1 ring-tertiary ring-opacity-50 focus:outline-none z-30"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="p-2" role="none">
                        <div className="px-2 pt-1 pb-2 text-xs font-bold text-subtle uppercase tracking-wider">{t('menu.create')}</div>
                        <button
                            onClick={() => handleSelect(onNewNote)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md"
                            role="menuitem"
                        >
                            <IconDocumentAdd className="w-5 h-5 text-highlight" />
                            <span>{t('menu.newNote')}</span>
                        </button>
                        <button
                            onClick={() => handleSelect(onStartMeeting)}
                            disabled={isProcessingMeeting}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md disabled:opacity-50"
                            role="menuitem"
                        >
                            {isProcessingMeeting ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-highlight"></div>
                            ) : (
                                <IconVideo className="w-5 h-5 text-highlight" />
                            )}
                            <span>{t('menu.startMeeting')}</span>
                        </button>
                        <button
                            onClick={() => handleSelect(onUpload)}
                            disabled={isUploading}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md disabled:opacity-50"
                            role="menuitem"
                        >
                            {isUploading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-highlight"></div>
                            ) : (
                                <IconUpload className="w-5 h-5 text-highlight" />
                            )}
                            <span>{t('menu.uploadContent')}</span>
                        </button>

                        <div className="border-t border-tertiary my-2"></div>
                        <div className="px-2 pt-1 pb-2 text-xs font-bold text-subtle uppercase tracking-wider">{t('menu.manage')}</div>
                        <button
                            onClick={() => handleSelect(onImport)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md"
                            role="menuitem"
                        >
                            <IconUpload className="w-5 h-5 text-highlight transform rotate-180" />
                            <span>{t('menu.import')}</span>
                        </button>
                        <button
                            onClick={() => handleSelect(onExport)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md"
                            role="menuitem"
                        >
                            <IconDownload className="w-5 h-5 text-highlight" />
                            <span>{t('menu.export')}</span>
                        </button>
                        
                        <div className="border-t border-tertiary my-2"></div>
                        <div className="px-2 pt-1 pb-2 text-xs font-bold text-subtle uppercase tracking-wider">{t('menu.app')}</div>
                        {deferredInstallPrompt && (
                            <button
                                onClick={() => handleSelect(onInstallApp)}
                                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md"
                                role="menuitem"
                            >
                                <IconDownload className="w-5 h-5 text-highlight" />
                                <span>{t('menu.installApp')}</span>
                            </button>
                        )}
                        <button
                            onClick={() => handleSelect(onSettings)}
                            className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-light hover:bg-tertiary transition-colors rounded-md"
                            role="menuitem"
                        >
                            <IconSettings className="w-5 h-5 text-highlight" />
                            <span>{t('menu.settings')}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DropdownMenu;
