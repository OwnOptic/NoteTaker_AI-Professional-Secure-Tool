import React, { useState, useEffect, useRef } from 'react';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { IconEdit, IconClose } from './Icons';

interface NameEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newName: string, newDescription?: string) => void;
  currentName: string;
  currentDescription?: string;
  itemType: 'project' | 'subject';
}

const NameEditModal: React.FC<NameEditModalProps> = ({ isOpen, onClose, onSave, currentName, currentDescription, itemType }) => {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription || '');
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  useFocusTrap(modalRef, isOpen, onClose);

  useEffect(() => {
    if (isOpen) {
      setName(currentName);
      setDescription(currentDescription || '');
      // Timeout to allow modal to render before focusing
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, currentName, currentDescription]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), description.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !(e.target instanceof HTMLTextAreaElement)) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 transition-opacity duration-300"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-name-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-secondary rounded-lg shadow-2xl w-full max-w-md m-4 flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
        onClick={(e) => e.stopPropagation()}
        style={{ animationFillMode: 'forwards' }}
        onKeyDown={handleKeyDown}
      >
        <header className="p-4 border-b border-tertiary flex justify-between items-center">
          <h2 id="edit-name-title" className="text-lg font-bold flex items-center gap-2">
            <IconEdit className="w-6 h-6 text-accent" />
            {currentName ? `Rename ${itemType}` : `New ${itemType}`}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label="Close">
            <IconClose className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 space-y-4">
          <div>
            <label htmlFor="name-input" className="text-sm font-medium text-light/90 mb-1 block">
              {itemType === 'project' ? 'Project Name' : 'Subject Name'}
            </label>
            <input
              ref={inputRef}
              id="name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-primary p-2 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight"
            />
          </div>
          {itemType === 'project' && (
            <div>
              <label htmlFor="description-input" className="text-sm font-medium text-light/90 mb-1 block">
                Project Description <span className="text-subtle">(Optional)</span>
              </label>
               <textarea
                id="description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of this project's purpose..."
                rows={3}
                className="w-full bg-primary p-2 rounded-md text-light focus:outline-none focus:ring-2 focus:ring-highlight resize-none"
              />
            </div>
          )}
        </main>
        <footer className="p-4 bg-primary/30 rounded-b-lg border-t border-tertiary flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-light bg-tertiary rounded-md hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-semibold text-white bg-accent rounded-md hover:bg-highlight transition-colors disabled:bg-tertiary disabled:cursor-not-allowed"
          >
            Save
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

export default NameEditModal;