
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Note } from '../types';
import { IconClose, IconSend, IconCognito, IconDots, IconGoTo } from './Icons';
import { useLocalization } from '../hooks/useLocalization';

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isThinking: boolean;
    notes: Note[];
    onGoToNote: (noteId: string) => void;
}

const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isThinking, notes, onGoToNote }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { t } = useLocalization();

    const suggestedPrompts = [
        t('chatbot.suggestedPrompt1'),
        t('chatbot.suggestedPrompt2'),
        t('chatbot.suggestedPrompt3'),
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isThinking]);
    
    useEffect(() => {
        if (!isOpen) { setInput(''); }
    }, [isOpen]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isThinking) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    const ChatbotWindow = (
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-40 transition-opacity duration-300"
        onClick={onClose}
      >
          <div 
            id="chatbot-window"
            className="bg-secondary rounded-lg shadow-2xl w-full max-w-2xl h-full max-h-[80vh] flex flex-col font-sans text-light transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale"
            onClick={(e) => e.stopPropagation()}
            style={{animationFillMode: 'forwards'}}
          >
              <header className="p-4 border-b border-tertiary flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3"><IconCognito className="w-7 h-7 text-accent"/><h2 className="text-lg font-bold">{t('chatbot.title')}</h2></div>
                  <button onClick={onClose} className="p-1 rounded-full text-subtle hover:text-light hover:bg-tertiary" aria-label={t('chatbot.close')}><IconClose className="w-6 h-6"/></button>
              </header>

              <main className="flex-grow p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center text-subtle">
                          <IconCognito className="w-16 h-16 mb-4 text-tertiary" />
                          <h3 className="text-xl font-semibold text-light">{t('chatbot.welcome.title')}</h3>
                          <p className="max-w-md">{t('chatbot.welcome.description')}</p>
                          <div className="mt-6 w-full max-w-md space-y-2">
                            {suggestedPrompts.map(prompt => (
                                <button key={prompt} onClick={() => onSendMessage(prompt)} className="w-full text-sm text-left p-2 bg-primary/70 rounded-md hover:bg-tertiary transition-colors">
                                    {prompt}
                                </button>
                            ))}
                          </div>
                      </div>
                  ) : (
                      <div className="space-y-4">
                          {messages.map((msg) => (
                              <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  {msg.sender === 'ai' && <IconCognito className="w-8 h-8 p-1 bg-tertiary rounded-full text-accent shrink-0" />}
                                  <div className={`max-w-xl p-3 rounded-xl flex flex-col ${msg.sender === 'user' ? 'bg-accent text-white rounded-br-none' : 'bg-tertiary text-light rounded-bl-none'}`}>
                                      <p className="text-base whitespace-pre-wrap">{msg.text}</p>
                                      {msg.sender === 'ai' && msg.sourceNoteIds && msg.sourceNoteIds.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-primary/50 flex flex-wrap gap-2">
                                          {msg.sourceNoteIds.map(noteId => {
                                            const note = notes.find(n => n.id === noteId);
                                            if (!note) return null;
                                            return (
                                              <button key={noteId} onClick={() => onGoToNote(noteId)} className="flex items-center gap-1.5 text-xs bg-primary hover:bg-highlight/20 text-light px-2 py-1 rounded transition-colors">
                                                <IconGoTo className="w-3 h-3" />
                                                <span>{note.title}</span>
                                              </button>
                                            )
                                          })}
                                        </div>
                                      )}
                                  </div>
                              </div>
                          ))}
                          {isThinking && (
                              <div className="flex gap-3 justify-start items-end">
                                  <IconCognito className="w-8 h-8 p-1 bg-tertiary rounded-full text-accent shrink-0" />
                                  <div className="max-w-lg p-3 rounded-xl bg-tertiary flex items-center justify-center h-12"><IconDots className="w-10 text-subtle" /></div>
                              </div>
                          )}
                          <div ref={messagesEndRef} />
                      </div>
                  )}
              </main>
              
              <footer className="p-4 border-t border-tertiary shrink-0">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <input type="text" value={input} onChange={(e) => setInput(e.target.value)} className="w-full bg-primary p-3 rounded-md placeholder-subtle text-light focus:outline-none focus:ring-2 focus:ring-highlight disabled:cursor-not-allowed" placeholder={t('chatbot.input.placeholder')} aria-label="Chat input" disabled={isThinking} />
                    <button type="submit" className="bg-accent text-white p-3 rounded-md hover:bg-highlight disabled:bg-tertiary disabled:cursor-not-allowed transition-colors" disabled={!input.trim() || isThinking} aria-label={t('chatbot.buttons.send')}>
                        <IconSend className="w-6 h-6"/>
                    </button>
                </form>
              </footer>
          </div>
          <style>{`
            @keyframes fade-in-scale { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            .animate-fade-in-scale { animation: fade-in-scale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
          `}</style>
      </div>
    );
    
    return isOpen ? ChatbotWindow : null;
};

export default Chatbot;