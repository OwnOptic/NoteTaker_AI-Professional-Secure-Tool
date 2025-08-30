import React, { useState, useRef, useEffect } from 'react';
import { IconClose, Logo } from './Icons';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { useLocalization } from '../hooks/useLocalization';
import { UserSettings } from '../types';

interface OnboardingModalProps {
    isOpen: boolean;
    onComplete: (settings: Pick<UserSettings, 'uiLanguage' | 'apiKey'>) => void;
}

const UI_LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
];

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onComplete }) => {
    const { t, setLanguage, language } = useLocalization();
    const [apiKey, setApiKey] = useState('');
    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, isOpen);

    useEffect(() => {
      const browserLang = navigator.language.split('-')[0];
      if (UI_LANGUAGES.some(l => l.code === browserLang)) {
        setLanguage(browserLang);
      }
    }, [setLanguage]);

    if (!isOpen) return null;

    const handleComplete = () => {
        onComplete({ uiLanguage: language, apiKey });
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
        >
            <div 
                ref={modalRef}
                tabIndex={-1}
                className="bg-secondary rounded-lg shadow-2xl w-full max-w-lg m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
                style={{animationFillMode: 'forwards'}}
            >
                <header className="p-6 border-b border-tertiary flex flex-col items-center text-center">
                    <Logo className="w-12 h-12 mb-3 text-accent"/>
                    <h2 id="onboarding-title" className="text-2xl font-bold">{t('onboarding.title')}</h2>
                    <p className="text-subtle mt-1">{t('onboarding.subtitle')}</p>
                </header>

                <main className="p-6 space-y-6 overflow-y-auto">
                    <div>
                        <label htmlFor="ui-language-select" className="text-md font-semibold text-light mb-2 block">{t('onboarding.language.label')}</label>
                        <p className="text-subtle text-sm mb-2">{t('onboarding.language.description')}</p>
                        <select
                            id="ui-language-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full bg-primary p-3 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                        >
                            {UI_LANGUAGES.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>

                    <div className="border border-tertiary rounded-lg p-4">
                        <h3 className="text-md font-semibold text-light mb-2 block">{t('onboarding.apiKey.label')}</h3>
                         <p className="text-subtle text-sm mb-2">{t('onboarding.apiKey.description')}</p>
                        <input
                            id="api-key-input"
                            type="password"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={t('onboarding.apiKey.placeholder')}
                            className="w-full bg-primary p-2 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
                        />
                         <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:text-highlight mt-2 block">
                            {t('onboarding.apiKey.link')}
                        </a>
                    </div>
                </main>

                <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-center">
                    <button 
                        onClick={handleComplete}
                        disabled={!apiKey.trim()}
                        className="px-8 py-3 text-md font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors w-full disabled:bg-tertiary disabled:cursor-not-allowed"
                    >
                        {t('onboarding.buttons.start')}
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

export default OnboardingModal;