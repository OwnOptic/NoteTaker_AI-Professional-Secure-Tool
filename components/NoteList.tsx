import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Note, Project, Subject } from '../types';
import NoteListItem from './NoteListItem';
import { IconChevronRight, IconClose, IconTag, IconFolder, IconSearch, IconDots, IconEdit, IconTrash, IconDocumentAdd, IconWand } from './Icons';
import { useLocalization } from '../hooks/useLocalization';
import Spinner from './Spinner';

interface CategoryMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onAddSubject?: () => void;
  onClose: () => void;
}

const CategoryMenu: React.FC<CategoryMenuProps> = ({ onRename, onDelete, onAddSubject, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div ref={menuRef} className="absolute top-full right-2 mt-1 w-48 bg-primary rounded-md shadow-lg ring-1 ring-tertiary ring-opacity-50 z-20 p-1">
            <button onClick={onRename} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-tertiary">
                <IconEdit className="w-4 h-4" /> Rename
            </button>
            {onAddSubject && (
                 <button onClick={onAddSubject} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-tertiary">
                    <IconDocumentAdd className="w-4 h-4" /> Add Subject
                </button>
            )}
            <button onClick={onDelete} className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm rounded text-red-400 hover:bg-tertiary">
                <IconTrash className="w-4 h-4" /> Delete
            </button>
        </div>
    );
};

interface NoteListProps {
  notes: Note[];
  projects: Project[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onDeleteNote: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchFilter: string;
  onSetSearchFilter: (term: string) => void;
  sortBy: 'updatedAt' | 'createdAt' | 'title';
  setSortBy: (sort: 'updatedAt' | 'createdAt' | 'title') => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  tagFilter: string | null;
  onTagSelect: (tag: string) => void;
  onClearTagFilter: () => void;
  projectFilter: string | null;
  onProjectSelect: (projectId: string | null) => void;
  onAddProject: () => void;
  onAddSubject: (projectId: string) => void;
  onEditCategory: (category: {type: 'project' | 'subject', id: string, name: string, description?: string}) => void;
  onDeleteCategory: (category: {type: 'project' | 'subject', id: string, name: string}) => void;
  
  isSemanticSearch: boolean;
  setIsSemanticSearch: (isSemantic: boolean) => void;
  semanticSearchResults: string[] | null;
  onSemanticSearch: (query: string) => void;
  isProcessingSemantic: boolean;
}

const NoteList: React.FC<NoteListProps> = ({
  notes, projects, activeNoteId, onSelectNote, onDeleteNote,
  searchTerm, setSearchTerm, searchFilter, onSetSearchFilter,
  sortBy, setSortBy, showArchived, setShowArchived,
  tagFilter, onTagSelect, onClearTagFilter,
  projectFilter, onProjectSelect,
  onAddProject, onAddSubject, onEditCategory, onDeleteCategory,
  isSemanticSearch, setIsSemanticSearch, semanticSearchResults, onSemanticSearch, isProcessingSemantic,
}) => {
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({});
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const { t } = useLocalization();

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          if (isSemanticSearch) {
              onSemanticSearch(searchTerm);
          } else {
              onSetSearchFilter(searchTerm);
          }
      }
  }

  const projectMap = useMemo(() => new Map(projects.map(p => [p.id, p])), [projects]);
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>();
    projects.forEach(p => p.subjects.forEach(s => map.set(s.id, s)));
    return map;
  }, [projects]);


  const filteredNotes = useMemo(() => {
    return notes.filter(note => {
      const isArchivedMatch = showArchived ? true : !note.isArchived;
      const projectMatch = !projectFilter || note.projectId === projectFilter;
      const tagMatch = !tagFilter || (note.tags && note.tags.includes(tagFilter));

      let searchMatch = true;
      if (isSemanticSearch && semanticSearchResults) {
          searchMatch = semanticSearchResults.includes(note.id);
      } else if (searchFilter) {
          const term = searchFilter.toLowerCase();
          const projectName = projectMap.get(note.projectId)?.name.toLowerCase() || '';
          const subjectName = subjectMap.get(note.subjectId)?.name.toLowerCase() || '';
          searchMatch = 
            note.title.toLowerCase().includes(term) ||
            note.content.toLowerCase().includes(term) ||
            (note.detailedSummary && note.detailedSummary.toLowerCase().includes(term)) ||
            projectName.includes(term) ||
            subjectName.includes(term) ||
            (note.tags && note.tags.some(t => t.toLowerCase().includes(term)));
      }

      return isArchivedMatch && tagMatch && searchMatch && projectMatch;
    });
  }, [notes, searchFilter, showArchived, tagFilter, projectFilter, projectMap, subjectMap, isSemanticSearch, semanticSearchResults]);

  const notesByProjectAndSubject = useMemo(() => {
    const groups: Record<string, Record<string, Note[]>> = {};
    filteredNotes.forEach(note => {
      if (!groups[note.projectId]) groups[note.projectId] = {};
      if (!groups[note.projectId][note.subjectId]) groups[note.projectId][note.subjectId] = [];
      groups[note.projectId][note.subjectId].push(note);
    });
    return groups;
  }, [filteredNotes]);

  const toggleProject = (projectId: string) => setOpenProjects(prev => ({ ...prev, [projectId]: !prev[projectId] }));
  const toggleSubject = (subjectId: string) => setOpenSubjects(prev => ({ ...prev, [subjectId]: !prev[subjectId] }));
    
  const sortComparator = (a: Note, b: Note) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    return new Date(b[sortBy]).getTime() - new Date(a[sortBy]).getTime();
  };
  
  const FilterPill: React.FC<{icon: React.ElementType, filterType: string, label: string, onClear: () => void}> = ({icon: Icon, filterType, label, onClear}) => (
    <div className="flex justify-between items-center bg-tertiary p-2 rounded-md animate-fade-in">
        <div className="flex items-center gap-2 text-sm text-light">
            <Icon className="w-4 h-4 text-highlight"/>
            <span>{filterType} <strong>{label}</strong></span>
        </div>
        <button onClick={onClear} className="p-1 rounded-full hover:bg-primary" title={t('noteList.filter.clear')}>
            <IconClose className="w-4 h-4"/>
        </button>
        <style>{`
          @keyframes fade-in { 
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in { animation: fade-in 0.3s ease-out; }
        `}</style>
    </div>
  );
  
  const handleClearSearch = () => {
      onSetSearchFilter('');
      setSearchTerm('');
      setIsSemanticSearch(false);
  }

  return (
    <div id="note-list-container" className="flex flex-col h-full overflow-y-hidden bg-secondary">
      <div className="p-4 border-b border-tertiary shrink-0 space-y-3">
        <div className="relative flex items-center gap-2">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-subtle pointer-events-none" />
            <input
              type="search"
              placeholder={isSemanticSearch ? t('noteList.semanticSearchPlaceholder') : t('noteList.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-primary p-2 pl-10 rounded-md placeholder-subtle text-light focus:outline-none focus:ring-2 focus:ring-highlight"
              aria-label={t('noteList.searchPlaceholder')}
            />
             <button onClick={() => setIsSemanticSearch(!isSemanticSearch)} className={`p-2 rounded-md transition-colors ${isSemanticSearch ? 'bg-highlight/20 text-highlight' : 'bg-primary text-subtle hover:bg-tertiary'}`} title={t('noteList.semanticSearchToggle')}>
                {isProcessingSemantic ? <Spinner /> : <IconWand className="w-5 h-5" />}
            </button>
        </div>
        {(searchFilter || (isSemanticSearch && semanticSearchResults)) && <FilterPill icon={isSemanticSearch ? IconWand : IconSearch} filterType={t('noteList.filter.bySearch')} label={searchFilter} onClear={handleClearSearch} />}
        {tagFilter && <FilterPill icon={IconTag} filterType={t('noteList.filter.byTag')} label={tagFilter} onClear={onClearTagFilter} />}
        {projectFilter && <FilterPill icon={IconFolder} filterType={t('noteList.filter.byProject')} label={projectMap.get(projectFilter)?.name || ''} onClear={() => onProjectSelect(null)} />}
        <div className="flex justify-between items-center text-xs text-subtle">
            <div className="flex items-center">
                <label htmlFor="sort-by" className="mr-2">{t('noteList.sortBy')}</label>
                <select
                    id="sort-by"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-tertiary text-light rounded p-1 focus:outline-none focus:ring-1 focus:ring-highlight"
                >
                    <option value="updatedAt">{t('noteList.sort.modified')}</option>
                    <option value="createdAt">{t('noteList.sort.created')}</option>
                    <option value="title">{t('noteList.sort.title')}</option>
                </select>
            </div>
             <div className="flex items-center">
                <label htmlFor="show-archived" className="text-xs text-subtle cursor-pointer select-none">{t('noteList.showArchived')}</label>
                <input 
                    id="show-archived"
                    type="checkbox" 
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="ml-2 h-4 w-4 rounded bg-tertiary border-tertiary text-accent focus:ring-accent"
                />
            </div>
        </div>
      </div>
      <div className="overflow-y-auto flex-grow" role="navigation" aria-label="Notes">
        {projects.length > 0 ? (
          projects.map(project => {
            const subjects = notesByProjectAndSubject[project.id] || {};
            if(Object.keys(subjects).length === 0 && (searchFilter || semanticSearchResults)) return null;

            const isProjectOpen = !!openProjects[project.id];
            
            return (
              <div key={project.id} className="border-b border-tertiary/50 last:border-b-0 group/project">
                <div className="w-full flex items-center text-left p-3 bg-secondary/30 hover:bg-tertiary/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-highlight relative">
                  <button onClick={() => toggleProject(project.id)} className="flex items-center flex-grow" aria-expanded={isProjectOpen} aria-controls={`project-group-${project.id}`}>
                    <IconChevronRight className={`w-5 h-5 mr-2 shrink-0 transition-transform duration-200 text-subtle ${isProjectOpen ? 'rotate-90' : ''}`} />
                    <span className="font-semibold truncate flex-grow text-light">{project.name}</span>
                  </button>
                  <span className="text-xs bg-tertiary text-light rounded-full px-2 py-0.5 ml-2">{Object.values(subjects).flat().length}</span>
                  <button onClick={() => setActiveMenu(activeMenu === project.id ? null : project.id)} className="p-1 rounded-full opacity-0 group-hover/project:opacity-100 hover:bg-primary ml-2"><IconDots className="w-4 h-4 text-subtle" /></button>
                  {activeMenu === project.id && (
                     <CategoryMenu
                        onRename={() => onEditCategory({type: 'project', id: project.id, name: project.name, description: project.description})}
                        onDelete={() => onDeleteCategory({type: 'project', id: project.id, name: project.name})}
                        onAddSubject={() => onAddSubject(project.id)}
                        onClose={() => setActiveMenu(null)}
                    />
                  )}
                </div>
                {isProjectOpen && (
                  <div id={`project-group-${project.id}`} className="pl-4 border-l-2 border-tertiary/20">
                    {project.subjects.sort((a,b) => a.name.localeCompare(b.name)).map(subject => {
                      const notesInSubject = subjects[subject.id] || [];
                      if(notesInSubject.length === 0) return null;
                      const isSubjectOpen = !!openSubjects[subject.id];

                      return (
                        <div key={subject.id} className="group/subject">
                           <div className="w-full flex items-center text-left p-2.5 hover:bg-tertiary/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-highlight relative">
                              <button onClick={() => toggleSubject(subject.id)} className="flex items-center flex-grow" aria-expanded={isSubjectOpen} aria-controls={`subject-group-${subject.id}`}>
                                <IconChevronRight className={`w-4 h-4 mr-2 shrink-0 transition-transform duration-200 text-subtle ${isSubjectOpen ? 'rotate-90' : ''}`} />
                                <span className="font-medium text-sm truncate flex-grow text-light/90">{subject.name}</span>
                              </button>
                              <span className="text-xs bg-primary text-subtle rounded-full px-2 py-0.5 ml-2">{notesInSubject.length}</span>
                              <button onClick={() => setActiveMenu(activeMenu === subject.id ? null : subject.id)} className="p-1 rounded-full opacity-0 group-hover/subject:opacity-100 hover:bg-primary ml-2"><IconDots className="w-4 h-4 text-subtle" /></button>
                              {activeMenu === subject.id && (
                                <CategoryMenu
                                    onRename={() => onEditCategory({type: 'subject', id: subject.id, name: subject.name})}
                                    onDelete={() => onDeleteCategory({type: 'subject', id: subject.id, name: subject.name})}
                                    onClose={() => setActiveMenu(null)}
                                />
                              )}
                           </div>
                           {isSubjectOpen && (
                             <ul id={`subject-group-${subject.id}`} className="pl-4 border-l-2 border-tertiary/20" role="list">
                                {notesInSubject.sort(sortComparator).map(note => (
                                  <NoteListItem key={note.id} note={note} isActive={note.id === activeNoteId} onSelect={() => onSelectNote(note.id)}
                                    onDelete={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                    onTagSelect={onTagSelect}
                                  />
                                ))}
                              </ul>
                           )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        ) : ( <p className="p-4 text-center text-subtle">{t('noteList.emptyState')}</p> )}
      </div>
       <div className="p-2 border-t border-tertiary">
        <button onClick={onAddProject} className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-tertiary text-sm text-subtle hover:text-light transition-colors">
          <IconFolder className="w-5 h-5" />
          Add new project
        </button>
      </div>
    </div>
  );
};

export default NoteList;