import React, { useState, useRef, useEffect, useMemo } from 'react';
import { IconSettings, IconClose, IconKey, IconCheckCircle, IconInfo } from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalization } from '../hooks/useLocalization';
import { UserSettings } from '../types';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: Partial<UserSettings>) => void;
    currentSettings: UserSettings;
}

const AI_LANGUAGES = ["English", "Spanish", "French", "German", "Japanese", "Chinese", "Russian", "Portuguese", "Italian"];
const UI_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
];

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, currentSettings }) => {
    const { t } = useLocalization();
    const [aiLanguage, setAiLanguage] = useState(currentSettings.aiLanguage);
    const [uiLanguage, setUiLanguage] = useState(currentSettings.uiLanguage);
    const [apiKey, setApiKey] = useState(currentSettings.apiKey || '');
    const [theme, setTheme] = useState(currentSettings.theme || 'dark');
    const [aiProfile, setAiProfile] = useState(currentSettings.aiPerformanceProfile || 'max-quality');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen, onClose);
    
    useEffect(() => {
        if (isOpen) {
            setAiLanguage(currentSettings.aiLanguage);
            setUiLanguage(currentSettings.uiLanguage);
            setApiKey(currentSettings.apiKey || '');
            setTheme(currentSettings.theme || 'dark');
            setAiProfile(currentSettings.aiPerformanceProfile || 'max-quality');
        }
    }, [isOpen, currentSettings]);

    if (!isOpen) return null;

    const handleSave = () => {
        onSave({ uiLanguage, aiLanguage, apiKey, theme, aiPerformanceProfile: aiProfile });
    };

    const getApiKeyStatus = () => {
        if (apiKey) {
            return {
                title: t('settings.apiKey.status.userConnected'),
                desc: t('settings.apiKey.status.userConnected_desc'),
                Icon: IconCheckCircle,
                color: 'text-green-400',
            };
        }
        return {
            title: t('settings.apiKey.status.notConnected'),
            desc: t('settings.apiKey.status.notConnected_desc'),
            Icon: IconInfo,
            color: 'text-yellow-400',
        };
    };

    const status = getApiKeyStatus();

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
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
                        <IconSettings className="w-6 h-6 text-accent"/>
                        <h2 id="settings-title" className="text-lg font-bold">{t('settings.title')}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label={t('settings.buttons.close')}>
                        <IconClose className="w-6 h-6"/>
                    </button>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
                    <div>
                        <h3 className="text-md font-semibold text-light mb-2 block">{t('settings.theme.label')}</h3>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="theme" value="dark" checked={theme === 'dark'} onChange={(e) => setTheme(e.target.value as any)} className="form-radio bg-primary border-tertiary text-accent focus:ring-accent"/>
                                <span>{t('settings.theme.dark')}</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="theme" value="light" checked={theme === 'light'} onChange={(e) => setTheme(e.target.value as any)} className="form-radio bg-primary border-tertiary text-accent focus:ring-accent"/>
                                <span>{t('settings.theme.light')}</span>
                            </label>
                        </div>
                    </div>

                    <div className="border border-tertiary rounded-lg p-4">
                        <h3 className="text-md font-semibold text-light mb-2 block">{t('settings.apiKey.label')}</h3>
                        <div className="flex items-start gap-3 bg-primary/50 p-3 rounded-md">
                            <status.Icon className={`w-6 h-6 shrink-0 mt-0.5 ${status.color}`} />
                            <div>
                                <h4 className={`font-semibold ${status.color}`}>{status.title}</h4>
                                <p className="text-subtle text-sm">{status.desc}</p>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label htmlFor="api-key-input" className="text-sm font-medium text-light/90 mb-1 block">{t('settings.apiKey.user.label')}</label>
                             <p className="text-subtle text-xs mb-2">{t('settings.apiKey.user.description')}</p>
                            <input
                                id="api-key-input"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={t('settings.apiKey.user.placeholder')}
                                className="w-full bg-primary p-2 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                            />
                             <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-highlight mt-2 block">
                                {t('settings.apiKey.user.link')}
                            </a>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-semibold text-light mb-2 block">{t('settings.aiProfile.label')}</h3>
                        <div className="space-y-3">
                            <label className="block p-3 border border-tertiary rounded-md hover:border-highlight cursor-pointer has-[:checked]:border-highlight has-[:checked]:bg-primary/50">
                                <input type="radio" name="ai-profile" value="max-quality" checked={aiProfile === 'max-quality'} onChange={(e) => setAiProfile(e.target.value as any)} className="sr-only"/>
                                <span className="font-semibold text-light">{t('settings.aiProfile.quality.label')}</span>
                                <p className="text-sm text-subtle">{t('settings.aiProfile.quality.description')}</p>
                            </label>
                             <label className="block p-3 border border-tertiary rounded-md hover:border-highlight cursor-pointer has-[:checked]:border-highlight has-[:checked]:bg-primary/50">
                                <input type="radio" name="ai-profile" value="balanced" checked={aiProfile === 'balanced'} onChange={(e) => setAiProfile(e.target.value as any)} className="sr-only"/>
                                <span className="font-semibold text-light">{t('settings.aiProfile.balanced.label')}</span>
                                <p className="text-sm text-subtle">{t('settings.aiProfile.balanced.description')}</p>
                            </label>
                             <label className="block p-3 border border-tertiary rounded-md hover:border-highlight cursor-pointer has-[:checked]:border-highlight has-[:checked]:bg-primary/50">
                                <input type="radio" name="ai-profile" value="max-savings" checked={aiProfile === 'max-savings'} onChange={(e) => setAiProfile(e.target.value as any)} className="sr-only"/>
                                <span className="font-semibold text-light">{t('settings.aiProfile.savings.label')}</span>
                                <p className="text-sm text-subtle">{t('settings.aiProfile.savings.description')}</p>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="ui-language-select" className="text-md font-semibold text-light mb-2 block">{t('settings.uiLanguage.label')}</label>
                        <p className="text-subtle text-sm mb-2">{t('settings.uiLanguage.description')}</p>
                        <select
                            id="ui-language-select"
                            value={uiLanguage}
                            onChange={(e) => setUiLanguage(e.target.value)}
                            className="w-full bg-primary p-3 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                        >
                            {UI_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="ai-language-select" className="text-md font-semibold text-light mb-2 block">{t('settings.aiLanguage.label')}</label>
                        <p className="text-subtle text-sm mb-2">{t('settings.aiLanguage.description')}</p>
                        <select
                            id="ai-language-select"
                            value={aiLanguage}
                            onChange={(e) => setAiLanguage(e.target.value)}
                            className="w-full bg-primary p-3 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                        >
                            {AI_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                        </select>
                    </div>
                </main>

                <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-end">
                    <button 
                        onClick={handleSave}
                        className="px-6 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors"
                    >
                        {t('settings.buttons.save')}
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

export default SettingsModal;