
import React from 'react';
import { Note } from '../types';
import { IconTrash, IconCalendar, IconTag } from './Icons';

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTagSelect: (tag: string) => void;
}

const NoteListItem: React.FC<NoteListItemProps> = ({ note, isActive, onSelect, onDelete, onTagSelect }) => {
  const itemClasses = `
    block pl-4 pr-4 py-3 border-l-4 cursor-pointer transition-all duration-200 group relative
    ${isActive ? 'bg-tertiary border-accent' : 'border-transparent hover:bg-tertiary/50 hover:border-highlight'}
    ${note.isArchived ? 'opacity-60' : ''}
  `;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric'
    });
  }

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    onTagSelect(tag);
  }

  return (
    <li onClick={onSelect} className={itemClasses}>
      <div className="flex justify-between items-start">
        <h3 className="font-semibold text-md truncate pr-8 text-light">{note.title}</h3>
        <button
          onClick={onDelete}
          className="absolute top-3 right-3 p-1 rounded-full text-subtle hover:text-red-400 hover:bg-secondary opacity-0 group-hover:opacity-100 transition-all z-10"
          title="Delete Note"
          aria-label={`Delete note titled ${note.title}`}
        >
          <IconTrash className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-subtle truncate mt-1">{note.summary}</p>
      
      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap mt-2 text-xs text-subtle">
        <div className="flex items-center gap-1.5 mr-auto" title={`Created on ${new Date(note.createdAt).toLocaleDateString()}`}>
            <IconCalendar className="w-3 h-3" />
            <span>{formatDate(note.updatedAt)}</span>
        </div>
        {(note.tags || []).slice(0, 2).map(tag => (
          <button 
            key={tag}
            onClick={(e) => handleTagClick(e, tag)}
            className="flex items-center gap-1 bg-primary/70 hover:bg-primary px-2 py-0.5 rounded-full"
            title={`Filter by tag: ${tag}`}
          >
            <IconTag className="w-3 h-3"/>
            <span>{tag}</span>
          </button>
        ))}
      </div>
    </li>
  );
};

export default NoteListItem;