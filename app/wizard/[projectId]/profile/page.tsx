'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowRight, AlertTriangle, Search, CheckCircle2, FileText, Hash, Calendar, Key, BarChart2, Loader2, Database } from 'lucide-react';
import { renderAIResponse } from '@/lib/markdown';

interface ColumnProfile {
  name: string;
  type: string;
  typeLabel: string;
  typeColor: string;
  typeBgColor: string;
  total: number;
  missing: number;
  missingPct: number;
  uniqueCount: number;
  uniquePct: number;
  uniqueDisplay: string;
  flags: { label: string; color: string }[];
  // numeric
  min?: number;
  max?: number;
  mean?: number;
  histogram?: number[];
  minDisplay?: string;
  maxDisplay?: string;
  // date
  dateMin?: string;
  dateMax?: string;
  dateBars?: number[];
  dateLabels?: string[];
  // categorical / boolean
  topValues?: { value: string; count: number; pct: number }[];
  // id
  visualization?: string;
  // text
  validPct?: number;
}

interface FileProfile {
  name: string;
  size: number;
  columns: ColumnProfile[];
  rowCount: number;
  sampleRows: Record<string, string>[];
}

interface Callout {
  title: string;
  description: string;
  severity: 'warning' | 'success' | 'error';
}

const SEVERITY_CONFIG = {
  warning: { color: '#ffbd2e', icon: AlertTriangle, borderColor: '#ffbd2e' },
  success: { color: 'var(--color-green)', icon: CheckCircle2, borderColor: 'var(--color-green)' },
  error: { color: '#ff5f56', icon: AlertTriangle, borderColor: '#ff5f56' },
};

function getColumnIcon(type: string) {
  switch (type) {
    case 'id': return Key;
    case 'date': return Calendar;
    case 'numeric': return Hash;
    case 'boolean':
    case 'categorical': return FileText;
    default: return FileText;
  }
}

export default function ProfilePage() {
  const { projectId } = useParams() as { projectId: string };
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ files: FileProfile[]; callouts: Callout[] } | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [aiInterpretation, setAiInterpretation] = useState<string | null>(null);
  const [interpreting, setInterpreting] = useState(false);

  useEffect(() => {
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const state = await res.json();
          if (state.stateData) {
            const parsedData = JSON.parse(state.stateData);
            if (parsedData.profileResults) {
              setProfileData(parsedData.profileResults);
            }
            if (parsedData.aiInterpretation) {
              setAiInterpretation(parsedData.aiInterpretation);
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch profile state:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchState();
  }, [projectId]);

  const generateInterpretation = async () => {
    if (!profileData) return;
    setInterpreting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/profile/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileData })
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Server returned an error');
      }

      const data = await res.json();
      setAiInterpretation(data.interpretation);
    } catch (e) {
      console.error("Failed to generate interpretation:", e);
      setAiInterpretation("An error occurred while connecting to the AI Agent. Please check your console or server logs.");
    } finally {
      setInterpreting(false);
    }
  };

  const activeFile = profileData?.files?.[activeFileIndex];
  const callouts = profileData?.callouts || [];

  const filteredColumns = activeFile?.columns.filter(col =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalMissing = activeFile
    ? (activeFile.columns.reduce((sum, c) => sum + c.missingPct, 0) / activeFile.columns.length).toFixed(1)
    : '0';

  const router = useRouter();

  const handleNext = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const state = await res.json();
      const completedSteps = state.completedSteps ? JSON.parse(state.completedSteps) : [];
      if (!completedSteps.includes('profile')) {
        completedSteps.push('profile');
      }

      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'requirements',
          completedSteps
        })
      });
      router.push(`/wizard/${projectId}/requirements`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/requirements`);
    }
  };

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Data Understanding & Rules Profiler</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Deterministic, Kaggle-style structural analysis generated via automated parser rules. No AI utilized.</p>
        </div>
        <button onClick={handleNext} className="btn-primary" style={{ border: 'none', cursor: 'pointer', padding: '8px 16px', fontSize: '0.875rem', opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Define Requirements <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#050505' }}>
        {loading ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
             <Loader2 size={40} color="var(--color-green)" className="spin-icon" />
             <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
               Executing deterministic CSV rules on uploaded data...
             </div>
             <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
          </div>
        ) : !profileData || !activeFile ? (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <Database size={40} style={{ opacity: 0.3 }} />
            <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)', textAlign: 'center' }}>
              No profiling data available.<br />
              <Link href="/wizard/upload" style={{ color: 'var(--color-green)', textDecoration: 'underline' }}>Go back to upload files first.</Link>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', padding: '32px' }}>
            
            {/* Top Summary area - Callouts & AI Interpretation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px', flexShrink: 0 }}>
              
              {/* Callouts Panel */}
              {callouts.length > 0 && (
                <div style={{ padding: '24px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-white)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} color="var(--color-green)" /> Key Profiling Callouts
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                    {callouts.slice(0, 3).map((callout, i) => {
                      const config = SEVERITY_CONFIG[callout.severity];
                      const Icon = config.icon;
                      return (
                        <div key={i} style={{ borderLeft: `3px solid ${config.borderColor}`, paddingLeft: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: config.color, fontWeight: 600, fontSize: '0.8125rem', marginBottom: '4px' }}>
                            <Icon size={14} /> {callout.title.replace(/`/g, '')}
                          </div>
                          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem', lineHeight: 1.5 }}>
                            {callout.description.split('`').map((part, j) => 
                              j % 2 === 1 ? <code key={j}>{part}</code> : <span key={j}>{part}</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Interpretation Panel */}
              <div style={{ padding: '24px', background: 'rgba(134,188,37,0.02)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '8px', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-green)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="2"/>
                  </svg>
                  Profile Interpretation Agent
                </h3>
                
                {aiInterpretation ? (
                  <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }} dangerouslySetInnerHTML={{ __html: renderAIResponse(aiInterpretation) }} />
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '16px' }}>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)' }}>Use the AI Agent to interpret these deterministic profiling results and extract business insights.</p>
                    <button 
                      onClick={generateInterpretation} 
                      disabled={interpreting}
                      style={{ padding: '8px 16px', background: 'rgba(0,255,102,0.1)', color: 'var(--color-green)', border: '1px solid rgba(0,255,102,0.2)', borderRadius: '6px', fontSize: '0.875rem', cursor: interpreting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {interpreting ? <Loader2 size={16} className="spin-icon" /> : <BarChart2 size={16} />}
                      {interpreting ? 'Analyzing Data...' : 'Interpret Profile'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* File tabs */}
            <div style={{ display: 'flex', gap: '32px', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', flexShrink: 0 }}>
              {profileData.files.map((file, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFileIndex(i)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: i === activeFileIndex ? 'var(--color-white)' : 'var(--color-white-muted)',
                    borderBottom: i === activeFileIndex ? '2px solid var(--color-green)' : '2px solid transparent',
                    paddingBottom: '14px',
                    marginBottom: '-14px',
                    cursor: 'pointer',
                  }}
                >
                  {file.name}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '24px', fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>
                <span><strong>{activeFile.rowCount.toLocaleString()}</strong> total rows</span>
                <span><strong>{totalMissing}%</strong> missing overall</span>
                <span><strong>{activeFile.columns.length}</strong> columns</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '6px 12px' }}>
                <Search size={14} color="var(--color-white-muted)" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search columns..."
                  style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.8125rem', outline: 'none' }}
                />
              </div>
            </div>

            {/* Kaggle-style Data Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-black-light)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${filteredColumns.length * 250}px`, textAlign: 'left' }}>
                <thead>
                  <tr>
                    {filteredColumns.map((col, i) => {
                      const Icon = getColumnIcon(col.type);
                      return (
                        <th key={i} style={{ width: '250px', minWidth: '250px', padding: '16px', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)', borderRight: i < filteredColumns.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-black)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '160px', fontWeight: 'normal' }}>
                            {/* Column Name */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-white)', fontSize: '0.875rem' }}>
                                <Icon size={14} color="var(--color-white-muted)" /> {col.name}
                              </div>
                              <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-white-muted)', opacity: 0.5 }} title="Add Data Quality Rule">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                              </button>
                            </div>

                            {/* Type badges */}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                              <span style={{ display: 'inline-block', background: col.typeBgColor, color: col.typeColor, fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>{col.typeLabel}</span>
                              {col.flags.map((flag, fi) => (
                                <span key={fi} style={{ display: 'inline-block', border: `1px solid ${flag.color}`, color: flag.color, fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', letterSpacing: '0.05em' }}>{flag.label}</span>
                              ))}
                            </div>

                            {/* Stats */}
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                              <div>Unique: <strong>{col.uniqueDisplay}</strong></div>
                              <div>Missing: <strong style={{ color: col.missingPct > 5 ? '#ffbd2e' : 'inherit' }}>{col.missingPct}%</strong></div>
                            </div>

                            {/* Visualization */}
                            <div style={{ marginTop: 'auto' }}>
                              {col.type === 'numeric' && col.histogram && (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '32px' }}>
                                    {col.histogram.map((h, hi) => (
                                      <div key={hi} style={{ flex: 1, background: 'var(--color-green)', height: `${Math.max(h, 2)}%`, opacity: 0.8, borderRadius: '1px 1px 0 0' }} />
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: 'var(--color-white-muted)' }}>
                                    <span>{col.minDisplay}</span><span>{col.maxDisplay}</span>
                                  </div>
                                </>
                              )}

                              {col.type === 'date' && col.dateBars && (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0px', height: '32px' }}>
                                    {col.dateBars.map((h, hi) => (
                                      <div key={hi} style={{ flex: 1, borderTop: '1px solid var(--color-green)', height: `${Math.max(h, 5)}%`, opacity: 0.8 }} />
                                    ))}
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.65rem', color: 'var(--color-white-muted)' }}>
                                    <span>{col.dateLabels?.[0]}</span><span>{col.dateLabels?.[1]}</span>
                                  </div>
                                </>
                              )}

                              {(col.type === 'categorical' || col.type === 'boolean') && col.topValues && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {col.topValues.slice(0, 3).map((tv, ti) => (
                                    <div key={ti} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ width: '50px', fontSize: '0.65rem', color: 'var(--color-white-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tv.value}</span>
                                      <div style={{ flex: 1, height: '4px', background: 'var(--color-black-light)' }}>
                                        <div style={{ width: `${tv.pct}%`, height: '100%', background: `rgba(134,188,37,${1 - ti * 0.25})` }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {col.type === 'id' && (
                                <>
                                  <div style={{ height: '32px', display: 'flex', alignItems: 'flex-end', opacity: 0.5 }}>
                                    <div style={{ width: '100%', height: '100%', background: 'repeating-linear-gradient(45deg, var(--color-border), var(--color-border) 2px, transparent 2px, transparent 4px)', borderRadius: '2px' }} />
                                  </div>
                                  <div style={{ marginTop: '4px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--color-white-muted)' }}>
                                    {col.uniquePct >= 99 ? '100% Distinct Values' : `${col.uniquePct}% Distinct`}
                                  </div>
                                </>
                              )}

                              {col.type === 'text' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '40px', fontSize: '0.65rem', color: 'var(--color-white-muted)' }}>Valid</span>
                                    <div style={{ flex: 1, height: '4px', background: 'var(--color-black-light)' }}><div style={{ width: `${col.validPct || 100}%`, height: '100%', background: 'var(--color-green)' }} /></div>
                                  </div>
                                  {col.missingPct > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <span style={{ width: '40px', fontSize: '0.65rem', color: 'var(--color-white-muted)' }}>Null</span>
                                      <div style={{ flex: 1, height: '4px', background: 'var(--color-black-light)' }}><div style={{ width: `${col.missingPct}%`, height: '100%', background: '#ffbd2e' }} /></div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeFile.sampleRows.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {filteredColumns.map((col, ci) => {
                        const val = row[col.name];
                        const isEmpty = !val || val.trim() === '';
                        return (
                          <td key={ci} style={{ padding: '12px 16px', fontSize: '0.8125rem', borderRight: ci < filteredColumns.length - 1 ? '1px solid var(--color-border)' : 'none', opacity: isEmpty ? 0.4 : 1, fontStyle: isEmpty ? 'italic' : 'normal' }}>
                            {isEmpty ? 'null' : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={filteredColumns.length} style={{ padding: '16px', textAlign: 'center', fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>
                      Showing sample of {activeFile.sampleRows.length} rows ({activeFile.rowCount.toLocaleString()} total rows)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
