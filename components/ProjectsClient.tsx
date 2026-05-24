'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { ArrowRight, Folder, FolderPlus, Clock, GitBranch, Users, Settings, Database, Play, LogOut, Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/lib/theme';

export default function ProjectsClient({ user, initialProjects }: { user: any, initialProjects: any[] }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const router = useRouter();

  // Create project form state
  const [newProjectData, setNewProjectData] = useState({ name: '', access: 'Private', repo: '', entryPath: 'data-first' });
  const [isCreating, setIsCreating] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProjectData)
      });
      if (res.ok) {
        const project = await res.json();
        if (newProjectData.entryPath === 'requirements-first') {
          router.push(`/wizard/${project.id}/requirements`);
        } else {
          router.push(`/wizard/${project.id}/upload`);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--color-black)' }}>
      
      {/* App Header */}
      <nav style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-glass)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)' }}>dim-wiz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href="/settings/profile" style={{ textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white)' }}>
                {getInitials(user?.name || user?.email)}
              </div>
            </Link>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 8px', color: 'var(--color-white-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
            >
              {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
            </button>
            <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}>
              <LogOut size={16} />
            </button>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '48px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                  <div>
                      <h1 className="heading-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>Workspaces</h1>
                      <p style={{ color: 'var(--color-white-muted)' }}>Manage modeling sessions, repositories, and team access.</p>
                  </div>
                  <button onClick={() => setShowNewProject(!showNewProject)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.9375rem', borderRadius: '6px' }}>
                      <FolderPlus size={16} /> New Project
                  </button>
              </div>

              {showNewProject && (
                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-green)', borderRadius: '8px', padding: '32px', marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)' }}>Initialize New Modeling Project</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '32px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Project Name</label>
                                  <input 
                                    type="text" 
                                    value={newProjectData.name}
                                    onChange={(e) => setNewProjectData({...newProjectData, name: e.target.value})}
                                    placeholder="e.g. Sales Data Warehouse" 
                                    style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} 
                                  />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14}/> Access Control</label>
                                  <select 
                                    value={newProjectData.access}
                                    onChange={(e) => setNewProjectData({...newProjectData, access: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }}
                                  >
                                      <option value="Private">Private (Only Me)</option>
                                      <option value="Team">Team (Data Engineering)</option>
                                      <option value="Organization">Organization (All)</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={14}/> Entry Path</label>
                                  <select 
                                    value={newProjectData.entryPath}
                                    onChange={(e) => setNewProjectData({...newProjectData, entryPath: e.target.value})}
                                    style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }}
                                  >
                                      <option value="data-first">Data-First (I have data)</option>
                                      <option value="requirements-first">Requirements-First (I have context)</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                  <label style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={14}/> Target Git Repository</label>
                                  <input 
                                    type="text" 
                                    value={newProjectData.repo}
                                    onChange={(e) => setNewProjectData({...newProjectData, repo: e.target.value})}
                                    placeholder="corp-repo/retail-dbt-models" 
                                    style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} 
                                  />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                                  <button onClick={() => setShowNewProject(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', cursor: 'pointer' }}>Cancel</button>
                                  <button onClick={handleCreateProject} disabled={isCreating || !newProjectData.name} className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '6px', opacity: isCreating || !newProjectData.name ? 0.5 : 1 }}>
                                      {isCreating ? 'Creating...' : 'Start Session'}
                                  </button>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '24px' }}>Recent Sessions</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                  
                  {initialProjects.map((project) => (
                    <div key={project.id} style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-muted)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                        <Link href={`/projects/${project.id}`} style={{ textDecoration: 'none', color: 'inherit', flex: 1, cursor: 'pointer' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '40px', height: '40px', background: 'rgba(134,188,37,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Database size={20} color="var(--color-green)" />
                                  </div>
                                  <div>
                                      <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-white)' }}>{project.name}</h4>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                                  </div>
                              </div>
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={12} /> repo: {project.repo || 'Not configured'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={12} /> Access: {project.access}</span>
                          </div>
                        </Link>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <Link href={`/wizard/${project.id}/${project.state?.currentStep || 'upload'}`} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', fontSize: '0.8125rem', borderRadius: '4px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                                <Play size={14} /> Resume Session
                            </Link>
                            <Link href={`/projects/${project.id}`} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Settings size={14} /></Link>
                        </div>
                    </div>
                  ))}

                  {initialProjects.length === 0 && (
                    <div style={{ padding: '48px', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '8px', gridColumn: '1 / -1' }}>
                      <p style={{ color: 'var(--color-white-muted)' }}>No projects found. Create a new modeling project to get started.</p>
                    </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}
