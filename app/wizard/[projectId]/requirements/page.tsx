'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, Bot, Target, Send, UploadCloud, FileText, 
  CheckCircle2, Loader2, Layers, ListFilter, 
  Info, Hash, Database,
  Settings2, Trash2, Edit3, History, X, Plus
} from 'lucide-react';
import { renderAIResponse } from '@/lib/markdown';
import { useWizard } from '@/components/WizardContext';

interface BankedRequirement {
  id: string;
  name: string;
  description: string;
  type: 'process' | 'dimension' | 'kpi' | 'rule';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Finalized';
  logic?: string;
}

export default function RequirementsPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  const { markStepComplete } = useWizard();
  
  // -- State --
  const [messages, setMessages] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<BankedRequirement[]>([]);
  const [selectedReqId, setSelectedReqId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'process' | 'dimension' | 'kpi' | 'rule'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<BankedRequirement | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // -- Data Loading --
  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.stateData || '{}');
          
          // Load Chat
          if (parsed.chatHistory && parsed.chatHistory.length > 0) {
            setMessages(parsed.chatHistory);
          } else {
            setMessages([{ 
              role: 'assistant', 
              content: 'I am your **Business Analyst Agent**. My goal is to help you extract and structure requirements from your context materials. Do you have any dashboard mockups, reporting specs, or meeting transcripts I can analyze?' 
            }]);
          }
          
          // Load Banked Requirements (or derive from old KPIs if migration needed)
          if (parsed.bankedRequirements) {
            setRequirements(parsed.bankedRequirements);
          } else if (parsed.kpis) {
            // Migration: Convert old KPIs to banked requirements
            const migrated = parsed.kpis.map((k: any, i: number) => ({
              id: `kpi-${i}`,
              name: k.name,
              description: k.description || 'Auto-extracted KPI',
              type: 'kpi',
              priority: 'High',
              status: 'Draft',
              logic: k.formula
            }));
            setRequirements(migrated);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadState();
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // -- Handlers --
  const sendMessage = async (messageText: string, isDoc: boolean = false, imagePayload?: { data: string; mediaType: string; name: string }) => {
    if (!messageText.trim() && !imagePayload) return;
    
    const displayContent = imagePayload
      ? `[Uploaded Image: ${imagePayload.name}] ${messageText}`.trim()
      : messageText;

    setMessages(prev => [...prev, { role: 'user', content: displayContent, isImage: !!imagePayload, imageName: imagePayload?.name }]);
    setInput('');
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          isDocument: isDoc,
          ...(imagePayload ? {
            imageData: imagePayload.data,
            imageMediaType: imagePayload.mediaType,
            imageName: imagePayload.name,
          } : {})
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.chatHistory);
        
        // If the AI returned new banked requirements, update local state
        if (data.bankedRequirements) {
          setRequirements(data.bankedRequirements);
        } else if (data.kpis) {
          // Fallback if prompt hasn't been updated yet
          const updated = data.kpis.map((k: any, i: number) => ({
            id: `kpi-${Date.now()}-${i}`,
            name: k.name,
            description: k.description,
            type: 'kpi',
            priority: 'High',
            status: 'Draft',
            logic: k.formula
          }));
          setRequirements(prev => {
            const existingNames = new Set(prev.map(p => p.name));
            const fresh = updated.filter((u: any) => !existingNames.has(u.name));
            return [...prev, ...fresh];
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input, false);
  };

  const handleFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    if (isImage) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        // dataUrl = "data:image/png;base64,XXXX..."
        const [header, base64Data] = dataUrl.split(',');
        const mediaType = header.replace('data:', '').replace(';base64', '');
        sendMessage('', false, { data: base64Data, mediaType, name: file.name });
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const truncatedText = text.length > 20000 ? text.substring(0, 20000) + '... [Truncated]' : text;
        sendMessage(`[Uploaded Document: ${file.name}]\n\n${truncatedText}`, true);
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id));
    if (selectedReqId === id) setSelectedReqId(null);
    setIsEditing(false);
    setEditDraft(null);
  };

  const handleToggleFinalize = (id: string) => {
    setRequirements(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'Finalized' ? 'Draft' : 'Finalized' } : r
    ));
  };

  const handleStartEdit = (req: BankedRequirement) => {
    setEditDraft({ ...req });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditDraft(null);
  };

  const handleSaveEdit = () => {
    if (!editDraft) return;
    setRequirements(prev => prev.map(r => r.id === editDraft.id ? { ...editDraft } : r));
    setIsEditing(false);
    setEditDraft(null);
  };

  const handleAddRequirement = () => {
    const newReq: BankedRequirement = {
      id: `req-${Date.now()}`,
      name: 'New Requirement',
      description: '',
      type: 'process',
      priority: 'Medium',
      status: 'Draft',
      logic: '',
    };
    setRequirements(prev => [...prev, newReq]);
    setSelectedReqId(newReq.id);
    setEditDraft({ ...newReq });
    setIsEditing(true);
  };

  const handleProceedClick = () => {
    setShowReviewModal(true);
  };

  const confirmHandoff = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const parsed = JSON.parse(data.stateData || '{}');
      const completedSteps = JSON.parse(data.completedSteps || '[]');
      if (!completedSteps.includes('requirements')) completedSteps.push('requirements');
      
      parsed.bankedRequirements = requirements;
      parsed.requirementsBankedAt = Date.now();
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'bus-matrix',
          completedSteps,
          stateData: JSON.stringify(parsed)
        })
      });
      markStepComplete('requirements');
      router.push(`/wizard/${projectId}/bus-matrix`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/bus-matrix`);
    } finally {
      setIsSaving(false);
    }
  };

  // -- UI Helpers --
  const filteredRequirements = useMemo(() => {
    if (activeTab === 'all') return requirements;
    return requirements.filter(r => r.type === activeTab);
  }, [requirements, activeTab]);

  const selectedReq = useMemo(() => 
    requirements.find(r => r.id === selectedReqId), 
  [requirements, selectedReqId]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#050505', color: 'var(--color-white)' }}>
      
      {/* Workspace Header */}
      <header style={{ height: '60px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#080808' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={18} color="var(--color-green)" />
          <h1 className="heading-font" style={{ fontSize: '1rem', fontWeight: 600 }}>Requirements Workspace</h1>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px', color: 'var(--color-white-muted)' }}>Business Analyst Mode</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleProceedClick} className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.8125rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Proceed to Handoff <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* PANE 1: Requirements Hierarchy (Left) */}
        <aside style={{ width: '300px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: '#050505' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <ListFilter size={14} color="var(--color-white-muted)" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', flex: 1 }}>Hierarchy</span>
              <button
                onClick={handleAddRequirement}
                title="Add requirement manually"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem' }}
              >
                <Plus size={10} /> Add
              </button>
            </div>
            
            {/* Category Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', background: 'var(--color-black-light)', padding: '2px', borderRadius: '6px' }}>
              {(['all', 'process', 'dimension', 'kpi', 'rule'] as const).map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '6px 0', fontSize: '0.65rem', border: 'none', borderRadius: '4px',
                    background: activeTab === tab ? '#1a1a1a' : 'transparent',
                    color: activeTab === tab ? 'var(--color-white)' : 'var(--color-white-muted)',
                    cursor: 'pointer', textTransform: 'capitalize'
                  }}
                >
                  {tab === 'all' ? 'All' : tab.charAt(0).toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredRequirements.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--color-white-muted)', fontSize: '0.75rem' }}>
                No requirements banked yet. Upload context or chat with the BA Agent.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {filteredRequirements.map(req => (
                  <button
                    key={req.id}
                    onClick={() => setSelectedReqId(req.id)}
                    style={{
                      width: '100%', padding: '10px 12px', border: 'none', borderRadius: '6px',
                      background: selectedReqId === req.id ? 'rgba(134,188,37,0.1)' : 'transparent',
                      textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '10px',
                      transition: 'all 0.2s ease', borderLeft: selectedReqId === req.id ? '2px solid var(--color-green)' : '2px solid transparent'
                    }}
                  >
                    <div style={{ marginTop: '2px' }}>
                      {req.type === 'process' && <Database size={14} color="#00b4ff" />}
                      {req.type === 'dimension' && <Layers size={14} color="#c084fc" />}
                      {req.type === 'kpi' && <Target size={14} color="var(--color-green)" />}
                      {req.type === 'rule' && <Settings2 size={14} color="#ffbd2e" />}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: selectedReqId === req.id ? 'var(--color-white)' : 'var(--color-white-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {req.name}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>{req.priority} • {req.status}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* PANE 2: Main Explorer / Chat (Center) */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a', position: 'relative' }}>
          
          {/* Context Banner */}
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-white-muted)', fontSize: '0.75rem' }}>
              <Bot size={14} /> 
              <span>Business Analyst Agent is active</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp" />
              <button onClick={handleFileUpload} disabled={isLoading} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }} title="Upload documents or images (.txt, .md, .csv, .json, .png, .jpg, .gif, .webp)">
                <UploadCloud size={14} /> Upload Context
              </button>
            </div>
          </div>

          {/* Messages or Detail View */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', alignSelf: 'stretch' }}>
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '6px', 
                  background: msg.role === 'assistant' ? 'var(--color-green)' : '#1a1a1a',
                  color: msg.role === 'assistant' ? '#000' : 'var(--color-white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {msg.role === 'assistant' ? <Bot size={18} /> : <span style={{ fontSize: '10px', fontWeight: 800 }}>USR</span>}
                </div>
                
                <div style={{ flex: 1, color: msg.content.startsWith('[Uploaded') ? 'var(--color-green)' : 'var(--color-white)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderAIResponse(msg.content) }} />
                  ) : msg.isImage ? (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)', fontSize: '0.8125rem', marginBottom: '8px' }}>
                        <UploadCloud size={14} /> {msg.imageName || 'Image uploaded'}
                      </div>
                      {msg.content && msg.content.replace(`[Uploaded Image: ${msg.imageName}]`, '').trim() && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-white)' }}>
                          {msg.content.replace(`[Uploaded Image: ${msg.imageName}]`, '').trim()}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '16px', alignSelf: 'stretch' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--color-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={18} />
                </div>
                <div style={{ paddingTop: '6px', color: 'var(--color-white-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="spin-icon" /> Analyst is parsing context...
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', background: 'var(--color-black)', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading}
                placeholder="Talk to the BA Agent or describe a business requirement..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.9375rem', outline: 'none' }}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  background: 'var(--color-white)', color: 'var(--color-black)', border: 'none', borderRadius: '4px', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 600, opacity: (isLoading || !input.trim()) ? 0.5 : 1
                }}
              >
                Send <Send size={14} />
              </button>
            </div>
          </div>
        </main>

        {/* PANE 3: Logic Explorer / Detail (Right) */}
        <aside style={{ width: '400px', background: '#080808', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} color="var(--color-white-muted)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Logic Explorer</span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {!selectedReq ? (
              <div style={{ height: '100%', display: 'flex', flexWrap: 'wrap', alignContent: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Info size={24} color="rgba(255,255,255,0.1)" />
                </div>
                <div style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem', lineHeight: 1.6 }}>
                  Select a banked requirement from the hierarchy to view and edit its logic.
                </div>
              </div>
            ) : isEditing && editDraft ? (
              /* ── EDIT MODE ── */
              <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-green)' }}>Editing Requirement</span>
                  <button onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><X size={16} /></button>
                </div>

                {/* Name */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Name</div>
                  <input
                    value={editDraft.name}
                    onChange={e => setEditDraft(d => d ? { ...d, name: e.target.value } : d)}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.9rem', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Type & Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Type</div>
                    <select
                      value={editDraft.type}
                      onChange={e => setEditDraft(d => d ? { ...d, type: e.target.value as BankedRequirement['type'] } : d)}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', padding: '8px 10px', outline: 'none' }}
                    >
                      <option value="process">Process</option>
                      <option value="dimension">Dimension</option>
                      <option value="kpi">KPI</option>
                      <option value="rule">Rule</option>
                    </select>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Priority</div>
                    <select
                      value={editDraft.priority}
                      onChange={e => setEditDraft(d => d ? { ...d, priority: e.target.value as BankedRequirement['priority'] } : d)}
                      style={{ width: '100%', background: '#1a1a1a', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', padding: '8px 10px', outline: 'none' }}
                    >
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Description</div>
                  <textarea
                    value={editDraft.description}
                    onChange={e => setEditDraft(d => d ? { ...d, description: e.target.value } : d)}
                    rows={3}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
                  />
                </div>

                {/* Logic */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={12} /> Technical Logic / Formula
                  </div>
                  <textarea
                    value={editDraft.logic || ''}
                    onChange={e => setEditDraft(d => d ? { ...d, logic: e.target.value } : d)}
                    rows={4}
                    placeholder="e.g. SUM(order_total) WHERE status = 'complete'"
                    style={{ width: '100%', background: '#000', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-green)', fontSize: '0.8125rem', fontFamily: 'monospace', padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                  <button onClick={handleCancelEdit} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={handleSaveEdit} style={{ flex: 1, padding: '10px', background: 'var(--color-white)', border: 'none', borderRadius: '6px', color: 'var(--color-black)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              /* ── VIEW MODE ── */
              <div className="animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.65rem', background: 'var(--color-green)', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>{selectedReq.type.toUpperCase()}</span>
                      <span style={{ fontSize: '0.65rem', background: '#1a1a1a', color: 'var(--color-white-muted)', padding: '2px 6px', borderRadius: '4px' }}>{selectedReq.priority} Priority</span>
                    </div>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{selectedReq.name}</h2>
                  </div>
                  <button onClick={() => handleStartEdit(selectedReq)} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '4px' }} title="Edit requirement">
                    <Edit3 size={16} />
                  </button>
                </div>

                {/* Description */}
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={12} /> Description
                  </div>
                  <div style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {selectedReq.description}
                  </div>
                </div>

                {/* Logic / Formula */}
                {selectedReq.logic && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Hash size={12} /> Technical Logic / Formula
                    </div>
                    <div style={{ background: '#000', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--color-green)' }}>expression.sql</span>
                        <button onClick={() => handleStartEdit(selectedReq)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-white-muted)', padding: 0 }}>
                          <Edit3 size={12} />
                        </button>
                      </div>
                      <pre style={{ margin: 0, padding: '16px', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white)', overflowX: 'auto' }}>
                        {selectedReq.logic}
                      </pre>
                    </div>
                  </div>
                )}

                {/* Metadata */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                   <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-white-muted)', marginBottom: '4px' }}>Status</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CheckCircle2 size={12} /> {selectedReq.status}
                      </div>
                   </div>
                   <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--color-white-muted)', marginBottom: '4px' }}>Last Updated</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <History size={12} /> Just now
                      </div>
                   </div>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                   <button onClick={() => handleDeleteRequirement(selectedReq.id)} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                     <Trash2 size={14} color="#ff5f56" /> Delete
                   </button>
                   <button onClick={() => handleToggleFinalize(selectedReq.id)} style={{ flex: 1, padding: '10px', background: selectedReq.status === 'Finalized' ? 'rgba(255,255,255,0.1)' : 'var(--color-white)', border: 'none', borderRadius: '6px', color: selectedReq.status === 'Finalized' ? 'var(--color-white)' : 'var(--color-black)', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>
                     {selectedReq.status === 'Finalized' ? 'Mark as Draft' : 'Finalize'}
                   </button>
                </div>

              </div>
            )}
          </div>
        </aside>

      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ background: '#0a0a0a', border: '1px solid var(--color-border)', borderRadius: '12px', width: '600px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Banked Requirements Summary</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Review the facts and dimensions extracted before generating the Bus Matrix.</div>
              </div>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{requirements.filter(r => r.type === 'process').length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Business Processes</div>
                 </div>
                 <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-white)' }}>{requirements.filter(r => r.type === 'dimension').length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Dimensions Extracted</div>
                 </div>
              </div>
              
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>All Extracted Items</h3>
              {requirements.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', textAlign: 'center', padding: '16px' }}>No requirements have been extracted.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {requirements.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{req.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginTop: '4px' }}>{req.type.toUpperCase()} • {req.status}</div>
                      </div>
                      <div style={{ padding: '4px 8px', background: req.priority === 'High' ? 'rgba(255,95,86,0.1)' : 'rgba(255,255,255,0.05)', color: req.priority === 'High' ? '#ff5f56' : 'var(--color-white-muted)', fontSize: '0.65rem', borderRadius: '4px' }}>
                        {req.priority}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', background: '#050505', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowReviewModal(false)} disabled={isSaving} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmHandoff} disabled={isSaving} className="btn-primary" style={{ padding: '8px 24px', border: 'none', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                {isSaving ? <><Loader2 size={16} className="spin-icon" /> Banking...</> : 'Confirm & Generate Matrix'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}