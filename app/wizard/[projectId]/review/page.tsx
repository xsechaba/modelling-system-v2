'use client';
import React, { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Plus, Database, Settings2, Trash2, Edit2, Loader2, Bot, Send } from 'lucide-react';
import { renderAIResponse } from '@/lib/markdown';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState, addEdge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const DimNode = ({ id, data, selected }: any) => (
  <div style={{ width: '220px', background: 'var(--color-black)', border: selected ? '2px solid var(--color-white)' : '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-black-light)', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-white)' }}>
        {data.label} 
        <Edit2 size={12} style={{cursor: 'pointer', color: 'var(--color-white-muted)'}} onClick={(e) => { e.stopPropagation(); data.onEditLabel(id, data.label); }} />
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-white)' }}>DIM</span>
        <Trash2 size={12} color="#ff5f56" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); data.onDeleteNode(id); }} />
      </div>
    </div>
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
      {data.cols.map((c: string, i: number) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
           <span>{c.split(' ')[0]}</span>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
             {c.includes('(PK)') && <span style={{ color: '#ffbd2e', fontSize: '0.65rem' }}>PK</span>}
             <Trash2 size={10} color="#ff5f56" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); data.onDeleteCol(id, i); }} />
           </div>
        </div>
      ))}
    </div>
  </div>
);

const FactNode = ({ id, data, selected }: any) => (
  <div style={{ width: '260px', background: 'var(--color-black)', border: selected ? '2px solid var(--color-green)' : '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(134,188,37,0.1)', borderBottom: '1px solid rgba(134,188,37,0.2)' }}>
      <span style={{ fontWeight: 600, color: 'var(--color-green)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
        {data.label} 
        <Edit2 size={12} style={{cursor: 'pointer'}} onClick={(e) => { e.stopPropagation(); data.onEditLabel(id, data.label); }} />
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '0.65rem', background: 'rgba(134,188,37,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-green)' }}>FACT</span>
        <Trash2 size={12} color="#ff5f56" style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); data.onDeleteNode(id); }} />
      </div>
    </div>
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white)' }}>
      {data.cols.map((c: string, i: number) => {
        const parts = c.split(' ');
        const isFK = parts[1] === '(FK)';
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span>{parts[0]}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isFK ? <span style={{ color: '#ffbd2e' }}>FK</span> : <span style={{ color: 'var(--color-white-muted)' }}>{parts[1]?.replace('(', '')?.replace(')', '')}</span>}
              <Trash2 size={10} color="#ff5f56" style={{ cursor: 'pointer', opacity: 0.5 }} onClick={(e) => { e.stopPropagation(); data.onDeleteCol(id, i); }} />
            </div>
          </div>
        )
      })}
    </div>
  </div>
);

const nodeTypes = { dimNode: DimNode, factNode: FactNode };

export default function ReviewPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('visual');

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([{role: 'assistant', content: 'You can edit visually, or ask me to modify the schema (e.g. "Rename dim_store to dim_location")'}]);
  const [chatLoading, setChatLoading] = useState(false);

  // Sync methods for custom nodes
  const bindNodeMethods = useCallback((n: any[]) => {
    return n.map(node => ({
      ...node,
      data: {
        ...node.data,
        onDeleteNode,
        onEditLabel,
        onDeleteCol
      }
    }));
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.stateData || '{}');
          
          if (parsed.schema) {
            setNodes(bindNodeMethods(parsed.schema.nodes));
            setEdges(parsed.schema.edges);
            setLoading(false);
          } else {
            const genRes = await fetch(`/api/projects/${projectId}/schema/generate`, { method: 'POST' });
            if (genRes.ok) {
              const genData = await genRes.json();
              setNodes(bindNodeMethods(genData.nodes));
              setEdges(genData.edges);
            }
            setLoading(false);
          }
        }
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    }
    loadData();
  }, [projectId, bindNodeMethods]);

  const saveSchema = async (updatedNodes: any, updatedEdges: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const parsed = JSON.parse(data.stateData || '{}');
      
      // Clean up functions before saving
      const cleanNodes = updatedNodes.map((n: any) => {
        const { onDeleteNode, onEditLabel, onDeleteCol, ...cleanData } = n.data;
        return { ...n, data: cleanData };
      });

      parsed.schema = { nodes: cleanNodes, edges: updatedEdges };
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'review',
          stateData: JSON.stringify(parsed)
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const onConnect = useCallback((params: any) => {
    setEdges((eds) => {
        const newEdges = addEdge({ ...params, animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } }, eds);
        saveSchema(nodes, newEdges);
        return newEdges;
    });
  }, [nodes]);

  const onNodeClick = (event: any, node: any) => {
    setSelectedTable(node);
  };

  const onDeleteNode = (id: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    setNodes(nds => {
      const updated = nds.filter(n => n.id !== id);
      setEdges(eds => {
        const upEdges = eds.filter(e => e.source !== id && e.target !== id);
        saveSchema(updated, upEdges);
        return upEdges;
      });
      if (selectedTable?.id === id) setSelectedTable(null);
      return updated;
    });
  };

  const onEditLabel = (id: string, oldLabel: string) => {
    const newLabel = prompt('Enter new table name:', oldLabel);
    if (!newLabel || newLabel === oldLabel) return;

    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === id) {
          return { ...n, data: { ...n.data, label: newLabel } };
        }
        return n;
      });
      saveSchema(updated, edges);
      return updated;
    });
  };

  const onDeleteCol = (id: string, colIndex: number) => {
    if (!confirm('Delete this column?')) return;
    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === id) {
          const newCols = [...n.data.cols];
          newCols.splice(colIndex, 1);
          return { ...n, data: { ...n.data, cols: newCols } };
        }
        return n;
      });
      // Also update selected table context
      if (selectedTable?.id === id) {
        setSelectedTable(updated.find(n => n.id === id));
      }
      saveSchema(updated, edges);
      return updated;
    });
  };

  const addCustomTable = () => {
    const tableName = prompt('Enter table name (e.g. dim_custom or fact_custom):', 'dim_custom');
    if (!tableName) return;
    
    const isFact = tableName.startsWith('fact');
    const newNode = {
      id: tableName,
      type: isFact ? 'factNode' : 'dimNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: tableName,
        cols: [`${tableName.replace('dim_', '').replace('fact_', '')}_id (PK)`]
      }
    };

    setNodes(nds => {
      const updated = [...nds, bindNodeMethods([newNode])[0]];
      saveSchema(updated, edges);
      return updated;
    });
  };

  const addColumnToSelected = () => {
    if (!selectedTable) return;
    const colName = prompt('Enter column definition (e.g. "email (VARCHAR)" or "amount (DECIMAL)"):', 'new_column (VARCHAR)');
    if (!colName) return;

    setNodes(nds => {
      const updated = nds.map(n => {
        if (n.id === selectedTable.id) {
          return { ...n, data: { ...n.data, cols: [...n.data.cols, colName] } };
        }
        return n;
      });
      setSelectedTable(updated.find(n => n.id === selectedTable.id));
      saveSchema(updated, edges);
      return updated;
    });
  };

  const handleChatSend = async () => {
      if (!chatInput.trim()) return;
      
      const newLog = [...chatLog, { role: 'user', content: chatInput }];
      setChatLog(newLog);
      setChatInput('');
      setChatLoading(true);
      
      try {
          const res = await fetch(`/api/projects/${projectId}/schema/chat`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ message: chatInput })
          });
          if (res.ok) {
              const data = await res.json();
              setChatLog([...newLog, { role: 'assistant', content: data.response }]);
              if (data.schema) {
                  setNodes(bindNodeMethods(data.schema.nodes));
                  setEdges(data.schema.edges);
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setChatLoading(false);
      }
  };

  const handleProceed = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const completedSteps = JSON.parse(data.completedSteps || '[]');
      if (!completedSteps.includes('review')) completedSteps.push('review');
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'export',
          completedSteps
        })
      });
      router.push(`/wizard/${projectId}/export`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/export`);
    }
  };

  if (loading) {
      return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
           <Loader2 size={40} color="var(--color-green)" className="spin-icon" />
           <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)' }}>Architecting target ERD schema...</div>
           <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
        </div>
      );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className="heading-font" style={{ fontSize: '1.25rem' }}>Schema Editor Workspace</h1>
          <div style={{ display: 'flex', background: 'var(--color-black-light)', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('visual')} style={{ background: viewMode === 'visual' ? 'var(--color-green)' : 'transparent', padding: '6px 12px', border: 'none', borderRight: '1px solid var(--color-border)', color: viewMode === 'visual' ? '#000' : 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: viewMode === 'visual' ? 600 : 400 }}>Visual ERD</button>
            <button onClick={() => setViewMode('yaml')} style={{ background: viewMode === 'yaml' ? 'var(--color-green)' : 'transparent', padding: '6px 12px', border: 'none', color: viewMode === 'yaml' ? '#000' : 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: viewMode === 'yaml' ? 600 : 400 }}>YAML Override</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={12} className="spin-icon" /> Saving...</span>}
          <button onClick={addCustomTable} className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <Plus size={14}/> Add Custom Table
          </button>
          <button onClick={handleProceed} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Approve & Export <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Canvas Area / YAML View */}
        <div style={{ flex: 1, position: 'relative', background: '#080808', borderRight: '1px solid var(--color-border)' }}>
            {viewMode === 'visual' ? (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onPaneClick={() => setSelectedTable(null)}
                    nodeTypes={nodeTypes}
                    fitView
                    className="dark"
                >
                    <Background color="var(--color-border)" gap={40} size={1} />
                    <Controls style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
                </ReactFlow>
            ) : (
                <div style={{ padding: '32px', height: '100%', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--color-green)' }}>
                    <pre>
{`version: 2

models:
${nodes.map((n: any) => `
  - name: ${n.data.label || n.id}
    description: "Auto-generated model for ${n.data.label || n.id}"
    columns:
${n.data.cols.map((c: string) => `      - name: ${c.split(' ')[0]}
        description: "${c.includes('(PK)') ? 'Primary Key' : c.includes('(FK)') ? 'Foreign Key' : 'Standard column'}"`).join('\n')}
`).join('')}
`}
                    </pre>
                </div>
            )}
        </div>

        {/* Right Panel - Context & AI Chat */}
        <div style={{ width: '350px', display: 'flex', flexDirection: 'column', background: 'var(--color-black)', zIndex: 10 }}>
          
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Inspector & AI Agent</span>
          </div>

          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-black-light)' }}>
             <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span>Selected Table</span>
                {selectedTable && (
                  <button onClick={addColumnToSelected} style={{ background: 'transparent', border: 'none', color: 'var(--color-green)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Plus size={12} /> Add Col
                  </button>
                )}
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1rem', fontWeight: 600, color: selectedTable?.type === 'factNode' ? 'var(--color-green)' : (selectedTable ? 'var(--color-white)' : 'var(--color-white-muted)'), display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
                    <Database size={16} /> {selectedTable?.data?.label || 'None (Click a node)'}
                 </div>
             </div>
             {selectedTable && (
                 <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     {selectedTable.data.cols.map((col: string, i: number) => (
                         <div key={i} style={{ fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', padding: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                             <span>{col.split(' ')[0]}</span>
                             <span style={{ color: 'var(--color-white-muted)' }}>{col.split(' ').slice(1).join(' ')}</span>
                         </div>
                     ))}
                 </div>
             )}
          </div>

          {/* AI Chat Log */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {chatLog.map((msg, i) => (
                 <div key={i} style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: msg.role === 'assistant' ? 'var(--color-green)' : 'var(--color-border)', color: msg.role === 'assistant' ? '#000' : 'var(--color-white)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         {msg.role === 'assistant' ? <Bot size={14} /> : <span style={{ fontSize: '9px', fontWeight: 600 }}>USR</span>}
                     </div>
                     <div style={{ fontSize: '0.875rem', lineHeight: 1.5, color: msg.role === 'assistant' ? 'var(--color-white-muted)' : 'var(--color-white)', paddingTop: '2px' }}>
                         {msg.role === 'assistant' ? (
                           <div dangerouslySetInnerHTML={{ __html: renderAIResponse(msg.content) }} />
                         ) : (
                           msg.content
                         )}
                     </div>
                 </div>
             ))}
             {chatLoading && (
                 <div style={{ display: 'flex', gap: '12px' }}>
                     <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--color-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                         <Bot size={14} />
                     </div>
                     <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)', paddingTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Loader2 size={12} className="spin-icon" /> Updating Schema...
                     </div>
                 </div>
             )}
          </div>
          
          {/* AI Chat Input */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)' }}>
             <div style={{ display: 'flex', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '8px 12px' }}>
                 <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !chatLoading && handleChatSend()}
                    disabled={chatLoading}
                    placeholder='e.g. "Rename dim_store to dim_location"' 
                    style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.8125rem', outline: 'none' }}
                 />
                 <button onClick={handleChatSend} disabled={chatLoading || !chatInput.trim()} style={{ background: 'transparent', border: 'none', color: chatLoading || !chatInput.trim() ? 'var(--color-white-muted)' : 'var(--color-green)', cursor: 'pointer' }}>
                     <Send size={16} />
                 </button>
             </div>
          </div>

        </div>

      </div>
    </div>
  );
}
