import React from 'react';
import { IconCognito } from './Icons';
import { useLocalization } from '../hooks/useLocalization';

interface ProcessingOverlayProps {
    isOpen: boolean;
    message: string;
}

const ProcessingOverlay: React.FC<ProcessingOverlayProps> = ({ isOpen, message }) => {
    const { t } = useLocalization();
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex flex-col justify-center items-center z-[60] transition-opacity duration-300 animate-fade-in" 
            role="alert" 
            aria-live="assertive"
        >
            <div className="relative mb-6">
                <IconCognito className="w-20 h-20 text-accent animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-2 border-highlight/50 rounded-full animate-spin-slow"></div>
                </div>
            </div>
            <p className="text-light text-xl font-semibold">{message}</p>
            <p className="text-subtle text-base mt-1">{t('prompts.waitMessage')}</p>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow { animation: spin-slow 3s linear infinite; }
            `}</style>
        </div>
    );
};

export default ProcessingOverlay;
