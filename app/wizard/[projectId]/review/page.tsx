'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Plus, Database, Settings2, Trash2, Edit2, Loader2, Bot, Send, Image as ImageIcon, X, Table2, LayoutGrid } from 'lucide-react';
import { MarkerType } from '@xyflow/react';
import { renderAIResponse } from '@/lib/markdown';
import { toPng } from 'html-to-image';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState, addEdge, Node, type Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useWizard } from '@/components/WizardContext';

const DimNode = ({ id, data, selected }: any) => (
  <div style={{ width: '220px', background: 'var(--color-black)', border: selected ? '2px solid var(--color-white)' : '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <Handle type="source" id="left" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" id="right" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="source" id="top" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" id="bottom" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="target" id="target-left" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="target" id="target-right" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="target" id="target-top" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" id="target-bottom" position={Position.Bottom} style={{ opacity: 0 }} />
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
    <Handle type="target" id="left" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="target" id="right" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="target" id="top" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" id="bottom" position={Position.Bottom} style={{ opacity: 0 }} />
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
  const { markStepComplete } = useWizard();

  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState('visual');
  // Debounce timer for auto-saving after node drag
  const positionSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodesRef = useRef<any[]>([]);
  const edgesRef = useRef<any[]>([]);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [chatLog, setChatLog] = useState<{role: string, content: string}[]>([{role: 'assistant', content: 'You can edit visually, or ask me to modify the schema (e.g. "Rename dim_store to dim_location")'}]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatThinkingPhase, setChatThinkingPhase] = useState('Analysing request...');
  const [isStale, setIsStale] = useState(false);
  
  // Add Table Modal State
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [newTableType, setNewTableType] = useState<'dim' | 'fact'>('dim');
  const [techConfig, setTechConfig] = useState<{ factPrefix: string; dimPrefix: string; keySuffix: string }>({ factPrefix: 'fct_', dimPrefix: 'dim_', keySuffix: '_key' });

  // Keep refs in sync for debounced position save
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  // Wrap onNodesChange to auto-save positions after drag ends (debounced 1.5s)
  const handleNodesChange = useCallback((changes: any[]) => {
    onNodesChange(changes);
    const hasPositionChange = changes.some((c: any) => c.type === 'position' && c.dragging === false);
    if (hasPositionChange) {
      if (positionSaveTimer.current) clearTimeout(positionSaveTimer.current);
      positionSaveTimer.current = setTimeout(() => {
        saveSchema(nodesRef.current, edgesRef.current);
      }, 1500);
    }
  }, [onNodesChange]);

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

  const layoutStarSchema = useCallback((nodesToLayout: any[], currentEdges: any[]) => {
    const factNodes = nodesToLayout.filter((n: any) => n.type === 'factNode');
    const dimNodes = nodesToLayout.filter((n: any) => n.type === 'dimNode');

    // ── Estimate node heights based on column count ─────────────────────────
    const NODE_HEADER = 48;
    const ROW_HEIGHT = 33;
    const nodeHeight = (n: any) => NODE_HEADER + (n.data?.cols?.length || 4) * ROW_HEIGHT;

    // ── Classify dimensions: shared (connected to 2+ facts) vs specific ────
    const dimFactCount: Record<string, Set<string>> = {};
    const dimToDimEdges: any[] = [];
    dimNodes.forEach((d: any) => { dimFactCount[d.id] = new Set(); });

    currentEdges.forEach((e: any) => {
      const src = nodesToLayout.find((n: any) => n.id === e.source);
      const tgt = nodesToLayout.find((n: any) => n.id === e.target);
      if (!src || !tgt) return;
      // Dim → Fact edge (in either direction due to how edges are built)
      if (src.type === 'dimNode' && tgt.type === 'factNode') {
        dimFactCount[src.id]?.add(tgt.id);
      } else if (src.type === 'factNode' && tgt.type === 'dimNode') {
        dimFactCount[tgt.id]?.add(src.id);
      }
      // Dim → Dim edge (e.g. geography → customers)
      if (src.type === 'dimNode' && tgt.type === 'dimNode') {
        dimToDimEdges.push(e);
      }
    });

    // A dimension is "conformed" (left column) only if it connects to ALL fact tables.
    // For a single-fact schema every dim goes right (simple star, no left column needed).
    const isConformed = (d: any) =>
      factNodes.length > 1 && (dimFactCount[d.id]?.size || 0) === factNodes.length;
    const sharedDims = dimNodes.filter((d: any) => isConformed(d));
    const specificDims = dimNodes.filter((d: any) => !isConformed(d));

    // ── Layout constants ────────────────────────────────────────────────────
    const FACT_X = 700;           // center column for facts
    const SHARED_X = 100;        // left column for shared dims
    const SPECIFIC_X = 1300;     // right column for specific dims
    const VERT_PAD = 40;         // vertical padding between nodes

    // ── Stack facts vertically in center ────────────────────────────────────
    let factY = 100;
    factNodes.forEach((fact: any) => {
      fact.position = { x: FACT_X, y: factY };
      factY += nodeHeight(fact) + VERT_PAD + 120; // extra gap between facts for edge clearance
    });
    const totalFactHeight = factY - 100;

    // ── Stack shared dims vertically on the left, centered on fact column ───
    let sharedTotalHeight = sharedDims.reduce((h: number, d: any) => h + nodeHeight(d) + VERT_PAD, -VERT_PAD);
    let sharedY = 100 + (totalFactHeight - sharedTotalHeight) / 2;
    if (sharedY < 50) sharedY = 50;
    sharedDims.forEach((dim: any) => {
      dim.position = { x: SHARED_X, y: sharedY };
      sharedY += nodeHeight(dim) + VERT_PAD;
    });

    // ── Place specific dims on the right ────────────────────────────────────
    // Group them by which fact they connect to, then stack per-fact
    const factSpecificDims: Record<string, any[]> = {};
    factNodes.forEach((f: any) => { factSpecificDims[f.id] = []; });

    specificDims.forEach((dim: any) => {
      // Find which fact this dim connects to
      let assignedFact: string | null = null;
      for (const factId of Object.keys(factSpecificDims)) {
        if (dimFactCount[dim.id]?.has(factId)) { assignedFact = factId; break; }
      }
      // Dims connected to no fact (e.g. geography only linked via other dims)
      if (!assignedFact) {
        // Check if this dim connects to another dim that connects to a fact
        for (const dde of dimToDimEdges) {
          const otherId = dde.source === dim.id ? dde.target : (dde.target === dim.id ? dde.source : null);
          if (!otherId) continue;
          for (const factId of Object.keys(factSpecificDims)) {
            if (dimFactCount[otherId]?.has(factId)) { assignedFact = factId; break; }
          }
          if (assignedFact) break;
        }
      }
      if (assignedFact) {
        factSpecificDims[assignedFact].push(dim);
      } else {
        // Fallback: assign to first fact
        const firstFact = factNodes[0];
        if (firstFact) factSpecificDims[firstFact.id].push(dim);
      }
    });

    // Position specific dims aligned with their fact
    factNodes.forEach((fact: any) => {
      const dims = factSpecificDims[fact.id] || [];
      if (dims.length === 0) return;
      const groupHeight = dims.reduce((h: number, d: any) => h + nodeHeight(d) + VERT_PAD, -VERT_PAD);
      let startY = fact.position.y + nodeHeight(fact) / 2 - groupHeight / 2;
      dims.forEach((dim: any) => {
        dim.position = { x: SPECIFIC_X, y: startY };
        startY += nodeHeight(dim) + VERT_PAD;
      });
    });

    // ── Handle dims that connect to other dims (e.g. geography → customers/sellers) ──
    // If geography has no direct fact edge but connects to dims on the right, place it far right
    dimNodes.forEach((dim: any) => {
      if (!dim.position) {
        // Orphan dim — place below everything on the right
        dim.position = { x: SPECIFIC_X + 400, y: factY };
        factY += nodeHeight(dim) + VERT_PAD;
      }
    });

    // ── Assign edge handles based on relative positions ─────────────────────
    currentEdges.forEach((edge: any) => {
      const src = nodesToLayout.find((n: any) => n.id === edge.source);
      const tgt = nodesToLayout.find((n: any) => n.id === edge.target);
      if (src?.position && tgt?.position) {
        const srcIsLeft = tgt.position.x < src.position.x;
        // Source handle: always uses the source-type handles (left/right/top/bottom)
        edge.sourceHandle = srcIsLeft ? 'left' : 'right';
        // Target handle: factNodes use target handles (left/right), dimNodes use target-prefixed handles
        if (tgt.type === 'dimNode') {
          edge.targetHandle = srcIsLeft ? 'target-right' : 'target-left';
        } else {
          edge.targetHandle = srcIsLeft ? 'right' : 'left';
        }
      }
    });

    return [...nodesToLayout];
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.stateData || '{}');

          // Load technical config for naming conventions
          if (parsed.technicalConfig) {
            setTechConfig({
              factPrefix: parsed.technicalConfig.factPrefix ?? 'fct_',
              dimPrefix: parsed.technicalConfig.dimPrefix ?? 'dim_',
              keySuffix: parsed.technicalConfig.keySuffix ?? '_key',
            });
          }
          
          if (parsed.schema) {
            let loadedNodes = parsed.schema.nodes;
            // Ensure all edges have arrow markers
            const loadedEdges = (parsed.schema.edges || []).map((edge: any) => ({
              ...edge,
              markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
            }));
            if (loadedNodes.every((n: any) => !n.position || (n.position.x === 0 && n.position.y === 0))) {
                loadedNodes = layoutStarSchema(loadedNodes, loadedEdges);
            } else {
              // Nodes already positioned — still assign side handles on edges
              loadedEdges.forEach((edge: any) => {
                const src = loadedNodes.find((n: any) => n.id === edge.source);
                const tgt = loadedNodes.find((n: any) => n.id === edge.target);
                if (src?.position && tgt?.position) {
                  const srcIsLeft = tgt.position.x < src.position.x;
                  edge.sourceHandle = srcIsLeft ? 'left' : 'right';
                  if (tgt.type === 'dimNode') {
                    edge.targetHandle = srcIsLeft ? 'target-right' : 'target-left';
                  } else {
                    edge.targetHandle = srcIsLeft ? 'right' : 'left';
                  }
                }
              });
            }
            setNodes(bindNodeMethods(loadedNodes));
            setEdges(loadedEdges);
            // Check staleness: bus matrix updated after schema was generated
            const matrixAt = parsed.busMatrixGeneratedAt || 0;
            const schemaAt = parsed.schemaGeneratedAt || 0;
            if (matrixAt > schemaAt && schemaAt > 0) setIsStale(true);
            setLoading(false);
          } else {
            // Empty state
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
        const newEdges = addEdge({ 
          ...params, 
          animated: true, 
          style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 },
          label: '1:M',
          labelBgStyle: { fill: '#1a1a1a', color: '#fff' },
          labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 12 },
          markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20 }
        }, eds);
        saveSchema(nodes, newEdges);
        return newEdges;
    });
  }, [nodes]);

  const onEdgeClick = (event: React.MouseEvent, edge: any) => {
    event.stopPropagation();
    const newCard = prompt('Enter cardinality (e.g. 1:M, 1:1, M:M):', edge.label || '1:M');
    if (newCard !== null) {
      setEdges(eds => {
        const updated = eds.map(e => {
          if (e.id === edge.id) {
            return { ...e, label: newCard, labelBgStyle: { fill: '#1a1a1a', color: '#fff' }, labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 12 } };
          }
          return e;
        });
        saveSchema(nodes, updated);
        return updated;
      });
    }
  };

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
    setNewTableName('');
    setNewTableType('dim');
    setShowAddTableModal(true);
  };

  const confirmAddTable = () => {
    const rawName = newTableName.trim().toLowerCase().replace(/\s+/g, '_');
    if (!rawName) return;
    const prefix = newTableType === 'fact' ? techConfig.factPrefix : techConfig.dimPrefix;
    const tableName = rawName.startsWith(prefix) ? rawName : `${prefix}${rawName.replace(/^(fct_|fact_|dim_|d_|f_|FACT_|DIM_)/, '')}`;
    
    const newNode = {
      id: tableName,
      type: newTableType === 'fact' ? 'factNode' : 'dimNode',
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        label: tableName,
        cols: [`${rawName.replace(/^(fct_|fact_|dim_|d_|f_|FACT_|DIM_)/, '')}${techConfig.keySuffix} (PK)`]
      }
    };

    setNodes(nds => {
      const updated = [...nds, bindNodeMethods([newNode])[0]];
      saveSchema(updated, edges);
      return updated;
    });
    setShowAddTableModal(false);
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
      setChatThinkingPhase('Analysing request...');
      
      const phases = ['Reading current schema...', 'Applying modifications...', 'Validating referential integrity...', 'Rebuilding ERD layout...'];
      let phaseIdx = 0;
      const phaseTimer = setInterval(() => {
        phaseIdx = (phaseIdx + 1) % phases.length;
        setChatThinkingPhase(phases[phaseIdx]);
      }, 2500);
      
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
                  const laidOutNodes = layoutStarSchema(data.schema.nodes, data.schema.edges);
                  const boundNodes = bindNodeMethods(laidOutNodes);
                  setNodes(boundNodes);
                  setEdges(data.schema.edges);
                  // Persist the re-laid-out schema so positions survive refresh
                  saveSchema(boundNodes, data.schema.edges);
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          clearInterval(phaseTimer);
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
      markStepComplete('review');
      router.push(`/wizard/${projectId}/export`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/export`);
    }
  };

  const handleExportImage = () => {
    const element = document.querySelector('.react-flow') as HTMLElement;
    if (!element) return;
    toPng(element, { backgroundColor: '#080808' }).then(dataUrl => {
      const a = document.createElement('a');
      a.setAttribute('download', 'dimwiz_schema.png');
      a.setAttribute('href', dataUrl);
      a.click();
    }).catch(e => console.error("Export failed", e));
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
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className="heading-font" style={{ fontSize: '1.25rem' }}>Schema Editor Workspace</h1>
          <div style={{ display: 'flex', background: 'var(--color-black-light)', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button onClick={() => setViewMode('visual')} style={{ background: viewMode === 'visual' ? 'var(--color-green)' : 'transparent', padding: '6px 12px', border: 'none', borderRight: '1px solid var(--color-border)', color: viewMode === 'visual' ? '#000' : 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: viewMode === 'visual' ? 600 : 400 }}>Visual ERD</button>
            <button onClick={() => setViewMode('yaml')} style={{ background: viewMode === 'yaml' ? 'var(--color-green)' : 'transparent', padding: '6px 12px', border: 'none', color: viewMode === 'yaml' ? '#000' : 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: viewMode === 'yaml' ? 600 : 400 }}>YAML Override</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {saving && <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}><Loader2 size={12} className="spin-icon" /> Saving...</span>}
          <button onClick={handleExportImage} className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <ImageIcon size={14} /> Export PNG
          </button>
          <button onClick={async () => {
              setLoading(true);
              try {
                  const genRes = await fetch(`/api/projects/${projectId}/schema/generate`, { method: 'POST' });
                  if (genRes.ok) {
                      const genData = await genRes.json();
                      const laidOutNodes = layoutStarSchema(genData.nodes, genData.edges);
                      setNodes(bindNodeMethods(laidOutNodes));
                      setEdges(genData.edges);
                      const stRes = await fetch(`/api/projects/${projectId}/state`);
                      const stData = await stRes.json();
                      const stParsed = JSON.parse(stData.stateData || '{}');
                      stParsed.schemaGeneratedAt = Date.now();
                      await fetch(`/api/projects/${projectId}/state`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stateData: JSON.stringify(stParsed) }) });
                      setIsStale(false);
                  }
              } catch(e) { console.error(e) }
              setLoading(false);
          }} className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem', borderColor: 'var(--color-green)', color: 'var(--color-green)' }}>
             <Bot size={14} /> AI Generate
          </button>
          <button onClick={() => {
              const newNodes = layoutStarSchema(nodes, edges);
              setNodes([...newNodes]);
              saveSchema(newNodes, edges);
          }} className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             Re-layout
          </button>
          <button onClick={addCustomTable} className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <Plus size={14}/> Add Custom Table
          </button>
          <button onClick={handleProceed} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Approve & Export <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', flexDirection: 'column' }}>
        
        {/* Staleness warning */}
        {isStale && (
          <div style={{ padding: '10px 32px', background: 'rgba(255,189,46,0.08)', borderBottom: '1px solid rgba(255,189,46,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', color: '#ffbd2e', flexShrink: 0 }}>
            <span>⚠ The bus matrix has been updated since this schema was generated. Click <strong>AI Generate</strong> to refresh.</span>
            <button onClick={() => setIsStale(false)} style={{ background: 'transparent', border: 'none', color: '#ffbd2e', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>×</button>
          </div>
        )}

        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Canvas Area / YAML View */}
        <div style={{ flex: 1, position: 'relative', background: 'var(--bg-surface)', borderRight: '1px solid var(--color-border)' }}>
            {nodes.length === 0 ? (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', zIndex: 10, background: 'var(--bg-surface)' }}>
                    <div style={{ textAlign: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--color-white)' }}>No schema generated yet.</h2>
                        <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', maxWidth: '400px' }}>You can sketch a model manually, or complete Profiling & Requirements to auto-generate one.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <button onClick={addCustomTable} className="btn-secondary" style={{ padding: '10px 20px', borderRadius: '6px' }}>Start from Scratch</button>
                        <button onClick={async () => {
                            setLoading(true);
                            try {
                                const genRes = await fetch(`/api/projects/${projectId}/schema/generate`, { method: 'POST' });
                                if (genRes.ok) {
                                    const genData = await genRes.json();
                                    const laidOutNodes = layoutStarSchema(genData.nodes, genData.edges);
                                    setNodes(bindNodeMethods(laidOutNodes));
                                    setEdges(genData.edges);
                                    setIsStale(false);
                                }
                            } catch(e) { console.error(e) }
                            setLoading(false);
                        }} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '6px', background: 'var(--color-green)', color: '#000', border: 'none', fontWeight: 600 }}>Generate via AI</button>
                    </div>
                </div>
            ) : null}
            {viewMode === 'visual' ? (
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={handleNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
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
                     <div style={{ fontSize: '0.875rem', color: 'var(--color-white-muted)', paddingTop: '2px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <Loader2 size={12} className="spin-icon" />
                             <span style={{ transition: 'opacity 0.3s', fontWeight: 500 }}>{chatThinkingPhase}</span>
                         </div>
                         <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                           {[0,1,2].map(i => (
                             <div key={i} style={{
                               width: '5px', height: '5px', borderRadius: '50%', background: 'var(--color-green)',
                               animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`
                             }} />
                           ))}
                         </div>
                         <style>{`@keyframes pulse { 0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); } 40% { opacity: 1; transform: scale(1.2); } }`}</style>
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

      {/* Add Table Modal */}
      {showAddTableModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowAddTableModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '32px', width: '400px', maxWidth: '90vw' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 className="heading-font" style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-white)' }}>Add New Table</h3>
              <button onClick={() => setShowAddTableModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Table Type</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setNewTableType('dim')} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${newTableType === 'dim' ? 'var(--color-white)' : 'var(--color-border)'}`, background: newTableType === 'dim' ? 'rgba(255,255,255,0.08)' : 'transparent', color: 'var(--color-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                  <Table2 size={16} /> Dimension
                </button>
                <button onClick={() => setNewTableType('fact')} style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: `1px solid ${newTableType === 'fact' ? 'var(--color-green)' : 'var(--color-border)'}`, background: newTableType === 'fact' ? 'rgba(134,188,37,0.1)' : 'transparent', color: newTableType === 'fact' ? 'var(--color-green)' : 'var(--color-white)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                  <LayoutGrid size={16} /> Fact
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Table Name</label>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 12px' }}>
                <span style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', fontFamily: 'monospace', marginRight: '2px' }}>{newTableType === 'fact' ? 'fct_' : 'dim_'}</span>
                <input
                  type="text"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && newTableName.trim() && confirmAddTable()}
                  placeholder={newTableType === 'fact' ? 'order_items' : 'customer'}
                  autoFocus
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.875rem', fontFamily: 'monospace', padding: '10px 0', outline: 'none' }}
                />
              </div>
              {newTableName.trim() && (
                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--color-white-muted)', fontFamily: 'monospace' }}>
                  → {newTableType === 'fact' ? 'fct_' : 'dim_'}{newTableName.trim().toLowerCase().replace(/\s+/g, '_').replace(/^(fct_|fact_|dim_)/, '')}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowAddTableModal(false)} className="btn-secondary" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem' }}>Cancel</button>
              <button onClick={confirmAddTable} disabled={!newTableName.trim()} className="btn-primary" style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.8125rem', opacity: newTableName.trim() ? 1 : 0.5, border: 'none', cursor: newTableName.trim() ? 'pointer' : 'not-allowed' }}>
                <Plus size={14} /> Create Table
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
