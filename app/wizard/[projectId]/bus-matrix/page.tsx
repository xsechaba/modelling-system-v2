'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Grid, Plus, Check, X, Edit2, Trash2, Loader2, Save } from 'lucide-react';
import { useWizard } from '@/components/WizardContext';

export default function BusMatrixPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const { markStepComplete } = useWizard();

  const [matrix, setMatrix] = useState<{ process: string, dims: boolean[] }[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.stateData || '{}');
          
          if (parsed.busMatrix) {
            setDimensions(parsed.busMatrix.dimensions || []);
            setMatrix(parsed.busMatrix.matrix || []);
            // Check staleness: requirements updated after bus matrix was last generated
            const reqAt = parsed.requirementsUpdatedAt || parsed.requirementsBankedAt || 0;
            const matrixAt = parsed.busMatrixGeneratedAt || 0;
            if (reqAt > matrixAt && matrixAt > 0) setIsStale(true);
            setLoading(false);
          } else {
            // No matrix yet — if requirements exist, show the Generate prompt prominently
            setLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);

  const saveToState = async (newDimensions: string[], newMatrix: any[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const parsed = JSON.parse(data.stateData || '{}');
      
      parsed.busMatrix = { dimensions: newDimensions, matrix: newMatrix };
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'bus-matrix',
          stateData: JSON.stringify(parsed)
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleCell = (rIdx: number, cIdx: number) => {
    const newMatrix = [...matrix];
    newMatrix[rIdx].dims[cIdx] = !newMatrix[rIdx].dims[cIdx];
    setMatrix(newMatrix);
    saveToState(dimensions, newMatrix);
  };

  const addProcess = () => {
    const name = prompt('Enter Business Process Name:');
    if (!name) return;
    const newMatrix = [...matrix, { process: name, dims: dimensions.map(() => false) }];
    setMatrix(newMatrix);
    saveToState(dimensions, newMatrix);
  };

  const addDimension = () => {
    const name = prompt('Enter Dimension Name:');
    if (!name) return;
    const newDimensions = [...dimensions, name];
    const newMatrix = matrix.map(r => ({ ...r, dims: [...r.dims, false] }));
    setDimensions(newDimensions);
    setMatrix(newMatrix);
    saveToState(newDimensions, newMatrix);
  };

  const deleteProcess = (idx: number) => {
    if (!confirm('Remove this process?')) return;
    const newMatrix = matrix.filter((_, i) => i !== idx);
    setMatrix(newMatrix);
    saveToState(dimensions, newMatrix);
  };

  const deleteDimension = (idx: number) => {
    if (!confirm('Remove this dimension?')) return;
    const newDimensions = dimensions.filter((_, i) => i !== idx);
    const newMatrix = matrix.map(r => ({
      ...r,
      dims: r.dims.filter((_, i) => i !== idx)
    }));
    setDimensions(newDimensions);
    setMatrix(newMatrix);
    saveToState(newDimensions, newMatrix);
  };

  const handleProceed = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const completedSteps = JSON.parse(data.completedSteps || '[]');
      if (!completedSteps.includes('bus-matrix')) completedSteps.push('bus-matrix');
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'review',
          completedSteps
        })
      });
      markStepComplete('bus-matrix');
      router.push(`/wizard/${projectId}/review`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/review`);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
         <Loader2 size={40} color="var(--color-green)" className="spin-icon" />
         <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)' }}>AI is mapping KPIs to the Bus Matrix...</div>
         <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Enterprise Bus Matrix</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Align business processes (Facts) to Conformed Dimensions before generating the physical ERD.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {saving && <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={12} className="spin-icon" /> Saving...</span>}
          <button onClick={handleProceed} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Generate Schema <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-page)' }}>
        
        {/* Staleness warning */}
        {isStale && (
          <div style={{ maxWidth: '1000px', margin: '0 auto 16px', padding: '10px 16px', background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#ffbd2e' }}>
            <span>⚠ Requirements have been updated since this bus matrix was generated. Click <strong>Generate via AI</strong> to refresh.</span>
            <button onClick={() => setIsStale(false)} style={{ background: 'transparent', border: 'none', color: '#ffbd2e', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
          </div>
        )}
        
        <div className="animate-fade-in" style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Toolbar */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9375rem' }}>
                    <Grid size={18} color="var(--color-green)" /> Conformed Dimensional Matrix
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={addProcess} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Plus size={12}/> Add Process</button>
                    <button onClick={addDimension} style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Plus size={12}/> Add Dimension</button>
                    <button onClick={async () => {
                        setLoading(true);
                        try {
                            const genRes = await fetch(`/api/projects/${projectId}/bus-matrix/generate`, { method: 'POST' });
                            if (genRes.ok) {
                                const genData = await genRes.json();
                                setDimensions(genData.dimensions || []);
                                setMatrix(genData.matrix || []);
                                // Record generation timestamp, clear stale warning
                                const stRes = await fetch(`/api/projects/${projectId}/state`);
                                const stData = await stRes.json();
                                const stParsed = JSON.parse(stData.stateData || '{}');
                                stParsed.busMatrixGeneratedAt = Date.now();
                                await fetch(`/api/projects/${projectId}/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stateData: JSON.stringify(stParsed) }) });
                                setIsStale(false);
                            }
                        } catch(e) { console.error(e) }
                        setLoading(false);
                    }} style={{ background: 'var(--color-green)', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 600 }}>Generate via AI</button>
                </div>
            </div>

            {/* Matrix Grid */}
            <div style={{ overflowX: 'auto', position: 'relative' }}>
                {dimensions.length === 0 && matrix.length === 0 ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', zIndex: 10, background: 'var(--color-black-light)' }}>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-white)' }}>No bus matrix generated yet.</h2>
                            <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', maxWidth: '400px' }}>You can create one manually, or generate one automatically from your requirements.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={addProcess} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px' }}>Start from Scratch</button>
                            <button onClick={async () => {
                                setLoading(true);
                                try {
                                    const genRes = await fetch(`/api/projects/${projectId}/bus-matrix/generate`, { method: 'POST' });
                                    if (genRes.ok) {
                                        const genData = await genRes.json();
                                        setDimensions(genData.dimensions || []);
                                        setMatrix(genData.matrix || []);
                                        const stRes = await fetch(`/api/projects/${projectId}/state`);
                                        const stData = await stRes.json();
                                        const stParsed = JSON.parse(stData.stateData || '{}');
                                        stParsed.busMatrixGeneratedAt = Date.now();
                                        await fetch(`/api/projects/${projectId}/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stateData: JSON.stringify(stParsed) }) });
                                        setIsStale(false);
                                    }
                                } catch(e) { console.error(e) }
                                setLoading(false);
                            }} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', background: 'var(--color-green)', color: '#000', border: 'none', fontWeight: 600 }}>Generate via AI</button>
                        </div>
                    </div>
                ) : null}
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '250px', padding: '16px', textAlign: 'left', borderBottom: '2px solid var(--color-border)', borderRight: '2px solid var(--color-border)', color: 'var(--color-white-muted)', fontSize: '0.75rem', textTransform: 'uppercase', background: 'rgba(0,0,0,0.5)' }}>Business Process (Fact)</th>
                            {dimensions.map((dim, i) => (
                                <th 
                                    key={i} 
                                    onMouseEnter={() => setHoveredCol(i)}
                                    onMouseLeave={() => setHoveredCol(null)}
                                    style={{ padding: '16px', textAlign: 'center', borderBottom: '2px solid var(--color-border)', borderRight: i === dimensions.length -1 ? 'none' : '1px solid var(--color-border)', fontWeight: 600, fontSize: '0.875rem', minWidth: '120px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        {dim}
                                        <div style={{ display: 'flex', gap: '4px', opacity: hoveredCol === i ? 1 : 0, transition: 'opacity 0.2s' }}>
                                            <Trash2 size={14} color="#ff5f56" style={{ cursor: 'pointer' }} onClick={() => deleteDimension(i)} />
                                        </div>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, rIdx) => (
                            <tr key={rIdx} style={{ borderBottom: rIdx === matrix.length -1 ? 'none' : '1px solid var(--color-border)' }}>
                                <td 
                                    onMouseEnter={() => setHoveredRow(rIdx)}
                                    onMouseLeave={() => setHoveredRow(null)}
                                    style={{ padding: '16px', borderRight: '2px solid var(--color-border)', fontWeight: 500, fontSize: '0.875rem', background: 'rgba(0,0,0,0.2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        {row.process}
                                        <div style={{ display: 'flex', gap: '8px', opacity: hoveredRow === rIdx ? 1 : 0, transition: 'opacity 0.2s' }}>
                                            <Trash2 size={14} color="#ff5f56" style={{ cursor: 'pointer' }} onClick={() => deleteProcess(rIdx)} />
                                        </div>
                                    </div>
                                </td>
                                {row.dims.map((isActive, cIdx) => (
                                    <td key={cIdx} style={{ borderRight: cIdx === dimensions.length -1 ? 'none' : '1px solid var(--color-border)', textAlign: 'center', padding: '0' }}>
                                        <button 
                                            onClick={() => toggleCell(rIdx, cIdx)}
                                            style={{ 
                                                width: '100%', height: '100%', minHeight: '44px', background: isActive ? 'rgba(134,188,37,0.1)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = isActive ? 'rgba(134,188,37,0.2)' : 'rgba(255,255,255,0.05)'}
                                            onMouseLeave={e => e.currentTarget.style.background = isActive ? 'rgba(134,188,37,0.1)' : 'transparent'}
                                        >
                                            {isActive ? <Check size={20} color="var(--color-green)" /> : <X size={20} color="var(--color-border)" opacity={0.3} />}
                                        </button>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
        
        <div style={{ maxWidth: '1000px', margin: '24px auto', fontSize: '0.8125rem', color: 'var(--color-white-muted)', textAlign: 'center', lineHeight: 1.6 }}>
            The AI Agent maps your extracted requirements automatically onto the Conformed Bus Matrix. <br />
            Review and adjust intersections. Clicking "Generate Schema" will trace these mappings to architect physical Fact and Dimension tables.
        </div>

      </div>
    </div>
  );
}