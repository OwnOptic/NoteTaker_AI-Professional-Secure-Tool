
import React from 'react';
import { Note, Project } from '../types';
import { 
    IconDocumentAdd, IconVideo, IconUpload, IconLayoutDashboard, IconMenu, IconFolder, IconFileText,
    IconWand, IconClipboardText, IconListCheck, IconUsers, IconCheckCircle, IconTags, IconMicrophone, 
    IconScreenShare, IconSearch, IconCognito, IconBookmark, IconTranslate, IconSparkles, IconDownload, 
    IconKey, IconSettings, IconDots
} from './Icons';
import { useLocalization } from '../hooks/useLocalization';

interface DashboardProps {
  notes: Note[];
  onNewNote: () => void;
  onStartMeeting: () => void;
  onUploadContent: () => void;
  onSelectNote: (id: string) => void;
  onMenuClick: () => void;
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onEditCategory: (category: {type: 'project', id: string, name: string, description?: string}) => void;
  onDeleteCategory: (category: {type: 'project', id: string, name: string}) => void;
  onAddProject: () => void;
  onExportNotes: () => void;
}

const FeatureItem: React.FC<{ icon: React.FC<any>, title: string, description: string }> = ({ icon: Icon, title, description }) => (
    <div className="flex items-start gap-4">
        <div className="p-2 bg-tertiary rounded-full mt-1 shrink-0">
            <Icon className="w-5 h-5 text-highlight" />
        </div>
        <div>
            <h4 className="font-semibold text-light">{title}</h4>
            <p className="text-sm text-subtle">{description}</p>
        </div>
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({ 
    notes, onNewNote, onStartMeeting, onUploadContent, onSelectNote, onMenuClick, 
    projects, onSelectProject, onEditCategory, onDeleteCategory, onAddProject,
    onExportNotes
}) => {
  const { t } = useLocalization();
  const unarchivedNotes = notes.filter(n => !n.isArchived);
  const recentNotes = [...unarchivedNotes]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);
  
  const projectNoteCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    unarchivedNotes.forEach(note => {
      counts.set(note.projectId, (counts.get(note.projectId) || 0) + 1);
    });
    return counts;
  }, [unarchivedNotes]);

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ElementType; a11yLabel: string; }> = ({ title, value, icon: Icon, a11yLabel }) => (
    <div className="bg-secondary p-4 rounded-lg flex items-center gap-4" role="figure" aria-label={a11yLabel}>
      <div className="p-3 bg-tertiary rounded-full">
        <Icon className="w-6 h-6 text-highlight" />
      </div>
      <div>
        <p className="text-3xl font-bold text-light">{value}</p>
        <p className="text-subtle">{title}</p>
      </div>
    </div>
  );
  
  const ActionButton: React.FC<{ title: string; icon: React.ElementType; onClick: () => void; description: string }> = ({ title, icon: Icon, onClick, description }) => (
      <button onClick={onClick} className="bg-secondary p-6 rounded-lg text-left w-full hover:bg-tertiary transition-colors focus:outline-none focus:ring-2 focus:ring-highlight">
          <div className="flex items-center gap-4">
              <Icon className="w-8 h-8 text-accent"/>
              <div>
                <h3 className="text-lg font-semibold text-light">{title}</h3>
                <p className="text-sm text-subtle">{description}</p>
              </div>
          </div>
      </button>
  );

  return (
    <div className="flex flex-col h-full bg-primary overflow-y-auto">
      <header className="p-4 border-b border-tertiary flex items-center gap-4 shrink-0 sticky top-0 bg-primary/80 backdrop-blur-sm z-10">
        <button onClick={onMenuClick} className="p-1 rounded-md hover:bg-tertiary md:hidden" aria-label="Open sidebar menu">
          <IconMenu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <IconLayoutDashboard className="w-7 h-7 text-accent" />
          <h2 className="text-2xl font-bold text-light">{t('dashboard.title')}</h2>
        </div>
      </header>

      <main className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <section aria-labelledby="quick-actions-heading">
                <h3 id="quick-actions-heading" className="text-xl font-bold text-light mb-4">{t('dashboard.actions.title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <ActionButton title={t('dashboard.actions.newNote')} icon={IconDocumentAdd} onClick={onNewNote} description={t('dashboard.actions.newNoteDesc')} />
                    <ActionButton title={t('dashboard.actions.startMeeting')} icon={IconVideo} onClick={onStartMeeting} description={t('dashboard.actions.startMeetingDesc')} />
                    <ActionButton title={t('dashboard.actions.uploadContent')} icon={IconUpload} onClick={onUploadContent} description={t('dashboard.actions.uploadContentDesc')} />
                    <ActionButton title={t('dashboard.actions.backup')} icon={IconDownload} onClick={onExportNotes} description={t('dashboard.actions.backupDesc')} />
                </div>
            </section>
        
            {/* Stats */}
            <section aria-labelledby="stats-heading">
                <h3 id="stats-heading" className="text-xl font-bold text-light mb-4">{t('dashboard.glance.title')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <StatCard title={t('dashboard.glance.totalNotes')} value={unarchivedNotes.length} icon={IconFileText} a11yLabel={`${t('dashboard.glance.totalNotes')}: ${unarchivedNotes.length}`}/>
                    <StatCard title={t('dashboard.glance.projects')} value={projects.length} icon={IconFolder} a11yLabel={`${t('dashboard.glance.projects')}: ${projects.length}`} />
                </div>
            </section>

             {/* Recent Notes */}
            {recentNotes.length > 0 && (
                <section aria-labelledby="recent-notes-heading">
                    <h3 id="recent-notes-heading" className="text-xl font-bold text-light mb-4">{t('dashboard.recent.title')}</h3>
                    <div className="bg-secondary rounded-lg">
                        <ul role="list">
                            {recentNotes.map((note, index) => {
                                const project = projects.find(p => p.id === note.projectId);
                                const subject = project?.subjects.find(s => s.id === note.subjectId);
                                return (
                                <li key={note.id} className={`${index < recentNotes.length - 1 ? 'border-b border-tertiary' : ''}`}>
                                    <button onClick={() => onSelectNote(note.id)} className="w-full text-left p-4 hover:bg-tertiary transition-colors flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-light">{note.title}</p>
                                            <p className="text-sm text-subtle">{project?.name} / {subject?.name}</p>
                                        </div>
                                        <span className="text-xs text-subtle">{new Date(note.updatedAt).toLocaleDateString()}</span>
                                    </button>
                                </li>
                                )
                            })}
                        </ul>
                    </div>
                </section>
            )}

            {/* All Features */}
            <section aria-labelledby="all-features-heading">
                <h3 id="all-features-heading" className="text-xl font-bold text-light mb-4">{t('dashboard.features.title')}</h3>
                <div className="bg-secondary rounded-lg p-6 space-y-8">
                    
                    <div>
                        <h4 className="text-lg font-semibold text-accent mb-4">{t('dashboard.features.ai.title')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FeatureItem icon={IconWand} title={t('dashboard.features.ai.cat.title')} description={t('dashboard.features.ai.cat.desc')} />
                            <FeatureItem icon={IconClipboardText} title={t('dashboard.features.ai.summaries.title')} description={t('dashboard.features.ai.summaries.desc')} />
                            <FeatureItem icon={IconListCheck} title={t('dashboard.features.ai.todos.title')} description={t('dashboard.features.ai.todos.desc')} />
                            <FeatureItem icon={IconUsers} title={t('dashboard.features.ai.people.title')} description={t('dashboard.features.ai.people.desc')} />
                            <FeatureItem icon={IconCheckCircle} title={t('dashboard.features.ai.decisions.title')} description={t('dashboard.features.ai.decisions.desc')} />
                            <FeatureItem icon={IconTags} title={t('dashboard.features.ai.tags.title')} description={t('dashboard.features.ai.tags.desc')} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-accent mb-4">{t('dashboard.features.meeting.title')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FeatureItem icon={IconMicrophone} title={t('dashboard.features.meeting.transcript.title')} description={t('dashboard.features.meeting.transcript.desc')} />
                            <FeatureItem icon={IconScreenShare} title={t('dashboard.features.meeting.screen.title')} description={t('dashboard.features.meeting.screen.desc')} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-accent mb-4">{t('dashboard.features.productivity.title')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                            <FeatureItem icon={IconUpload} title={t('dashboard.features.productivity.upload.title')} description={t('dashboard.features.productivity.upload.desc')} />
                            <FeatureItem icon={IconSearch} title={t('dashboard.features.productivity.search.title')} description={t('dashboard.features.productivity.search.desc')} />
                            <FeatureItem icon={IconCognito} title={t('dashboard.features.productivity.chat.title')} description={t('dashboard.features.productivity.chat.desc')} />
                            <FeatureItem icon={IconBookmark} title={t('dashboard.features.productivity.templates.title')} description={t('dashboard.features.productivity.templates.desc')} />
                            <FeatureItem icon={IconTranslate} title={t('dashboard.features.productivity.translate.title')} description={t('dashboard.features.productivity.translate.desc')} />
                            <FeatureItem icon={IconSparkles} title={t('dashboard.features.productivity.tone.title')} description={t('dashboard.features.productivity.tone.desc')} />
                        </div>
                    </div>
                </div>
            </section>
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-1 space-y-8">
            <section aria-labelledby="projects-heading">
                 <div className="flex justify-between items-center mb-4">
                    <h3 id="projects-heading" className="text-xl font-bold text-light">{t('dashboard.projects.title')}</h3>
                    <button onClick={onAddProject} className="text-sm font-semibold text-accent hover:text-highlight transition-colors">+ New Project</button>
                 </div>
                 <div className="bg-secondary rounded-lg">
                    {projects.length > 0 ? (
                        <ul role="list">
                           {projects.map((proj, index) => (
                               <li key={proj.id} className={`group ${index < projects.length - 1 ? 'border-b border-tertiary' : ''}`}>
                                   <div className="w-full text-left p-4 hover:bg-tertiary transition-colors flex justify-between items-center">
                                       <button onClick={() => onSelectProject(proj.id)} className="flex-grow text-left">
                                         <span className="font-semibold text-light">{proj.name}</span>
                                       </button>
                                       <div className="flex items-center gap-2">
                                            <span className="text-sm text-subtle bg-primary px-2 py-0.5 rounded-full">{projectNoteCounts.get(proj.id) || 0}</span>
                                            <div className="relative">
                                                <button onClick={(e) => { e.stopPropagation(); onEditCategory({ type: 'project', id: proj.id, name: proj.name, description: proj.description }); }} className="p-1 rounded-full text-subtle hover:text-light transition-colors opacity-0 group-hover:opacity-100">
                                                    <IconDots className="w-5 h-5" />
                                                </button>
                                                {/* Add context menu here if needed */}
                                            </div>
                                       </div>
                                   </div>
                               </li>
                           ))}
                        </ul>
                    ) : (
                        <p className="p-4 text-subtle">{t('dashboard.projects.empty')}</p>
                    )}
                 </div>
            </section>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
