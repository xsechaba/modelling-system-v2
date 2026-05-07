'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Database, Clock, Terminal, CheckCircle2 } from 'lucide-react';

export default function DeployPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  
  const [deployTarget, setDeployTarget] = useState('dbt');
  const [schedule, setSchedule] = useState('daily');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [files, setFiles] = useState<{name: string}[]>([]);

  // Fetch the files from the export API to dynamically list them in the console
  useEffect(() => {
    async function loadFiles() {
      try {
        const res = await fetch(`/api/projects/${projectId}/export`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadFiles();
  }, [projectId]);

  const handleDeploy = async () => {
    setDeploying(true);
    
    // Simulate deployment process
    setTimeout(async () => {
      setDeploying(false);
      setDeployed(true);
      
      // Update Project State to fully completed
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        const data = await res.json();
        const completedSteps = JSON.parse(data.completedSteps || '[]');
        if (!completedSteps.includes('deploy')) completedSteps.push('deploy');
        
        await fetch(`/api/projects/${projectId}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: 'deploy',
            completedSteps
          })
        });
      } catch (e) {
        console.error(e);
      }
    }, 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Schedule & Deploy</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Compile the agent's work into physical DDL and orchestrate the pipeline.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/wizard/${projectId}/export`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={14} /> Back to Code
          </Link>
          {deployed ? (
            <Link href={`/wizard/${projectId}/maintenance`} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Go to Maintenance <Send size={14} />
            </Link>
          ) : (
            <button 
              onClick={handleDeploy}
              disabled={deploying}
              className="btn-primary" 
              style={{ padding: '8px 16px', fontSize: '0.875rem', opacity: deploying ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: deploying ? 'not-allowed' : 'pointer' }}>
              {deploying ? 'Deploying...' : 'Deploy Pipeline'} <Send size={14} />
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#050505', display: 'flex', gap: '24px' }}>
        
        {/* Left Col - Configurations */}
        <div style={{ flex: '1', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--color-green)" /> Target Environment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => setDeployTarget('dbt')}
                style={{ border: `1px solid ${deployTarget === 'dbt' ? 'var(--color-green)' : 'var(--color-border)'}`, background: deployTarget === 'dbt' ? 'rgba(134,188,37,0.05)' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>dbt Cloud</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Generate dbt models and schema.yml files</div>
              </div>
              <div 
                onClick={() => setDeployTarget('snowflake')}
                style={{ border: `1px solid ${deployTarget === 'snowflake' ? 'var(--color-green)' : 'var(--color-border)'}`, background: deployTarget === 'snowflake' ? 'rgba(134,188,37,0.05)' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Snowflake</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Execute DDL and tasks directly in Snowflake</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Connection Profile</label>
              <select style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }}>
                <option>production_dwh_conn (Active)</option>
                <option>staging_dwh_conn</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-green)" /> Orchestration & Scheduling
            </h3>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'daily'} onChange={() => setSchedule('daily')} /> Daily
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'hourly'} onChange={() => setSchedule('hourly')} /> Hourly
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'custom'} onChange={() => setSchedule('custom')} /> Custom Cron
               </label>
            </div>

            {schedule === 'daily' && (
               <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Time (UTC)</label>
                  <input type="time" defaultValue="02:00" style={{ padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', width: '150px', colorScheme: 'dark' }} />
               </div>
            )}
            
            {schedule === 'custom' && (
               <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Cron Expression</label>
                  <input type="text" placeholder="0 2 * * *" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
               </div>
            )}
          </div>

        </div>

        {/* Right Col - Logs / Output */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
           <div style={{ background: '#000', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-black-light)' }}>
                 <Terminal size={14} color="var(--color-white-muted)" /> <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>Deployment Console</span>
              </div>
              <div style={{ padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-green)', lineHeight: 1.6, overflowY: 'auto' }}>
                 {!deploying && !deployed && (
                    <div style={{ color: 'var(--color-white-muted)' }}>Waiting to deploy...</div>
                 )}
                 {deploying && (
                    <>
                       <div>{'>'} Compiling logical schema to target dialect... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing generated models:</div>
                       {files.map((file, i) => (
                           <div key={i} style={{ color: 'var(--color-white-muted)', paddingLeft: '16px' }}>- {file.name}</div>
                       ))}
                       <div style={{ marginTop: '8px' }}>{'>'} Connecting to Git repository... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing commit &apos;Auto-generated schema from DimWiz&apos;... [PENDING]</div>
                    </>
                 )}
                 {deployed && (
                    <div className="animate-fade-in">
                       <div>{'>'} Compiling logical schema to target dialect... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing generated models:</div>
                       {files.map((file, i) => (
                           <div key={i} style={{ color: 'var(--color-white-muted)', paddingLeft: '16px' }}>- {file.name}</div>
                       ))}
                       <div style={{ marginTop: '8px' }}>{'>'} Connecting to Git repository... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing commit &apos;Auto-generated schema from DimWiz&apos;... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Creating Pull Request... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Registering Orchestration Job... [OK]</div>
                       
                       <div style={{ marginTop: '24px', background: 'rgba(134,188,37,0.1)', border: '1px solid var(--color-green)', padding: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={24} color="var(--color-green)" />
                          <div>
                             <div style={{ fontWeight: 600, color: '#fff' }}>Successfully Deployed</div>
                             <div style={{ color: 'var(--color-white-muted)', marginTop: '4px' }}>Pipeline is now active and scheduled to run {schedule}.</div>
                          </div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
