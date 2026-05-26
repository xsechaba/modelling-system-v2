import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Settings, Play, CheckCircle, Clock, Database, GitBranch, ArrowRight, User, AlertCircle, FileText } from "lucide-react";

import DeleteProjectButton from "@/components/DeleteProjectButton";

export default async function ProjectDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      creator: true,
      state: true,
      files: true,
    }
  });

  if (!project) {
    redirect("/projects");
  }

  // Get audit logs
  const auditLogs = await prisma.auditLog.findMany({
    where: { projectId: id },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const completedSteps = project.state?.completedSteps ? JSON.parse(project.state.completedSteps) : [];
  const currentStep = project.state?.currentStep || 'upload';

  const steps = [
    { id: 'upload', label: 'Ingest Data' },
    { id: 'settings', label: 'Configuration' },
    { id: 'profile', label: 'Profiling' },
    { id: 'requirements', label: 'Define Requirements' },
    { id: 'bus-matrix', label: 'Bus Matrix' },
    { id: 'review', label: 'Schema Editor' },
    { id: 'export', label: 'Code Generation' },
    { id: 'deploy', label: 'Deploy' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercent = Math.round((completedSteps.length / steps.length) * 100);

  // Parse state data once
  let stateData: any = {};
  if (project.state?.stateData) {
    try {
      stateData = JSON.parse(project.state.stateData);
    } catch(e) {}
  }

  // Calculate Ingested Files from stateData if available
  let ingestedFilesCount = project.files.length;
  if (stateData.profileResults?.files) {
    ingestedFilesCount = Math.max(ingestedFilesCount, stateData.profileResults.files.length);
  }

  // Generate dynamic Activity Log from state
  const dynamicLogs: any[] = [];
  dynamicLogs.push({ id: 'created', user: project.creator, action: 'created project', createdAt: project.createdAt });
  
  if (completedSteps.includes('upload') || ingestedFilesCount > 0) {
    dynamicLogs.push({ id: 'upload', user: project.creator, action: 'ingested source data files', createdAt: new Date(project.createdAt.getTime() + 10000) });
  }
  if (completedSteps.includes('profile')) {
    dynamicLogs.push({ id: 'profile', user: project.creator, action: 'ran AI data profiling', createdAt: new Date(project.createdAt.getTime() + 20000) });
  }
  if (stateData.kpis && stateData.kpis.length > 0) {
    dynamicLogs.push({ id: 'kpis', user: project.creator, action: `extracted ${stateData.kpis.length} KPIs via AI`, createdAt: new Date(project.createdAt.getTime() + 30000) });
  }
  if (completedSteps.includes('bus-matrix')) {
    dynamicLogs.push({ id: 'matrix', user: project.creator, action: 'generated Kimball Bus Matrix', createdAt: new Date(project.createdAt.getTime() + 40000) });
  }
  if (completedSteps.includes('review')) {
    dynamicLogs.push({ id: 'schema', user: project.creator, action: 'designed physical star schema', createdAt: new Date(project.createdAt.getTime() + 50000) });
  }

  // Combine with real audit logs if they exist, sort by newest
  const allLogs = [...auditLogs, ...dynamicLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 8);

  // Calculate real Data Quality Score from profiling data
  let dataQualityScore: number | null = null;
  let dataQualityColor = '#ffbd2e'; // warning default
  let dataQualityMessage = "Run profiling to generate quality metrics.";

  if (Object.keys(stateData).length > 0) {
    try {
      if (stateData.profileResults && stateData.profileResults.files && stateData.profileResults.files.length > 0) {
        let totalCols = 0;
        let highQualityCols = 0;
        
        stateData.profileResults.files.forEach((file: any) => {
           if (file.columns) {
              file.columns.forEach((col: any) => {
                 totalCols++;
                 // If a column has less than 5% missing data, we consider it "high quality" for this metric
                 if (col.missingPct < 5) {
                    highQualityCols++;
                 }
              });
           }
        });
        
        if (totalCols > 0) {
           dataQualityScore = Math.round((highQualityCols / totalCols) * 100);
           dataQualityMessage = `${highQualityCols} of ${totalCols} columns have <5% missing data.`;
           if (dataQualityScore >= 90) dataQualityColor = 'var(--color-green)';
           else if (dataQualityScore < 70) dataQualityColor = '#ff5f56';
        }
      }
    } catch (e) {
      console.error("Failed to parse stateData for data quality score", e);
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--color-white)' }}>
      {/* App Header */}
      <nav style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--color-glass)',
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
          <Link href="/projects" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)', textDecoration: 'none' }}>dim-wiz</Link>
          <span style={{ color: 'var(--color-white-muted)', marginLeft: '8px' }}>/</span>
          <Link href="/projects" style={{ color: 'var(--color-white-muted)', textDecoration: 'none' }}>Workspaces</Link>
          <span style={{ color: 'var(--color-white-muted)', marginLeft: '8px' }}>/</span>
          <span>{project.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link href={`/wizard/${project.id}/${currentStep}`} className="btn-primary" style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', gap: '6px' }}>
              <Play size={14} /> Resume Session
            </Link>
            <Link href="/settings/profile" style={{ textDecoration: 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white)' }}>
                {getInitials(session.user?.name || session.user?.email || '')}
              </div>
            </Link>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '48px 32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '48px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ width: '56px', height: '56px', background: 'rgba(134,188,37,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Database size={28} color="var(--color-green)" />
                </div>
                <div>
                  <h1 className="heading-font" style={{ fontSize: '2.5rem' }}>{project.name}</h1>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '24px', color: 'var(--color-white-muted)', fontSize: '0.875rem', marginLeft: '72px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={14} /> repo: {project.repo || 'Not configured'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><User size={14} /> Access: {project.access}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={14} /> Created {new Date(project.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <DeleteProjectButton projectId={project.id} projectName={project.name} />
              <Link href={`/projects/${project.id}/settings`} style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', border: '1px solid var(--color-border)', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Settings size={20} />
              </Link>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Progress Tracker */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Session Progress</h3>
                  <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{progressPercent}% Complete</span>
                </div>
                
                <div style={{ height: '8px', background: 'var(--color-black)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
                  <div style={{ height: '100%', width: `${progressPercent}%`, background: 'var(--color-green)', transition: 'width 0.5s ease' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px' }}>
                  {steps.map((step, idx) => {
                    const isCompleted = completedSteps.includes(step.id);
                    const isCurrent = step.id === currentStep;
                    const isLocked = !isCompleted && !isCurrent && idx > currentStepIndex;

                    return (
                      <Link href={`/wizard/${project.id}/${step.id}`} key={step.id} style={{
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        opacity: isLocked ? 0.4 : 1,
                        textDecoration: 'none',
                        pointerEvents: isLocked ? 'none' : 'auto',
                        padding: '12px',
                        background: isCurrent ? 'rgba(0,255,102,0.05)' : 'transparent',
                        border: isCurrent ? '1px solid var(--color-green)' : '1px solid transparent',
                        borderRadius: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <div style={{ marginTop: '2px', display: 'flex', flexShrink: 0 }}>
                            {isCompleted ? <CheckCircle size={16} color="var(--color-green)" style={{ flexShrink: 0 }} /> : (isCurrent ? <Play size={16} color="var(--color-green)" style={{ flexShrink: 0 }} /> : <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--color-white-muted)', flexShrink: 0 }} />)}
                          </div>
                          <span style={{ fontSize: '0.8125rem', color: isCompleted || isCurrent ? 'var(--color-white)' : 'var(--color-white-muted)', fontWeight: isCurrent ? 600 : 400, lineHeight: 1.4 }}>{step.label}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Data Quality & Health (Placeholder for Phase 3/4) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <AlertCircle size={18} color={dataQualityColor} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Data Quality Score</h3>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: dataQualityColor, marginBottom: '8px' }}>
                    {dataQualityScore !== null ? `${dataQualityScore}%` : '--'}
                  </div>
                  <p style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem' }}>{dataQualityMessage}</p>
                </div>
                
                <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <FileText size={18} color="var(--color-white)" />
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Ingested Files</h3>
                  </div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-white)', marginBottom: '8px' }}>{ingestedFilesCount}</div>
                  <p style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem' }}>Source tables available for modelling.</p>
                </div>
              </div>

            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Team Members */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '24px' }}>Team Members</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>
                      {getInitials(project.creator.name || project.creator.email || '')}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{project.creator.name || 'Unknown User'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Project Creator</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activity Feed */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', flex: 1 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '24px' }}>Activity Log</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {allLogs.length > 0 ? allLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-white-muted)', marginTop: '6px', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-white)' }}>
                          <span style={{ fontWeight: 600 }}>{log.user?.name || 'User'}</span> {log.action.replace(/_/g, ' ').toLowerCase()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginTop: '4px' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>No activity yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}