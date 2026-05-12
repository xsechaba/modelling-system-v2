'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Box, Settings, Database, FolderGit2, Activity, ChevronRight, LayoutDashboard, TerminalSquare, LogOut } from 'lucide-react';

const steps = [
  { id: 'upload', label: 'Data', fullLabel: 'Ingest Data' },
  { id: 'profile', label: 'Profiling', fullLabel: 'Data Profiling' },
  { id: 'requirements', label: 'Requirements', fullLabel: 'Business Requirements' },
  { id: 'bus-matrix', label: 'Bus Matrix', fullLabel: 'Bus Matrix' },
  { id: 'review', label: 'Schema Editor', fullLabel: 'Schema Editor' },
  { id: 'export', label: 'Code Gen', fullLabel: 'Code Generation' },
];

export default function WizardLayoutClient({
  children,
  project,
  projectId,
  user
}: {
  children: React.ReactNode;
  project: any;
  projectId: string;
  user: any;
}) {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex(step => pathname?.includes(step.id));
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000', color: 'var(--color-white)', overflow: 'hidden' }}>
      
      {/* Top Application Bar */}
      <nav style={{
        height: '50px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#050505',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Custom Minimalist Vector Logo */}
          <svg style={{marginRight: '4px'}} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="2"/>
          </svg>
          <Link href="/projects" style={{ fontWeight: 700, letterSpacing: '-0.04em', textDecoration: 'none', color: 'var(--color-white)', fontSize: '1rem' }}>dim-wiz</Link>
          <span style={{ color: 'var(--color-white-muted)', marginLeft: '8px' }}>/</span>
          <Link href="/projects" style={{ color: 'var(--color-white-muted)', textDecoration: 'none' }}>{project.name}</Link>
          <span style={{ color: 'var(--color-white-muted)' }}>/</span>
          
          {/* Workspace Tabs */}
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '2px', marginLeft: '24px' }}>
            {steps.map((step, idx) => {
              const completedSteps = project.state?.completedSteps ? JSON.parse(project.state.completedSteps) : [];
              const hasKnowledge = completedSteps.includes(step.id);
              const isCurrent = idx === activeIndex;

              return (
                <Link key={step.id} href={`/wizard/${projectId}/${step.id}`} style={{
                  padding: '8px 16px',
                  background: isCurrent ? 'var(--color-black-light)' : 'transparent',
                  borderTop: isCurrent ? '2px solid var(--color-green)' : '2px solid transparent',
                  borderLeft: isCurrent ? '1px solid var(--color-border)' : '1px solid transparent',
                  borderRight: isCurrent ? '1px solid var(--color-border)' : '1px solid transparent',
                  color: isCurrent ? 'var(--color-white)' : 'var(--color-white-muted)',
                  fontWeight: isCurrent ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  fontSize: '0.8125rem',
                  borderTopLeftRadius: '4px',
                  borderTopRightRadius: '4px',
                  height: '100%',
                  transition: 'all 0.2s ease',
                  opacity: isCurrent ? 1 : 0.7
                }}>
                  <div style={{
                    width: '8px', 
                    height: '8px', 
                    borderRadius: '50%', 
                    background: hasKnowledge ? 'var(--color-green)' : 'transparent',
                    border: hasKnowledge ? 'none' : '1px solid var(--color-white-muted)',
                    opacity: hasKnowledge ? 1 : 0.5
                  }} title={hasKnowledge ? "Knowledge Contributed" : "No Knowledge Yet"} />
                  {step.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-white-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,255,102,0.1)', color: 'var(--color-green)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,102,0.2)' }}>
            <Activity size={12} /> Live Session Active
          </div>
          <Link href="/settings/profile" style={{ textDecoration: 'none' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white)' }}>
               {getInitials(user?.name || user?.email)}
            </div>
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}>
            <LogOut size={14} />
          </button>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Real App IDE-like Sidebar */}
        <aside style={{
          width: '56px',
          borderRight: '1px solid var(--color-border)',
          background: '#050505',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '24px'
        }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', cursor: 'pointer' }}><LayoutDashboard size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><Database size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><FolderGit2 size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><TerminalSquare size={20} strokeWidth={1.5} /></button>
          
          <div style={{ flex: 1 }} />
          <Link href="/settings/profile" style={{ color: 'var(--color-white-muted)' }}><Settings size={20} strokeWidth={1.5} /></Link>
        </aside>

        {/* Main Interface */}
        <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: '#0a0a0a' }}>
          <div
            key={pathname}
            className="animate-fade-in"
            style={{ width: '100%', height: '100%' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

