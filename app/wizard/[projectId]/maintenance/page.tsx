'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Activity, AlertTriangle, CheckCircle2, Clock, PlayCircle, Settings, ShieldAlert, Terminal, RefreshCw, BarChart2, Database } from 'lucide-react';

export default function MaintenancePage() {
  const { projectId } = useParams() as { projectId: string };
  const [activeTab, setActiveTab] = useState<'overview' | 'quality' | 'logs'>('overview');

  const recentRuns = [
    { id: 'run_8f4a', status: 'success', duration: '2m 14s', time: '10 mins ago', records: '1.2M' },
    { id: 'run_7e3b', status: 'success', duration: '1m 58s', time: '1 hour ago', records: '1.2M' },
    { id: 'run_6d2c', status: 'error', duration: '45s', time: '2 hours ago', records: '-' },
    { id: 'run_5c1d', status: 'success', duration: '2m 05s', time: '3 hours ago', records: '1.1M' },
  ];

  const dataQualityAlerts = [
    { table: 'fact_sales', issue: 'Null values detected in product_key', severity: 'high', time: '2 hours ago' },
    { table: 'dim_customer', issue: 'Unusual spike in new records (+400%)', severity: 'medium', time: '1 day ago' },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={20} color="var(--color-green)" /> Day-2 Maintenance & Observability
          </h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Monitor pipeline health, data quality, and agentic drift post-deployment.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
             <Settings size={14} /> Configure Alerts
          </button>
          <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={14} /> Trigger Manual Run
          </button>
        </div>
      </div>

      <div style={{ padding: '0 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '24px', background: 'var(--color-black-light)' }}>
         <button onClick={() => setActiveTab('overview')} style={{ background: 'transparent', border: 'none', padding: '16px 0', fontSize: '0.875rem', fontWeight: 600, color: activeTab === 'overview' ? 'var(--color-green)' : 'var(--color-white-muted)', borderBottom: activeTab === 'overview' ? '2px solid var(--color-green)' : '2px solid transparent', cursor: 'pointer' }}>Pipeline Overview</button>
         <button onClick={() => setActiveTab('quality')} style={{ background: 'transparent', border: 'none', padding: '16px 0', fontSize: '0.875rem', fontWeight: 600, color: activeTab === 'quality' ? 'var(--color-green)' : 'var(--color-white-muted)', borderBottom: activeTab === 'quality' ? '2px solid var(--color-green)' : '2px solid transparent', cursor: 'pointer' }}>Data Quality Monitors</button>
         <button onClick={() => setActiveTab('logs')} style={{ background: 'transparent', border: 'none', padding: '16px 0', fontSize: '0.875rem', fontWeight: 600, color: activeTab === 'logs' ? 'var(--color-green)' : 'var(--color-white-muted)', borderBottom: activeTab === 'logs' ? '2px solid var(--color-green)' : '2px solid transparent', cursor: 'pointer' }}>Agent Execution Logs</button>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#050505' }}>
        
        {activeTab === 'overview' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Pipeline Status</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle2 size={18} /> Healthy</div>
              </div>
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Last Run</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} color="var(--color-white-muted)" /> 10 mins ago</div>
              </div>
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Data Processed (24h)</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={18} color="var(--color-white-muted)" /> 14.8M Rows</div>
              </div>
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '20px', borderRadius: '8px' }}>
                 <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Agent Interventions</div>
                 <div style={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffbd2e', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} /> 2 actions taken</div>
              </div>
            </div>

            {/* Run History */}
            <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.875rem' }}>Recent Orchestration Runs</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-white-muted)', textAlign: 'left', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Run ID</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Time</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Duration</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Records</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace' }}>{run.id}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {run.status === 'success' ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-green)', background: 'rgba(0,255,102,0.1)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem' }}><CheckCircle2 size={12} /> Success</span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ff5f56', background: 'rgba(255,95,86,0.1)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem' }}><AlertTriangle size={12} /> Failed</span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-white-muted)' }}>{run.time}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-white-muted)' }}>{run.duration}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--color-white-muted)' }}>{run.records}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--color-green)', fontSize: '0.75rem', cursor: 'pointer' }}>View Logs</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'quality' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Active Data Quality Alerts</h3>
               <button style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.8125rem', cursor: 'pointer' }}>Acknowledge All</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {dataQualityAlerts.map((alert, i) => (
                <div key={i} style={{ background: 'var(--color-black-light)', border: `1px solid ${alert.severity === 'high' ? 'rgba(255,95,86,0.3)' : 'rgba(255,189,46,0.3)'}`, borderLeft: `4px solid ${alert.severity === 'high' ? '#ff5f56' : '#ffbd2e'}`, borderRadius: '6px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', fontFamily: 'monospace' }}>{alert.table}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>{alert.time}</span>
                      </div>
                      <div style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--color-white)' }}>{alert.issue}</div>
                   </div>
                   <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '8px 16px', borderRadius: '4px', fontSize: '0.8125rem', cursor: 'pointer' }}>Investigate</button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '16px', padding: '24px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', textAlign: 'center' }}>
               <BarChart2 size={32} color="var(--color-green)" style={{ opacity: 0.5 }} />
               <div>
                  <div style={{ fontWeight: 600 }}>Coverage is currently at 100%</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginTop: '4px' }}>All primary keys and foreign keys have not_null and unique tests applied.</div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="animate-fade-in" style={{ height: '100%', background: '#000', border: '1px solid var(--color-border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
             <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-black-light)' }}>
                <Terminal size={14} color="var(--color-white-muted)" /> <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>Agent Interaction Console</span>
             </div>
             <div style={{ padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-white-muted)', lineHeight: 1.6, overflowY: 'auto' }}>
                <div style={{ marginBottom: '12px' }}>
                   <span style={{ color: '#00b4ff' }}>[SYSTEM]</span> 2026-05-04 08:00:00 UTC - Initiating scheduled pipeline run.
                </div>
                <div style={{ marginBottom: '12px' }}>
                   <span style={{ color: 'var(--color-green)' }}>[AGENT]</span> 2026-05-04 08:00:15 UTC - Schema drift detected in source system <code>raw_erp.sales_transactions</code>. New column <code>discount_code</code> found.
                </div>
                <div style={{ marginBottom: '12px' }}>
                   <span style={{ color: 'var(--color-green)' }}>[AGENT]</span> 2026-05-04 08:00:16 UTC - Auto-generating DDL to alter <code>fact_sales</code> and add <code>discount_code VARCHAR(50)</code>.
                </div>
                <div style={{ marginBottom: '12px' }}>
                   <span style={{ color: '#ffbd2e' }}>[AGENT: GUARDRAIL]</span> 2026-05-04 08:00:18 UTC - Intervention required. Mutation paused pending Human-in-the-Loop approval.
                </div>
                <div style={{ marginBottom: '12px' }}>
                   <span style={{ color: '#00b4ff' }}>[SYSTEM]</span> 2026-05-04 08:01:00 UTC - Pipeline execution completed. Proceeding to tests.
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
