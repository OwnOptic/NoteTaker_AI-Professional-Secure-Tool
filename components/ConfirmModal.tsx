
import React, { useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { IconInfo, IconClose } from './Icons';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-secondary rounded-lg shadow-2xl w-full max-w-md m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animationFillMode: 'forwards' }}
      >
        <header className="p-4 border-b border-tertiary flex justify-between items-center">
            <h2 id="confirm-title" className="text-lg font-bold flex items-center gap-2"><IconInfo className="w-6 h-6 text-yellow-400" />{title}</h2>
            <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label="Close">
                <IconClose className="w-6 h-6"/>
            </button>
        </header>
        <main className="p-6">
          <p id="confirm-message" className="text-light/90">{message}</p>
        </main>
        <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-light bg-tertiary rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-500 transition-colors"
          >
            Confirm
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

export default ConfirmModal;