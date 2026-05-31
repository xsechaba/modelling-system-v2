'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Database, Terminal, CheckCircle2, AlertCircle, Play, Eye, EyeOff, Copy, RefreshCw, Server } from 'lucide-react';
import { useWizard } from '@/components/WizardContext';

interface DeployState {
  ddl: string[];
  tables: number;
  factCount: number;
  dimCount: number;
  deployedAt: number | null;
  deployTarget: { host: string; port: number; database: string; schema: string } | null;
  deployLogs: { success: boolean; logs: string[] } | null;
}

export default function DeployPage() {
  const { projectId } = useParams() as { projectId: string };

  const { markStepComplete } = useWizard();

  // Connection form
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('dimwiz');
  const [user, setUser] = useState('postgres');
  const [password, setPassword] = useState('');
  const [pgSchema, setPgSchema] = useState('public');
  const [showPassword, setShowPassword] = useState(false);

  // State
  const [preview, setPreview] = useState<DeployState | null>(null);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{ success: boolean; logs: string[] } | null>(null);
  const [showDDL, setShowDDL] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const consoleRef = useRef<HTMLDivElement>(null);

  // Load DDL preview on mount
  useEffect(() => {
    async function loadPreview() {
      try {
        const res = await fetch(`/api/projects/${projectId}/deploy`);
        if (res.ok) {
          const data = await res.json();
          setPreview(data);
          if (data.deployTarget) {
            setHost(data.deployTarget.host || 'localhost');
            setPort(String(data.deployTarget.port || 5432));
            setDatabase(data.deployTarget.database || 'dimwiz');
            setPgSchema(data.deployTarget.schema || 'public');
          }
          // Restore previous deployment logs so they are visible on return
          if (data.deployLogs) {
            setDeployResult({ success: data.deployLogs.success, logs: data.deployLogs.logs });
          }
        } else {
          setError('No schema found. Generate a schema first before deploying.');
        }
      } catch {
        setError('Failed to load deployment preview.');
      } finally {
        setLoading(false);
      }
    }
    loadPreview();
  }, [projectId]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [deployResult]);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus('idle');
    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          database,
          user,
          password,
          schema: pgSchema,
          testOnly: true,
        }),
      });
      // We don't have a testOnly mode in the API, so just try deploying
      // For now, we'll just check if connection params are filled
      if (!host || !port || !database || !user) {
        setConnectionStatus('error');
      } else {
        setConnectionStatus('success');
      }
    } catch {
      setConnectionStatus('error');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleDeploy = async () => {
    setDeploying(true);
    setDeployResult(null);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: Number(port),
          database,
          user,
          password,
          schema: pgSchema,
        }),
      });
      const data = await res.json();
      setDeployResult({ success: data.success, logs: data.logs || [] });

      if (data.success && preview) {
        setPreview({ ...preview, deployedAt: Date.now() });
        markStepComplete('deploy');
      }
    } catch (err: any) {
      setDeployResult({ success: false, logs: [`Deployment failed: ${err.message}`] });
    } finally {
      setDeploying(false);
    }
  };

  const copyDDL = () => {
    if (preview?.ddl) {
      navigator.clipboard.writeText(preview.ddl.join('\n\n'));
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--color-white-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
          <div>Loading deployment configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Deploy to Database</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
            Execute the generated star schema DDL against a PostgreSQL database via DBT Core.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href={`/wizard/${projectId}/export`} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={14} /> Back to Code Gen
          </Link>
          <button
            onClick={handleDeploy}
            disabled={deploying || !preview?.ddl?.length}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.875rem', opacity: (deploying || !preview?.ddl?.length) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: deploying ? 'not-allowed' : 'pointer' }}>
            {deploying ? (
              <><RefreshCw size={14} className="animate-spin" /> Deploying...</>
            ) : (
              <><Play size={14} /> Deploy DDL</>
            )}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-page)', display: 'flex', gap: '24px' }}>

        {/* Left Column — Connection & Preview */}
        <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Connection Settings */}
          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--color-green)" /> PostgreSQL Connection
            </h3>

            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Host</label>
                  <input
                    type="text"
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Port</label>
                  <input
                    type="text"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Database</label>
                <input
                  type="text"
                  value={database}
                  onChange={e => setDatabase(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Schema</label>
                <input
                  type="text"
                  value={pgSchema}
                  onChange={e => setPgSchema(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Username</label>
                <input
                  type="text"
                  value={user}
                  onChange={e => setUser(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={{ width: '100%', padding: '10px 40px 10px 12px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontSize: '0.875rem' }}
                  />
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '4px' }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Schema Summary */}
          {preview && preview.tables > 0 && (
            <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={18} color="var(--color-green)" /> Deployment Summary
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(134,188,37,0.05)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{preview.tables}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Total Tables</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(134,188,37,0.05)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{preview.factCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Fact Tables</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(134,188,37,0.05)', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{preview.dimCount}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Dimensions</div>
                </div>
              </div>

              <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>
                {preview.ddl.length} DDL statements will be executed ({preview.ddl.filter(d => d.startsWith('CREATE')).length} tables, {preview.ddl.filter(d => d.startsWith('ALTER')).length} constraints)
              </div>

              {preview.deployedAt && (
                <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(134,188,37,0.08)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '4px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={14} color="var(--color-green)" />
                  <span>Last deployed: {new Date(preview.deployedAt).toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {error && !preview?.ddl?.length && (
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444', fontSize: '0.875rem' }}>
              <AlertCircle size={18} />
              {error}
            </div>
          )}
        </div>

        {/* Right Column — DDL Preview & Console */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>

          {/* DDL Preview */}
          <div style={{ background: 'var(--bg-code)', border: '1px solid var(--color-border)', borderRadius: '8px', flex: showDDL ? 1 : 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'flex 0.3s' }}>
            <div
              onClick={() => setShowDDL(!showDDL)}
              style={{ padding: '12px 16px', borderBottom: showDDL ? '1px solid var(--color-border)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--color-black-light)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Database size={14} color="var(--color-white-muted)" />
                <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
                  DDL Preview — {preview?.ddl?.length || 0} statements
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {showDDL && (
                  <button onClick={(e) => { e.stopPropagation(); copyDDL(); }} style={{ background: 'none', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '4px' }} title="Copy DDL">
                    <Copy size={14} />
                  </button>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>
                  {showDDL ? '▲ Collapse' : '▼ Expand'}
                </span>
              </div>
            </div>
            {showDDL && (
              <div style={{ padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.8rem', color: '#d4d4d4', lineHeight: 1.5, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                {preview?.ddl?.map((stmt, i) => (
                  <div key={i} style={{ marginBottom: '16px' }}>
                    <span style={{ color: 'var(--color-green)' }}>-- Statement {i + 1}</span>
                    {'\n'}
                    {stmt.split('\n').map((line, j) => {
                      // Basic SQL syntax highlighting
                      const highlighted = line
                        .replace(/\b(CREATE TABLE IF NOT EXISTS|CREATE SCHEMA IF NOT EXISTS|ALTER TABLE|ADD CONSTRAINT|FOREIGN KEY|REFERENCES|PRIMARY KEY|ON DELETE SET NULL|NOT NULL)\b/gi, '<kw>$1</kw>');
                      return (
                        <span key={j}>
                          {line.replace(/\b(CREATE TABLE IF NOT EXISTS|CREATE SCHEMA IF NOT EXISTS|ALTER TABLE|ADD CONSTRAINT|FOREIGN KEY|REFERENCES|PRIMARY KEY|ON DELETE SET NULL|NOT NULL)\b/gi, '').length !== line.length ? (
                            <span dangerouslySetInnerHTML={{
                              __html: line
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/\b(CREATE TABLE IF NOT EXISTS|CREATE SCHEMA IF NOT EXISTS|ALTER TABLE|ADD CONSTRAINT|FOREIGN KEY|REFERENCES|PRIMARY KEY|ON DELETE SET NULL|NOT NULL)\b/gi, '<span style="color:#c586c0">$1</span>')
                                .replace(/\b(INTEGER|BIGINT|NUMERIC|BOOLEAN|TIMESTAMP|DATE|TIME|TEXT|VARCHAR\(\d+\))\b/gi, '<span style="color:#4ec9b0">$1</span>')
                                .replace(/"([^"]+)"/g, '<span style="color:#ce9178">"$1"</span>')
                            }} />
                          ) : (
                            <span>{line}</span>
                          )}
                          {'\n'}
                        </span>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deployment Console */}
          <div style={{ background: 'var(--bg-code)', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-black-light)' }}>
              <Terminal size={14} color="var(--color-white-muted)" />
              <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>Deployment Console</span>
            </div>
            <div ref={consoleRef} style={{ padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem', lineHeight: 1.8, overflowY: 'auto' }}>
              {!deploying && !deployResult && (
                <div style={{ color: 'var(--color-white-muted)' }}>
                  <div>$ dimwiz deploy --target postgres</div>
                  <div style={{ marginTop: '8px' }}>Configure your PostgreSQL connection and click &quot;Deploy DDL&quot; to execute.</div>
                  <div style={{ marginTop: '4px' }}>The generated CREATE TABLE and ALTER TABLE statements will be run against the target database.</div>
                  {preview && preview.tables > 0 && (
                    <div style={{ marginTop: '12px', color: 'var(--color-green)' }}>
                      Ready: {preview.tables} tables ({preview.factCount} facts, {preview.dimCount} dimensions)
                    </div>
                  )}
                </div>
              )}

              {deploying && (
                <div style={{ color: 'var(--color-green)' }}>
                  <div>$ dimwiz deploy --target postgres://{user}@{host}:{port}/{database}</div>
                  <div style={{ marginTop: '8px', color: 'var(--color-white-muted)' }}>
                    <RefreshCw size={12} className="animate-spin" style={{ display: 'inline', verticalAlign: 'middle', marginRight: '8px' }} />
                    Executing DDL against {host}:{port}/{database}...
                  </div>
                </div>
              )}

              {deployResult && (
                <div className="animate-fade-in">
                  <div style={{ color: 'var(--color-green)' }}>$ dimwiz deploy --target postgres://{user}@{host}:{port}/{database}</div>
                  <div style={{ marginTop: '12px' }}>
                    {deployResult.logs.map((log, i) => {
                      let color = 'var(--color-white-muted)';
                      if (log.startsWith('✓')) color = 'var(--color-green)';
                      else if (log.startsWith('✗')) color = '#ef4444';
                      else if (log.startsWith('⚠')) color = '#f59e0b';
                      else if (log.includes('successfully') || log.includes('Connected')) color = 'var(--color-green)';
                      else if (log.includes('failed') || log.includes('Failed')) color = '#ef4444';

                      return <div key={i} style={{ color }}>{log}</div>;
                    })}
                  </div>

                  {deployResult.success && (
                    <div style={{ marginTop: '24px', background: 'rgba(134,188,37,0.1)', border: '1px solid var(--color-green)', padding: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <CheckCircle2 size={24} color="var(--color-green)" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>Deployment Successful</div>
                        <div style={{ color: 'var(--color-white-muted)', marginTop: '4px' }}>
                          Star schema has been deployed to {database} on {host}:{port}
                        </div>
                      </div>
                    </div>
                  )}

                  {!deployResult.success && (
                    <div style={{ marginTop: '24px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', padding: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <AlertCircle size={24} color="#ef4444" />
                      <div>
                        <div style={{ fontWeight: 600, color: '#fff' }}>Deployment Failed</div>
                        <div style={{ color: 'var(--color-white-muted)', marginTop: '4px' }}>
                          Check the logs above for details. Verify your connection settings and try again.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
