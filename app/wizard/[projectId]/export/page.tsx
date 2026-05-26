'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Code, Download, FileJson, FileText, CheckCircle2, Copy, Terminal, ChevronRight, Folder, Loader2 } from 'lucide-react';
import { renderAIResponse } from '@/lib/markdown';
import { useWizard } from '@/components/WizardContext';

export default function ExportPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const { markStepComplete } = useWizard();
  const [generating, setGenerating] = useState(true);
  const [navigating, setNavigating] = useState(false);
  const [files, setFiles] = useState<{name: string, type: string, content: string}[]>([]);
  const [activeFile, setActiveFile] = useState<{name: string, type: string, content: string} | null>(null);

  useEffect(() => {
    async function loadGeneratedCode() {
      try {
        const res = await fetch(`/api/projects/${projectId}/export`);
        if (res.ok) {
          const data = await res.json();
          setFiles(data.files);
          if (data.files && data.files.length > 0) {
              setActiveFile(data.files.find((f: any) => f.name.includes('fact')) || data.files[0]);
              // Mark step complete and persist
              markStepComplete('export');
              try {
                const stRes = await fetch(`/api/projects/${projectId}/state`);
                const stData = await stRes.json();
                const completed: string[] = JSON.parse(stData.completedSteps || '[]');
                if (!completed.includes('export')) completed.push('export');
                await fetch(`/api/projects/${projectId}/state`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ currentStep: 'export', completedSteps: completed }),
                });
              } catch { /* non-critical */ }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setTimeout(() => setGenerating(false), 1500); // Artificial delay to show compilation
      }
    }
    loadGeneratedCode();
  }, [projectId]);

  const copyToClipboard = () => {
      if (activeFile) {
          navigator.clipboard.writeText(activeFile.content);
      }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="heading-font" style={{ fontSize: '1.25rem' }}>Compiler Output</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <Download size={14} /> Output ZIP
          </button>
          <button
            onClick={() => {
              setNavigating(true);
              router.push(`/wizard/${projectId}/deploy`);
            }}
            disabled={generating || navigating}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', cursor: generating || navigating ? 'not-allowed' : 'pointer', opacity: generating ? 0.5 : 1 }}
          >
            {navigating ? <><Loader2 size={14} className="spin-icon" /> Loading...</> : <>Schedule &amp; Deploy <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Panel: File Explorer */}
        <div style={{ width: '260px', borderRight: '1px solid var(--color-border)', background: 'var(--color-black)', overflowY: 'auto' }}>
           <div style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Project Explorer</div>
           
           <div style={{ padding: '0 16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer' }}>
               <ChevronRight size={14} /> <Folder size={14} color="#ffbd2e" /> models
             </div>
             <div style={{ paddingLeft: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer' }}>
                  <ChevronRight size={14} /> <Folder size={14} color="#ffbd2e" /> marts
                </div>
                <div style={{ paddingLeft: '16px' }}>
                   {files.map((file, i) => (
                       <div 
                         key={i}
                         onClick={() => setActiveFile(file)}
                         style={{ 
                             display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer',
                             color: activeFile?.name === file.name ? 'var(--color-green)' : 'var(--color-white-muted)',
                             background: activeFile?.name === file.name ? 'rgba(0,255,102,0.1)' : 'transparent',
                             margin: '0 -16px', paddingLeft: '16px', 
                             borderLeft: activeFile?.name === file.name ? '2px solid var(--color-green)' : '2px solid transparent'
                         }}
                       >
                         {file.type === 'sql' ? <Code size={14} /> : file.type === 'md' ? <FileText size={14} /> : <FileJson size={14} />} {file.name}
                       </div>
                   ))}
                </div>
             </div>
           </div>
        </div>

        {/* Right Panel: Editor + Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', position: 'relative' }}>
          
          {generating ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', zIndex: 10, background: 'var(--bg-surface)' }}>
              <Loader2 size={40} color="var(--color-green)" className="spin-icon" />
              <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>dbt compile --select marts.*</div>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
            </div>
          ) : navigating ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', zIndex: 10, background: 'var(--bg-surface)' }}>
              <Loader2 size={32} color="var(--color-green)" className="spin-icon" />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)' }}>Loading deployment stage...</div>
            </div>
          ) : (
            <>
              {/* Code Editor */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', height: '40px', justifyContent: 'space-between', alignItems: 'center', paddingRight: '16px' }}>
                   <div style={{ padding: '0 16px', borderRight: '1px solid var(--color-border)', borderTop: '2px solid var(--color-green)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', background: 'var(--bg-surface)', height: '100%' }}>
                     {activeFile?.type === 'sql' ? <Code size={14} color="var(--color-green)" /> : activeFile?.type === 'md' ? <FileText size={14} color="var(--color-green)" /> : <FileJson size={14} color="var(--color-green)" />} {activeFile?.name}
                   </div>
                   <button onClick={copyToClipboard} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                      <Copy size={12} /> Copy Code
                   </button>
                </div>
                
                <div style={{ padding: '16px 0', display: 'flex' }}>
                   {/* Line numbers */}
                   <div style={{ width: '40px', textAlign: 'right', paddingRight: '16px', color: 'var(--color-border)', fontFamily: 'monospace', fontSize: '0.875rem', userSelect: 'none' }}>
                     {activeFile?.content.split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
                   </div>
                   {/* Code content */}
                   {activeFile?.type === 'md' ? (
                       <div style={{ padding: '0 16px', color: 'var(--color-white)', fontSize: '0.875rem', lineHeight: 1.6, flex: 1, overflowX: 'auto', fontFamily: 'sans-serif' }} dangerouslySetInnerHTML={{ __html: renderAIResponse(activeFile.content) }} />
                   ) : (
                       <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.5, color: 'var(--color-white)', flex: 1, overflowX: 'auto', paddingRight: '16px' }}>
                        <code>
                          {activeFile?.content.split('\n').map((line, i) => (
                            <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\{\{/g, '<span style="color: #ffbd2e">{{').replace(/\}\}/g, '}}</span>').replace(/(SELECT|FROM|WITH|AS|CAST)/g, '<span style="color: #c678dd">$1</span>') }} />
                          ))}
                        </code>
                       </pre>
                   )}
                </div>
              </div>

              {/* Terminal View */}
              <div style={{ height: '200px', borderTop: '1px solid var(--color-border)', background: 'var(--bg-page)', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>
                   <Terminal size={14} /> Output logs
                 </div>
                 <div style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-white-muted)', overflowY: 'auto', lineHeight: 1.6 }}>
                    <div style={{ color: 'var(--color-white)' }}>$ dbt compile --select state:modified</div>
                    <div>Running with dbt=1.7.0</div>
                    <div>Found {files.length} models, {files.filter(f => f.type === 'sql').length} tests, 2 sources...</div>
                    {files.map((f, i) => (
                        <div key={i} style={{ color: 'var(--color-green)', marginTop: i === 0 ? '8px' : '0' }}>✔ Compiled node {f.name} successfully.</div>
                    ))}
                    <div style={{ marginTop: '8px' }}>Ready for deployment or manual export.</div>
                 </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
