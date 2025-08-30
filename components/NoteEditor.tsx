import React, { useState, useMemo, useEffect } from 'react';
import { Note, ImageAttachment, Project, AiTask, UserSettings } from '../types';
import { IconListCheck, IconMenu, IconXCircle, IconFileText, IconUsers, IconTags, IconChevronRight, IconCheckCircle, IconClipboardText, IconChartBar, IconChevronDown, IconGoTo, IconPlusCircle } from './Icons';
import NoteEditorToolbar from './NoteEditorToolbar';
import { useLocalization } from '../hooks/useLocalization';
import DataGraph from './DataGraph';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface NoteEditorProps {
  note: Note;
  projects: Project[];
  allNotes: Note[];
  settings: UserSettings;
  onNoteUpdate: (noteId: string, updates: Partial<Note>) => void;
  onAiAction: (task: AiTask) => void;
  isProcessing: boolean;
  isSaving: boolean;
  isSyncing: boolean;
  onMenuClick: () => void;
  onTagSelect: (tag: string) => void;
  onShowHistory: (noteId: string) => void;
  onAddSubject: (name: string, projectId: string) => Promise<string | null>;
}

const CategorySelector: React.FC<{
    items: {id: string, name: string}[],
    selectedId: string,
    onSelect: (id: string) => void,
    onCreate?: (name: string) => void,
    type: 'project' | 'subject',
}> = ({ items, selectedId, onSelect, onCreate, type }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    React.useEffect(() => {
        if(isOpen){
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const selectedItem = items.find(i => i.id === selectedId);

    const filteredItems = query 
        ? items.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
        : items;
    
    const showCreateOption = onCreate && query.trim() && !items.some(i => i.name.toLowerCase() === query.trim().toLowerCase());

    const handleSelect = (id: string) => {
        onSelect(id);
        setIsOpen(false);
        setQuery('');
    }

    const handleCreate = () => {
        if(onCreate && query.trim()){
            onCreate(query.trim());
            setIsOpen(false);
            setQuery('');
        }
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-1 p-1 rounded-md hover:bg-tertiary transition-colors">
                <span>{selectedItem?.name || 'Select'}</span>
                <IconChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-primary border border-tertiary rounded-md shadow-2xl z-30 flex flex-col">
                    {onCreate && (
                        <div className="p-2 border-b border-tertiary">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder={`Find or create a ${type}...`}
                                value={query}
                                onKeyDown={(e) => e.key === 'Enter' && showCreateOption && handleCreate()}
                                onChange={e => setQuery(e.target.value)}
                                className="w-full bg-secondary p-2 rounded-md text-sm text-light placeholder-subtle focus:outline-none focus:ring-2 focus:ring-highlight"
                            />
                        </div>
                    )}
                    <ul className="p-1 max-h-48 overflow-y-auto">
                        {filteredItems.length === 0 && !showCreateOption && (
                            <li className="px-3 py-1.5 text-sm text-subtle text-center">No {type}s found.</li>
                        )}
                        {filteredItems.map(item => (
                            <li key={item.id}>
                                <button onClick={() => handleSelect(item.id)} className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-tertiary block truncate">
                                    {item.name}
                                </button>
                            </li>
                        ))}
                        {showCreateOption && (
                             <li>
                                <button onClick={handleCreate} className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-tertiary flex items-center gap-2 text-accent">
                                    <IconPlusCircle className="w-4 h-4"/> Create "{query.trim()}"
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    )
}


const NoteEditor: React.FC<NoteEditorProps> = ({ 
  note, projects, allNotes, settings, onNoteUpdate, onAiAction,
  isProcessing, isSaving, isSyncing,
  onMenuClick, onTagSelect, onShowHistory, onAddSubject,
}) => {
  const [tagInput, setTagInput] = useState("");
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('preview');
  const { t } = useLocalization();
  const [sanitizedHtml, setSanitizedHtml] = useState('');
  const [sanitizedDetailedSummary, setSanitizedDetailedSummary] = useState('');

  useEffect(() => {
    if (!note) {
        setSanitizedHtml('');
        return;
    }

    const generateHtml = async () => {
        const renderer = new marked.Renderer();
        renderer.link = ({ href, title, text }) => {
            return `<a href="${href || ''}" title="${title || ''}" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">${text}</a>`;
        };

        const rawHtml = await marked(note.content || '', { renderer, breaks: true, async: true });
        const sanitized = DOMPurify.sanitize(rawHtml);

        const finalHtml = sanitized.replace(/\[\[([^\]]+)\]\]/g, (match, title) => {
            const linkedNote = allNotes.find(n => n.title.toLowerCase() === title.toLowerCase().trim());
            if (linkedNote) {
                return `<a href="#" data-note-link="${linkedNote.id}" class="text-accent hover:underline bg-tertiary/50 px-1 py-0.5 rounded-sm no-underline">${title}</a>`;
            }
            return `<span class="text-red-400 bg-tertiary/50 px-1 py-0.5 rounded-sm">${title} (not found)</span>`;
        });
        setSanitizedHtml(finalHtml);
    };

    generateHtml();
  }, [note, note.content, allNotes]);
  
  useEffect(() => {
      const generateSummaryHtml = async () => {
          if (note?.detailedSummary) {
              const rawHtml = await marked(note.detailedSummary, { breaks: true, async: true });
              setSanitizedDetailedSummary(DOMPurify.sanitize(rawHtml));
          } else {
              setSanitizedDetailedSummary('');
          }
      };
      generateSummaryHtml();
  }, [note?.detailedSummary]);

  const mentions = useMemo(() => {
    if (!note) return [];
    return allNotes.filter(n => n.id !== note.id && n.content.includes(`[[${note.title}]]`));
  }, [allNotes, note]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onNoteUpdate(note.id, { title: e.target.value });
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNoteUpdate(note.id, { content: e.target.value });
  };
  
  const getSelectedText = React.useCallback(() => {
    const selection = window.getSelection();
    return selection ? selection.toString() : "";
  }, []);

  const handleAddAttachment = (attachment: ImageAttachment) => {
    const newAttachments = [...(note.attachments || []), attachment];
    onNoteUpdate(note.id, { attachments: newAttachments });
  };
  const handleRemoveAttachment = (attachmentId: string) => {
    const newAttachments = (note.attachments || []).filter(att => att.id !== attachmentId);
    onNoteUpdate(note.id, { attachments: newAttachments });
  };
  
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if(file){
                const reader = new FileReader();
                reader.onloadend = () => {
                    const newAttachment: ImageAttachment = { id: crypto.randomUUID(), data: reader.result as string, mimeType: file.type };
                    handleAddAttachment(newAttachment);
                };
                reader.readAsDataURL(file);
                e.preventDefault();
            }
        }
    }
  };

  const handleTagsUpdate = (newTags: string[]) => {
    onNoteUpdate(note.id, { tags: newTags });
  };
  const handleAddTag = () => {
    const newTag = tagInput.trim().toLowerCase();
    if (newTag && !(note.tags || []).includes(newTag)) {
        handleTagsUpdate([...(note.tags || []), newTag]);
    }
    setTagInput("");
  };
  const handleRemoveTag = (tagToRemove: string) => {
    handleTagsUpdate((note.tags || []).filter(tag => tag !== tagToRemove));
  };
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleAddTag();
    }
  };

  const handleProjectChange = (newProjectId: string) => {
    const project = projects.find(p => p.id === newProjectId);
    if(project && project.subjects.length > 0) {
        onNoteUpdate(note.id, { projectId: newProjectId, subjectId: project.subjects[0].id });
    }
  };
  
  const handleCreateSubject = async (newSubjectName: string) => {
    if (!note) return;
    const newSubjectId = await onAddSubject(newSubjectName, note.projectId);
    if (newSubjectId) {
      onNoteUpdate(note.id, { subjectId: newSubjectId });
    }
  };

  const getStatusMessage = () => {
    if (isSyncing) return <span className="text-blue-400 font-semibold">{t('noteEditor.footer.syncing')}</span>;
    if (isSaving) return <span className="text-yellow-400 font-semibold">{t('noteEditor.footer.saving')}</span>;
    return <span>{t('noteEditor.footer.inSync')}</span>;
  }
  
  const currentProject = projects.find(p => p.id === note.projectId);
  const subjectsInProject = currentProject ? currentProject.subjects.sort((a,b) => a.name.localeCompare(b.name)) : [];

  return (
    <div id="note-editor" className="flex flex-col h-full bg-primary" onPaste={handlePaste}>
      <header className="relative z-30 p-4 border-b border-tertiary flex justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2 flex-grow min-w-0">
            <button onClick={onMenuClick} className="p-1 rounded-md hover:bg-tertiary md:hidden" aria-label="Open sidebar menu"> <IconMenu className="w-6 h-6" /> </button>
            <input type="text" value={note.title} onChange={handleTitleChange} className="text-2xl font-bold bg-transparent focus:outline-none w-full text-light placeholder-subtle truncate" placeholder={t('noteEditor.titlePlaceholder')} title={t('noteEditor.titlePlaceholder')} aria-label={t('noteEditor.titlePlaceholder')} />
        </div>
        <NoteEditorToolbar 
          note={note} onAiAction={onAiAction} isProcessing={isProcessing}
          onArchive={(archive) => onNoteUpdate(note.id, { isArchived: archive })}
          onSaveAsTemplate={(isTemplate) => onNoteUpdate(note.id, { isTemplate })}
          onToggleAiSync={(disable) => onNoteUpdate(note.id, { disableAiSync: disable })}
          onShowHistory={onShowHistory}
          getSelectedText={getSelectedText}
        />
      </header>
      
      <div className="relative z-20 px-6 py-2 flex items-center gap-x-4 border-b border-tertiary shrink-0 overflow-x-auto whitespace-nowrap" aria-label="Note categorization">
        <div className="flex items-center gap-2">
            <CategorySelector items={projects} selectedId={note.projectId} onSelect={handleProjectChange} type="project" />
            <IconChevronRight className="w-4 h-4 text-subtle shrink-0" />
            <CategorySelector 
                items={subjectsInProject} 
                selectedId={note.subjectId} 
                onSelect={(id) => onNoteUpdate(note.id, { subjectId: id })} 
                onCreate={handleCreateSubject}
                type="subject"
            />
        </div>
        <div className="h-5 w-px bg-tertiary"></div>
        <div className="flex items-center gap-1 bg-secondary p-1 rounded-md">
            <button
                onClick={() => setViewMode('edit')}
                className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'edit' ? 'bg-accent text-white' : 'text-subtle hover:bg-tertiary'}`}
                aria-pressed={viewMode === 'edit'}
                title={t('noteEditor.viewMode.edit')}
            >
                {t('noteEditor.viewMode.edit')}
            </button>
            <button
                onClick={() => setViewMode('preview')}
                className={`px-3 py-1 text-sm rounded transition-colors ${viewMode === 'preview' ? 'bg-accent text-white' : 'text-subtle hover:bg-tertiary'}`}
                aria-pressed={viewMode === 'preview'}
                title={t('noteEditor.viewMode.preview')}
            >
                {t('noteEditor.viewMode.preview')}
            </button>
        </div>
      </div>

      <div id="printable-content" className="flex-grow overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-x-6">
          <div className="px-6 py-4 flex flex-col h-full">
              <div className="w-full flex-grow">
                  {viewMode === 'edit' ? (
                      <textarea
                          value={note.content}
                          onChange={handleContentChange}
                          disabled={note.isArchived}
                          className="w-full h-full min-h-[50vh] bg-primary text-light focus:outline-none resize-none font-mono text-base leading-relaxed placeholder-subtle"
                          aria-label="Note content"
                          placeholder={t('noteEditor.contentPlaceholder')}
                      />
                  ) : (
                      <div
                          className="prose text-light max-w-none w-full"
                          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                      />
                  )}
              </div>

              {note.attachments && note.attachments.length > 0 && (
                  <div className="mt-auto pt-6">
                      <h4 className="text-md font-semibold text-light mb-3">{t('noteEditor.insights.attachments')}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                          {note.attachments.map(att => (
                              <div key={att.id} className="relative group aspect-square">
                                  <img src={att.data} alt="Note attachment" className="w-full h-full object-cover rounded-md"/>
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button onClick={() => handleRemoveAttachment(att.id)} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-500 transition-colors" title="Remove attachment" aria-label="Remove attachment"><IconXCircle className="w-6 h-6"/></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>

          <div id="note-editor-insights" className="px-6 py-4 border-t lg:border-t-0 lg:border-l border-tertiary flex flex-col gap-y-6 bg-secondary/20">
              {(note.summary && note.summary !== 'A new empty note.') && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="summary-heading">
                      <div className="flex items-center gap-3 mb-3"><IconFileText className="w-6 h-6 text-highlight shrink-0"/><h3 id="summary-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.summary')}</h3></div>
                      <p className="text-light/90 leading-relaxed text-base">{note.summary}</p>
                  </div>
              )}
               {mentions.length > 0 && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="mentions-heading">
                      <div className="flex items-center gap-3 mb-3"><IconGoTo className="w-6 h-6 text-highlight shrink-0 transform -rotate-45" /><h3 id="mentions-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.mentions')}</h3></div>
                      <ul className="space-y-1">
                          {mentions.map(mention => (
                              <li key={mention.id}>
                                  <a href="#" data-note-link={mention.id} className="text-sm text-highlight hover:underline p-1 rounded-md -ml-1">{mention.title}</a>
                              </li>
                          ))}
                      </ul>
                  </div>
               )}
              {note.graphData && note.graphData.data.length > 0 && (
                 <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="graph-heading">
                    <div className="flex items-center gap-3 mb-3">
                      <IconChartBar className="w-6 h-6 text-highlight shrink-0"/>
                      <h3 id="graph-heading" className="text-lg font-semibold text-light">{note.graphData.config.title || t('noteEditor.insights.dataVisualization')}</h3>
                    </div>
                    <DataGraph data={note.graphData} />
                 </div>
              )}
              {(note.detailedSummary) && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="detailed-summary-heading">
                      <div className="flex items-center gap-3 mb-3"><IconClipboardText className="w-6 h-6 text-highlight shrink-0"/><h3 id="detailed-summary-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.detailedSummary')}</h3></div>
                      <div className="prose text-light max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedDetailedSummary }} />
                  </div>
              )}
              {(note.todos && note.todos.length > 0) && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="todo-heading">
                      <div className="flex items-center gap-3 mb-3"><IconListCheck className="w-6 h-6 text-highlight shrink-0"/><h3 id="todo-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.todos')}</h3></div>
                      <ul className="space-y-2.5 list-disc list-inside text-light marker:text-highlight">{note.todos.map((todo, index) => <li key={index} className="leading-relaxed text-base">{todo}</li>)}</ul>
                  </div>
              )}
               {(note.decisions && note.decisions.length > 0) && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="decisions-heading">
                      <div className="flex items-center gap-3 mb-3"><IconCheckCircle className="w-6 h-6 text-highlight shrink-0"/><h3 id="decisions-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.decisions')}</h3></div>
                      <ul className="space-y-2.5 list-disc list-inside text-light marker:text-highlight">{note.decisions.map((decision, index) => <li key={index} className="leading-relaxed text-base">{decision}</li>)}</ul>
                  </div>
              )}
              {(note.keyPeople && note.keyPeople.length > 0) && (
                  <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="people-heading">
                      <div className="flex items-center gap-3 mb-3"><IconUsers className="w-6 h-6 text-highlight shrink-0"/><h3 id="people-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.people')}</h3></div>
                      <div className="flex flex-wrap gap-2">{note.keyPeople.map((person, index) => (<span key={index} className="bg-tertiary text-light text-sm font-medium px-3 py-1 rounded-full">{person}</span>))}</div>
                  </div>
              )}
              
              <div className="bg-primary/50 p-4 rounded-lg border border-tertiary/50 shadow-sm" role="region" aria-labelledby="tags-heading">
                  <div className="flex items-center gap-3 mb-3"><IconTags className="w-6 h-6 text-highlight shrink-0"/><h3 id="tags-heading" className="text-lg font-semibold text-light">{t('noteEditor.insights.tags')}</h3></div>
                  <div className="flex flex-wrap gap-2 items-center">
                      {(note.tags || []).map((tag) => (
                          <div key={tag} className="flex items-center bg-tertiary rounded-full text-sm font-medium group">
                              <button onClick={() => onTagSelect(tag)} className="pl-3 pr-2 py-1 text-light hover:text-highlight transition-colors" title={`Filter by tag: ${tag}`} aria-label={`Filter by tag: ${tag}`}>
                                 # {tag}
                              </button>
                              <button onClick={() => handleRemoveTag(tag)} className="px-1 opacity-50 group-hover:opacity-100 text-light hover:text-red-400" title={`Remove tag: ${tag}`} aria-label={`Remove tag: ${tag}`}>
                                  <IconXCircle className="w-3 h-3" />
                              </button>
                          </div>
                      ))}
                      <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagInputKeyDown}
                          onBlur={handleAddTag}
                          placeholder={t('noteEditor.insights.addTag')}
                          className="bg-transparent focus:outline-none text-sm p-1 placeholder-subtle w-24"
                          aria-label={t('noteEditor.insights.addTag')}
                      />
                  </div>
              </div>
          </div>
      </div>

      <footer className="px-4 py-1 text-xs text-center text-subtle border-t border-tertiary shrink-0 h-8 flex items-center justify-center">
        {getStatusMessage()}
      </footer>
    </div>
  );
};

export default NoteEditor;