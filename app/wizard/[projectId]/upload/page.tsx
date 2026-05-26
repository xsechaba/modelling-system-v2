'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { UploadCloud, File, X, ArrowRight, Database, Plug, Plus, Search, Server, CheckSquare, Square, Loader2, CheckCircle2 } from 'lucide-react';
import { useWizard } from '@/components/WizardContext';

interface UploadedFile {
  file?: File;
  name: string;
  size: string;
  status: 'ready' | 'profiling' | 'done';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const router = useRouter();
  const { projectId } = useParams() as { projectId: string };
  const { markStepComplete } = useWizard();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'database' | 'docs'>('upload');
  const [dbConnected, setDbConnected] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [profiling, setProfiling] = useState(false);
  const [alreadyProfiled, setAlreadyProfiled] = useState(false);
  const [loadingState, setLoadingState] = useState(true);

  const [dbTables, setDbTables] = useState<{name: string, selected: boolean}[]>([]);
  const [dbCreds, setDbCreds] = useState({ host: '', port: '5432', database: '', user: '', password: '' });
  const [dbConnecting, setDbConnecting] = useState(false);
  const [dbError, setDbError] = useState('');

  // Load previously saved state on mount
  useEffect(() => {
    async function loadSavedState() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const state = await res.json();
          const parsed = JSON.parse(state.stateData || '{}');
          
          if (parsed.uploadedFiles && parsed.uploadedFiles.length > 0) {
            // Restore previously uploaded file metadata (not the actual File objects)
            setUploadedFiles(parsed.uploadedFiles.map((f: any) => ({
              name: f.name,
              size: f.size,
              status: 'done' as const
            })));
            setAlreadyProfiled(!!parsed.profileResults);
          }
        }
      } catch (e) {
        console.error('Failed to load upload state:', e);
      } finally {
        setLoadingState(false);
      }
    }
    loadSavedState();
  }, [projectId]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Only accept CSV files
      if (!f.name.endsWith('.csv')) continue;
      // Don't add duplicates
      if (uploadedFiles.some(u => u.name === f.name)) continue;
      newFiles.push({
        file: f,
        name: f.name,
        size: formatBytes(f.size),
        status: 'ready',
      });
    }
    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setAlreadyProfiled(false); // New files need re-profiling
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    // Reset the input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTable = (index: number) => {
    const newTables = [...dbTables];
    newTables[index].selected = !newTables[index].selected;
    setDbTables(newTables);
  };

  const handleConnectDb = async () => {
    setDbConnecting(true);
    setDbError('');
    try {
      const res = await fetch('/api/db-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbCreds)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Connection failed');
      
      setDbTables(data.tables.map((t: any) => ({ name: t.name, selected: false })));
      setDbConnected(true);
    } catch (err: any) {
      setDbError(err.message);
    } finally {
      setDbConnecting(false);
    }
  };

  const handleImportDbTables = async () => {
    const selected = dbTables.filter(t => t.selected).map(t => t.name);
    if (selected.length === 0) return;

    setProfiling(true);
    setDbError('');
    
    try {
      const res = await fetch('/api/profile-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...dbCreds, selectedTables: selected })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profiling failed');

      // Add to uploaded files list for UI consistency
      const newFiles = data.files.map((f: any) => ({
        name: f.name,
        size: f.size + ' B', // Pseudo size
        status: 'done' as const
      }));
      setUploadedFiles(prev => [...prev, ...newFiles]);

      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'profile',
          completedSteps: ['upload'],
          stateData: {
            profileResults: data,
            uploadedFiles: [...uploadedFiles, ...newFiles].map(f => ({ name: f.name, size: f.size }))
          }
        })
      });

      setAlreadyProfiled(true);
      setTimeout(() => router.push(`/wizard/${projectId}/settings`), 400);
    } catch (err: any) {
      setDbError(err.message);
      setProfiling(false);
    }
  };

  const handleRunProfiler = async () => {
    // Check if we have new files (with actual File objects) to profile
    const newFiles = uploadedFiles.filter(f => f.file);
    if (newFiles.length === 0 && !alreadyProfiled) return;
    
    // If already profiled and no new files, just navigate
    if (alreadyProfiled && newFiles.length === 0) {
      router.push(`/wizard/${projectId}/settings`);
      return;
    }

    setProfiling(true);
    setUploadedFiles(prev => prev.map(f => f.file ? { ...f, status: 'profiling' as const } : f));

    try {
      const formData = new FormData();
      formData.append('projectId', projectId);
      for (const uf of newFiles) {
        if (uf.file) formData.append('files', uf.file);
      }

      const res = await fetch('/api/profile', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        alert('Profiling error: ' + data.error);
        setProfiling(false);
        return;
      }

      // Store results in ProjectState DB via API
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'profile',
          completedSteps: ['upload'],
          stateData: {
            profileResults: data,
            uploadedFiles: uploadedFiles.map(f => ({ name: f.name, size: f.size }))
          }
        })
      });

      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'done' as const })));
      setAlreadyProfiled(true);

      // Navigate to settings page
      markStepComplete('upload');
      router.refresh();
      setTimeout(() => router.push(`/wizard/${projectId}/settings`), 400);
    } catch (err: any) {
      alert('Failed to profile: ' + err.message);
      setProfiling(false);
    }
  };

  // Determine button label and state
  const hasNewFiles = uploadedFiles.some(f => f.file);
  const hasAnyFiles = uploadedFiles.length > 0;
  const canProceed = hasAnyFiles;

  return (
    <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Data Ingestion & Connectors</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Upload sample datasets or establish live metadata connections to source systems.</p>
        </div>
        <button
          onClick={handleRunProfiler}
          disabled={!canProceed || profiling}
          className="btn-primary"
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.875rem', 
            opacity: !canProceed || profiling ? 0.5 : 1,
            pointerEvents: !canProceed || profiling ? 'none' : 'auto',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {profiling ? (
            <>
              <Loader2 size={14} className="spin-icon" /> Profiling...
            </>
          ) : alreadyProfiled && !hasNewFiles ? (
            <>
              View Profiling Results <ArrowRight size={14} />
            </>
          ) : (
            <>
              Run Initial Profiler <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column - Active Sources */}
        <div style={{ flex: '1', borderRight: '1px solid var(--color-border)', padding: '24px 32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white-muted)' }}>Configured Sources</h3>
            <div style={{ display: 'flex', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '4px', gap: '8px', alignItems: 'center' }}>
              <Search size={14} color="var(--color-white-muted)" />
              <input type="text" placeholder="Search sources..." style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.8125rem', outline: 'none' }} />
            </div>
          </div>

          {loadingState ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
              <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 16px', display: 'block' }} />
              <div>Loading saved sources...</div>
            </div>
          ) : uploadedFiles.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
              <Database size={32} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <div>No sources configured yet.</div>
              <div style={{ fontSize: '0.8125rem', marginTop: '8px' }}>Upload CSV files using the panel on the right to begin profiling.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-white-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Size</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <File size={14} color="var(--color-green)" /> {f.name}
                    </td>
                    <td style={{ padding: '16px 0', color: 'var(--color-white-muted)' }}>Local CSV</td>
                    <td style={{ padding: '16px 0', color: 'var(--color-white-muted)' }}>{f.size}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {f.status === 'profiling' ? (
                          <span style={{ background: 'rgba(255,189,46,0.1)', color: '#ffbd2e', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(255,189,46,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Loader2 size={10} className="spin-icon" /> Profiling
                          </span>
                        ) : f.status === 'done' ? (
                          <span style={{ background: 'rgba(0,255,102,0.1)', color: 'var(--color-green)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(0,255,102,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={10} /> Profiled
                          </span>
                        ) : (
                          <>
                            <span style={{ background: 'rgba(0,180,255,0.1)', color: '#00b4ff', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(0,180,255,0.2)' }}>Ready</span>
                            <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center' }}>
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column - New Source Form */}
        <div style={{ width: '400px', background: 'var(--color-black-light)', padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white-muted)', marginBottom: '16px' }}>Add Source</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            <button 
                onClick={() => setActiveTab('upload')}
                style={{ background: 'var(--color-black)', border: `1px solid ${activeTab === 'upload' ? 'var(--color-green)' : 'var(--color-border)'}`, padding: '12px', borderRadius: '6px', color: activeTab === 'upload' ? 'var(--color-green)' : 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <UploadCloud size={20} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Data CSV</span>
            </button>
            <button 
                onClick={() => setActiveTab('database')}
                style={{ background: 'var(--color-black)', border: `1px solid ${activeTab === 'database' ? 'var(--color-green)' : 'var(--color-border)'}`, padding: '12px', borderRadius: '6px', color: activeTab === 'database' ? 'var(--color-green)' : 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Plug size={20} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Live DB</span>
            </button>
            <button 
                onClick={() => setActiveTab('docs')}
                style={{ background: 'var(--color-black)', border: `1px solid ${activeTab === 'docs' ? 'var(--color-green)' : 'var(--color-border)'}`, padding: '12px', borderRadius: '6px', color: activeTab === 'docs' ? 'var(--color-green)' : 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <File size={20} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Context Docs</span>
            </button>
          </div>

          {activeTab === 'docs' && (
              <>
                <div 
                  style={{
                    border: `1px dashed var(--color-border)`,
                    background: 'var(--color-black)',
                    borderRadius: '6px', padding: '32px 16px', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer'
                  }}
                >
                  <Plus size={24} color={'var(--color-white-muted)'} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Drop PDF/DOCX files here</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', opacity: 0.5, marginTop: '8px' }}>Business rules, data dictionaries, schema maps</div>
                </div>
              </>
          )}

          {activeTab === 'upload' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  style={{
                    border: `1px dashed ${dragActive ? 'var(--color-green)' : 'var(--color-border)'}`,
                    background: dragActive ? 'rgba(0,255,102,0.05)' : 'var(--color-black)',
                    borderRadius: '6px', padding: '32px 16px', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer'
                  }}
                >
                  <Plus size={24} color={dragActive ? 'var(--color-green)' : 'var(--color-white-muted)'} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Drop CSV files here or click to browse</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', opacity: 0.5, marginTop: '8px' }}>Supports .csv files</div>
                </div>

                {uploadedFiles.some(f => f.status === 'ready') && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                    <div style={{ color: 'var(--color-green)', fontWeight: 600, marginBottom: '8px' }}>{uploadedFiles.filter(f => f.status === 'ready').length} new file{uploadedFiles.filter(f => f.status === 'ready').length > 1 ? 's' : ''} queued</div>
                    <div style={{ color: 'var(--color-white-muted)' }}>Click &quot;Run Initial Profiler&quot; to parse and analyse your data.</div>
                  </div>
                )}

                {alreadyProfiled && !hasNewFiles && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(134,188,37,0.05)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                    <div style={{ color: 'var(--color-green)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><CheckCircle2 size={14} /> Data already profiled</div>
                    <div style={{ color: 'var(--color-white-muted)' }}>Your data from a previous session is saved. Click "View Profiling Results" to continue, or add new files to re-profile.</div>
                  </div>
                )}
              </>
          )}

          {activeTab === 'database' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!dbConnected ? (
                      <div style={{ background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ marginBottom: '16px', fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Configure connection to your live database.</div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Engine</label>
                                  <select style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }}>
                                      <option>PostgreSQL</option>
                                      <option>Snowflake</option>
                                      <option>BigQuery</option>
                                      <option>SQL Server</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Host</label>
                                  <input type="text" value={dbCreds.host} onChange={e => setDbCreds(prev => ({...prev, host: e.target.value}))} placeholder="db.internal.example.com" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                  <div style={{ flex: 1 }}>
                                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Port</label>
                                      <input type="text" value={dbCreds.port} onChange={e => setDbCreds(prev => ({...prev, port: e.target.value}))} placeholder="5432" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Database</label>
                                      <input type="text" value={dbCreds.database} onChange={e => setDbCreds(prev => ({...prev, database: e.target.value}))} placeholder="analytics_prod" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                                  </div>
                              </div>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Username</label>
                                  <input type="text" value={dbCreds.user} onChange={e => setDbCreds(prev => ({...prev, user: e.target.value}))} placeholder="service_account" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Password</label>
                                  <input type="password" value={dbCreds.password} onChange={e => setDbCreds(prev => ({...prev, password: e.target.value}))} placeholder="••••••••" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              {dbError && <div style={{ color: '#ff5f56', fontSize: '0.75rem' }}>{dbError}</div>}
                              <button 
                                onClick={handleConnectDb}
                                disabled={dbConnecting}
                                style={{ background: 'var(--color-green)', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', marginTop: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                                  {dbConnecting ? <><Loader2 size={14} className="spin-icon"/> Connecting...</> : 'Test & Connect'}
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div style={{ background: 'var(--color-black)', border: '1px solid var(--color-green)', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600 }}>
                              <Server size={16} /> Connected to PostgreSQL
                          </div>
                          
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '12px' }}>
                              Select tables to import for profiling:
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                              {dbTables.map((table, i) => (
                                  <div key={i} onClick={() => toggleTable(i)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                                      {table.selected ? <CheckSquare size={16} color="var(--color-green)" /> : <Square size={16} color="var(--color-white-muted)" />}
                                      <Database size={14} color="var(--color-white-muted)" />
                                      <span style={{ fontSize: '0.8125rem', color: table.selected ? '#fff' : 'var(--color-white-muted)' }}>{table.name}</span>
                                  </div>
                              ))}
                          </div>

                          {dbError && <div style={{ color: '#ff5f56', fontSize: '0.75rem', marginTop: '8px' }}>{dbError}</div>}

                          <button 
                            onClick={handleImportDbTables}
                            disabled={profiling || !dbTables.some(t => t.selected)}
                            style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', marginTop: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                              {profiling ? <><Loader2 size={14} className="spin-icon"/> Profiling...</> : 'Import Selected Tables'}
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
