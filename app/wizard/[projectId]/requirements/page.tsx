'use client';
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowRight, Bot, Target, Send, UploadCloud, FileText, 
  CheckCircle2, Loader2, Layers, ListFilter, Search,
  Info, Hash, Database, BookOpen, ChevronLeft, ChevronRight,
  Settings2, Trash2, Edit3, History, X, Plus, MessageSquare
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
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'process' | 'dimension' | 'kpi' | 'rule'>('all');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<BankedRequirement | null>(null);
  const [chatPanelOpen, setChatPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [thinkingPhase, setThinkingPhase] = useState('');
  const isInitialLoad = useRef(true);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Auto-seed: fire once when profile data is ready but no requirements have been extracted yet
  const autoSeedDone = useRef(false);
  const [pendingAutoSeed, setPendingAutoSeed] = useState(false);
  
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
            isInitialLoad.current = false;
          }
          
          // Load Banked Requirements (or derive from old KPIs if migration needed)
          if (parsed.bankedRequirements && parsed.bankedRequirements.length > 0) {
            setRequirements(parsed.bankedRequirements);
            isInitialLoad.current = false;
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
            isInitialLoad.current = false;
          } else if (parsed.profileResults && !autoSeedDone.current) {
            // No requirements yet, but profiling data exists — auto-seed from profiling
            setPendingAutoSeed(true);
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

  // -- Auto-seed from profiling data when no requirements exist yet --
  useEffect(() => {
    if (!pendingAutoSeed || autoSeedDone.current || isLoading) return;
    autoSeedDone.current = true;
    setPendingAutoSeed(false);
    sendMessage(
      'Please analyse the uploaded data profile and extract the initial set of requirements — identify all business processes (with grain), dimensions, KPIs, and any business rules you can infer from the data structure.',
      false,
      undefined,
      true
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAutoSeed, isLoading]);

  // -- Auto-save requirements to server (debounced 2s, skip on first load) --
  useEffect(() => {
    if (isInitialLoad.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (!res.ok) return;
        const data = await res.json();
        const parsed = JSON.parse(data.stateData || '{}');
        parsed.bankedRequirements = requirements;
        parsed.requirementsUpdatedAt = Date.now(); // signal bus matrix that requirements changed
        await fetch(`/api/projects/${projectId}/state`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: data.currentStep || 'requirements',
            completedSteps: JSON.parse(data.completedSteps || '[]'),
            stateData: JSON.stringify(parsed)
          })
        });
      } catch { /* silent — user will see on next load */ }
    }, 2000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [requirements, projectId]);

  // -- Handlers --
  const sendMessage = async (messageText: string, isDoc: boolean = false, imagePayload?: { data: string; mediaType: string; name: string }, forceExtract: boolean = false, displayLabel?: string) => {
    if (!messageText.trim() && !imagePayload) return;
    
    // What to show in chat: use the display label for file uploads, otherwise use the message text
    const localDisplay = displayLabel
      ? displayLabel
      : (imagePayload
          ? `[Uploaded Image: ${imagePayload.name}] ${messageText}`.trim()
          : messageText);

    setMessages(prev => [...prev, { role: 'user', content: localDisplay, isImage: !!imagePayload, imageName: imagePayload?.name }]);
    setInput('');
    setIsLoading(true);
    setThinkingPhase('Reading context...');
    
    // Rotate through thinking phases to show progress
    const phases = [
      'Reading context...',
      'Analyzing requirements...',
      'Extracting structured items...',
      'Validating output...',
    ];
    let phaseIdx = 0;
    const phaseTimer = setInterval(() => {
      phaseIdx = Math.min(phaseIdx + 1, phases.length - 1);
      setThinkingPhase(phases[phaseIdx]);
    }, 3000);
    
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          isDocument: isDoc,
          forceExtract: forceExtract || isDoc, // always extract on document upload
          ...(displayLabel ? { displayMessage: displayLabel } : {}),
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
        
        // Always sync requirements from server — the server merges extraction + modifications,
        // so data.bankedRequirements is always the authoritative current state.
        if (Array.isArray(data.bankedRequirements)) {
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
      } else {
        const errText = await res.text().catch(() => 'Unknown error');
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `**Something went wrong** processing your request.\n\nError: ${errText || res.statusText}\n\nThis can happen with very large documents. Try splitting your transcript into smaller sections and uploading them one at a time.`
        }]);
      }
    } catch (e: any) {
      console.error(e);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Connection error** — the request could not be completed.\n\nThis usually means the AI took too long to respond (large document). Try uploading a shorter section of the transcript.`
      }]);
    } finally {
      clearInterval(phaseTimer);
      setThinkingPhase('');
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    sendMessage(input, false, undefined, true);
  };

  const handleFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Images are sent individually (each needs its own vision message)
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const textFiles = files.filter(f => !f.type.startsWith('image/'));

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const [header, base64Data] = dataUrl.split(',');
        const mediaType = header.replace('data:', '').replace(';base64', '');
        sendMessage('', false, { data: base64Data, mediaType, name: file.name });
      };
      reader.readAsDataURL(file);
    });

    if (textFiles.length === 1) {
      // Single text file — send as before
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const truncatedText = text.length > 20000 ? text.substring(0, 20000) + '... [Truncated]' : text;
        sendMessage(
          `[Uploaded Document: ${textFiles[0].name}]\n\n${truncatedText}`,
          true,
          undefined,
          false,
          `[Uploaded Document: ${textFiles[0].name}]`
        );
      };
      reader.readAsText(textFiles[0]);
    } else if (textFiles.length > 1) {
      // Multiple text files — read all then send as one batched message so the agent has full context
      let completed = 0;
      const parts: string[] = new Array(textFiles.length);
      textFiles.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const text = event.target?.result as string;
          const truncated = text.length > 15000 ? text.substring(0, 15000) + '... [Truncated]' : text;
          parts[idx] = `--- File ${idx + 1}: ${file.name} ---\n${truncated}`;
          completed++;
          if (completed === textFiles.length) {
            sendMessage(
              `[Uploaded ${textFiles.length} Documents]\n\n${parts.join('\n\n')}`,
              true,
              undefined,
              false,
              `[Uploaded ${textFiles.length} Documents: ${textFiles.map(f => f.name).join(', ')}]`
            );
          }
        };
        reader.readAsText(file);
      });
    }

    e.target.value = '';
  };

  const handleDeleteRequirement = (id: string) => {
    setRequirements(prev => prev.filter(r => r.id !== id));
    setIsEditing(false);
    setEditDraft(null);
  };

  const handleToggleFinalize = (id: string) => {
    setRequirements(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'Finalized' ? 'Draft' : 'Finalized' } : r
    ));
  };

  const handleFinalizeAll = () => {
    setRequirements(prev => prev.map(r => ({ ...r, status: 'Finalized' as const })));
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
    setEditDraft({ ...newReq });
    setIsEditing(true);
  };

  const processCount = requirements.filter(r => r.type === 'process').length;

  const handleProceedClick = () => {
    if (processCount === 0) return; // guarded — button is disabled when no processes
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
    let filtered = activeTab === 'all' ? requirements : requirements.filter(r => r.type === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(r => 
        r.name.toLowerCase().includes(q) || 
        r.description.toLowerCase().includes(q) ||
        (r.logic && r.logic.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [requirements, activeTab, searchQuery]);

  // Which types to show in the BRD document (mirrors the active filter)
  const visibleTypes = useMemo(() =>
    activeTab === 'all'
      ? (['process', 'dimension', 'kpi', 'rule'] as const)
      : [activeTab] as ('process' | 'dimension' | 'kpi' | 'rule')[],
  [activeTab]);

  const typeConfig: Record<string, { label: string; letter: string; color: string; sectionNum: number }> = {
    process:   { label: 'Business Processes',          letter: 'P', color: '#00b4ff', sectionNum: 1 },
    dimension: { label: 'Dimensions',                  letter: 'D', color: '#c084fc', sectionNum: 2 },
    kpi:       { label: 'Key Performance Indicators',  letter: 'K', color: 'var(--color-green)', sectionNum: 3 },
    rule:      { label: 'Business Rules',              letter: 'R', color: '#ffbd2e', sectionNum: 4 },
  };

  const typeCounts = useMemo(() => ({
    all: requirements.length,
    process: requirements.filter(r => r.type === 'process').length,
    dimension: requirements.filter(r => r.type === 'dimension').length,
    kpi: requirements.filter(r => r.type === 'kpi').length,
    rule: requirements.filter(r => r.type === 'rule').length,
  }), [requirements]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--color-white)' }}>

      {/* ── Workspace Header ── */}
      <header style={{ height: '60px', padding: '0 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-nav)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BookOpen size={18} color="var(--color-green)" />
          <h1 className="heading-font" style={{ fontSize: '1rem', fontWeight: 600 }}>Requirements Workspace</h1>
          <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '12px', color: 'var(--color-white-muted)' }}>BRD Mode</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {requirements.some(r => r.status === 'Draft') && (
            <button
              onClick={handleFinalizeAll}
              title="Mark all requirements as Finalized"
              style={{ background: 'transparent', border: '1px solid rgba(40,200,64,0.3)', borderRadius: '6px', padding: '6px 12px', color: '#28c840', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
            >
              <CheckCircle2 size={14} /> Finalize All
            </button>
          )}
          <button
            onClick={() => sendMessage('Please extract ALL requirements from our full conversation — every process, dimension, KPI, and business rule you can identify. List them all now.', false, undefined, true)}
            disabled={isLoading}
            title="Force a fresh extraction pass over the entire conversation"
            style={{ background: 'transparent', border: '1px solid rgba(0,180,255,0.35)', borderRadius: '6px', padding: '6px 12px', color: '#00b4ff', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', opacity: isLoading ? 0.5 : 1 }}
          >
            <History size={14} /> Re-extract All
          </button>
          <button
            onClick={() => setChatPanelOpen(p => !p)}
            title={chatPanelOpen ? 'Collapse chat' : 'Open chat'}
            style={{ background: chatPanelOpen ? 'rgba(134,188,37,0.1)' : 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 12px', color: chatPanelOpen ? 'var(--color-green)' : 'var(--color-white-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
          >
            <MessageSquare size={14} /> BA Agent {chatPanelOpen ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
          <button
            onClick={handleProceedClick}
            disabled={processCount === 0}
            title={processCount === 0 ? 'Add at least one Business Process before proceeding' : undefined}
            className="btn-primary"
            style={{ padding: '6px 16px', fontSize: '0.8125rem', border: 'none', cursor: processCount === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', opacity: processCount === 0 ? 0.4 : 1 }}
          >
            Proceed to Handoff <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT: Filter / Navigation ── */}
        <aside style={{ width: '220px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', flexShrink: 0 }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <ListFilter size={13} color="var(--color-white-muted)" />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-white-muted)', flex: 1 }}>Filter</span>
              <button
                onClick={handleAddRequirement}
                title="Add requirement"
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '2px 6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.625rem' }}
              >
                <Plus size={9} /> Add
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(['all', 'process', 'dimension', 'kpi', 'rule'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    width: '100%', padding: '7px 10px', border: 'none', borderRadius: '5px', textAlign: 'left',
                    background: activeTab === tab ? 'rgba(134,188,37,0.08)' : 'transparent',
                    color: activeTab === tab ? 'var(--color-white)' : 'var(--color-white-muted)',
                    cursor: 'pointer', fontSize: '0.8125rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    borderLeft: activeTab === tab ? '2px solid var(--color-green)' : '2px solid transparent',
                  }}
                >
                  <span>{tab === 'all' ? 'All Items' : typeConfig[tab].label}</span>
                  <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', padding: '1px 6px', color: 'var(--color-white-muted)' }}>
                    {typeCounts[tab]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', borderRadius: '5px', padding: '5px 8px' }}>
              <Search size={12} color="var(--color-white-muted)" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search requirements..."
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.75rem', outline: 'none' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '0', display: 'flex' }}>
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Quick-jump list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {filteredRequirements.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-white-muted)', fontSize: '0.725rem', lineHeight: 1.7 }}>
                {requirements.length === 0 ? (
                  <>
                    <div style={{ marginBottom: '10px', fontSize: '0.8rem', color: 'var(--color-white)' }}>No requirements yet</div>
                    <div>Upload your transcripts or ask the BA Agent to extract requirements.</div>
                    <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(0,180,255,0.07)', borderRadius: '5px', textAlign: 'left', fontSize: '0.69rem', lineHeight: 1.6 }}>
                      <div style={{ fontWeight: 600, color: '#00b4ff', marginBottom: '4px' }}>Quick commands:</div>
                      <div>"Extract all requirements"</div>
                      <div>"Add a KPI for [metric]"</div>
                      <div>"Delete [requirement name]"</div>
                      <div>"Rename [old] to [new]"</div>
                    </div>
                  </>
                ) : (
                  'No items match this filter.'
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {filteredRequirements.map(req => {
                  const cfg = typeConfig[req.type];
                  return (
                    <button
                      key={req.id}
                      onClick={() => document.getElementById(`req-${req.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      style={{
                        width: '100%', padding: '8px 10px', border: 'none', borderRadius: '5px',
                        background: 'transparent', textAlign: 'left', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '8px',
                      }}
                    >
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: `${cfg.color}22`, border: `1px solid ${cfg.color}55`, fontSize: '0.6rem', fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{cfg.letter}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{req.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* ── CENTER: BRD Document ── */}
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-page)', position: 'relative' }}>
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 48px 80px' }}>

            {/* Document Title Block */}
            <div style={{ marginBottom: '40px', paddingBottom: '32px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <FileText size={16} color="var(--color-green)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-green)' }}>Business Requirements Document</span>
              </div>
              <h1 className="heading-font" style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '12px', color: 'var(--color-white)' }}>
                Project Requirements
              </h1>
              <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-white-muted)' }}>Version: <strong style={{ color: 'var(--color-white)' }}>Draft</strong></span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-white-muted)' }}>Generated: <strong style={{ color: 'var(--color-white)' }}>{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-white-muted)' }}>Items Extracted: <strong style={{ color: 'var(--color-white)' }}>{requirements.length}</strong></span>
              </div>
              {/* Stats row */}
              {requirements.length > 0 && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                  {(['process', 'dimension', 'kpi', 'rule'] as const).map(t => {
                    const count = requirements.filter(r => r.type === t).length;
                    if (count === 0) return null;
                    const cfg = typeConfig[t];
                    return (
                      <div key={t} style={{ padding: '8px 14px', background: `${cfg.color}10`, border: `1px solid ${cfg.color}30`, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: cfg.color }}>{cfg.letter}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-white-muted)' }}>{count} {cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Empty State */}
              {filteredRequirements.length === 0 && activeTab !== 'all' && (
              <div style={{ textAlign: 'center', padding: '60px 32px', color: 'var(--color-white-muted)' }}>
                <p style={{ fontSize: '0.9rem' }}>No {typeConfig[activeTab]?.label.toLowerCase()} captured yet.</p>
              </div>
            )}

            {requirements.length === 0 && activeTab === 'all' && (
              <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--color-white-muted)' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <BookOpen size={28} color="rgba(255,255,255,0.1)" />
                </div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-white)', marginBottom: '10px' }}>No requirements extracted yet</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '400px', margin: '0 auto 24px' }}>
                  Use the BA Agent panel on the right to upload a dashboard mock-up, interview transcript, or describe your business objectives. Requirements will appear here as a formatted document.
                </p>
                <button
                  onClick={() => setChatPanelOpen(true)}
                  style={{ background: 'rgba(134,188,37,0.1)', border: '1px solid var(--color-green)', borderRadius: '6px', color: 'var(--color-green)', padding: '8px 18px', fontSize: '0.875rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <MessageSquare size={14} /> Open BA Agent
                </button>
              </div>
            )}

            {/* BRD Sections */}
            {visibleTypes.map(type => {
              const items = requirements.filter(r => r.type === type);
              if (items.length === 0) return null;
              const cfg = typeConfig[type];
              return (
                <section key={type} style={{ marginBottom: '52px' }}>
                  {/* Section heading */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', paddingBottom: '12px', borderBottom: `1px solid ${cfg.color}25` }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${cfg.color}18`, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: cfg.color }}>
                      {cfg.sectionNum}
                    </div>
                    <h2 className="heading-font" style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)', margin: 0 }}>{cfg.label}</h2>
                    <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: cfg.color, background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`, borderRadius: '20px', padding: '2px 10px', fontWeight: 600 }}>
                      {items.length} item{items.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Requirement cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {items.map((req, idx) => (
                      <div
                        key={req.id}
                        id={`req-${req.id}`}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          transition: 'border-color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = `${cfg.color}40`)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--color-border)')}
                      >
                        {/* Card Header */}
                        <div style={{ padding: '14px 18px', background: `${cfg.color}06`, borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-white-muted)', minWidth: '28px' }}>{cfg.letter}{String(idx + 1).padStart(2, '0')}</span>
                          <h3 style={{ flex: 1, fontSize: '0.9375rem', fontWeight: 600, color: 'var(--color-white)', margin: 0 }}>{req.name}</h3>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '4px', fontWeight: 600, background: req.priority === 'High' ? 'rgba(255,95,86,0.15)' : req.priority === 'Medium' ? 'rgba(255,189,46,0.15)' : 'rgba(255,255,255,0.05)', color: req.priority === 'High' ? '#ff5f56' : req.priority === 'Medium' ? '#ffbd2e' : 'var(--color-white-muted)' }}>
                              {req.priority}
                            </span>
                            <span style={{ fontSize: '0.65rem', padding: '2px 7px', borderRadius: '4px', background: req.status === 'Finalized' ? 'rgba(40,200,64,0.15)' : 'rgba(255,255,255,0.05)', color: req.status === 'Finalized' ? '#28c840' : 'var(--color-white-muted)', fontWeight: 600 }}>
                              {req.status}
                            </span>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          {req.description && (
                            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.65, color: 'var(--color-white)' }}>
                              {req.description}
                            </p>
                          )}
                          {req.logic && (
                            <div style={{ background: 'var(--bg-code)', border: '1px solid var(--color-border)', borderRadius: '7px', overflow: 'hidden' }}>
                              <div style={{ padding: '6px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Hash size={11} color="var(--color-green)" />
                                <span style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--color-green)' }}>expression.sql</span>
                              </div>
                              <pre style={{ margin: 0, padding: '12px 16px', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--color-white)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {req.logic}
                              </pre>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleDeleteRequirement(req.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', color: '#ff5f56', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Trash2 size={11} /> Delete
                          </button>
                          <button onClick={() => handleToggleFinalize(req.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '5px', color: req.status === 'Finalized' ? 'var(--color-white-muted)' : '#28c840', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <CheckCircle2 size={11} /> {req.status === 'Finalized' ? 'Keep as Draft' : 'Finalize'}
                          </button>
                          <button onClick={() => handleStartEdit(req)} style={{ background: 'rgba(134,188,37,0.08)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '5px', color: 'var(--color-green)', fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Edit3 size={11} /> Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </main>

        {/* ── RIGHT: Chat Panel ── */}
        {chatPanelOpen && (
          <aside style={{ width: '360px', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)', flexShrink: 0 }}>
            {/* Panel header */}
            <div style={{ height: '48px', padding: '0 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-nav)', flexShrink: 0 }}>
              <Bot size={14} color="var(--color-green)" />
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, flex: 1 }}>BA Agent</span>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept=".txt,.md,.csv,.json,.png,.jpg,.jpeg,.gif,.webp" multiple />
              <button onClick={handleFileUpload} disabled={isLoading} title="Upload context (images, transcripts, docs)" style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '5px', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem' }}>
                <UploadCloud size={12} /> Upload
              </button>
              <button onClick={() => setChatPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', padding: '4px' }}>
                <X size={15} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '5px', flexShrink: 0,
                    background: msg.role === 'assistant' ? 'var(--color-green)' : 'var(--bg-input)',
                    color: msg.role === 'assistant' ? '#000' : 'var(--color-white)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {msg.role === 'assistant' ? <Bot size={14} /> : <span style={{ fontSize: '8px', fontWeight: 800 }}>U</span>}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.8125rem', lineHeight: 1.6, color: 'var(--color-white)' }}>
                    {msg.role === 'assistant' ? (
                      <div dangerouslySetInnerHTML={{ __html: renderAIResponse(msg.content) }} />
                    ) : msg.isImage ? (
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-green)', fontSize: '0.75rem', marginBottom: '4px' }}>
                          <UploadCloud size={12} /> {msg.imageName || 'Image uploaded'}
                        </div>
                        {msg.content && msg.content.replace(`[Uploaded Image: ${msg.imageName}]`, '').trim() && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-white)' }}>{msg.content.replace(`[Uploaded Image: ${msg.imageName}]`, '').trim()}</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '5px', background: 'var(--color-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={14} />
                  </div>
                  <div style={{ color: 'var(--color-white-muted)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={13} className="spin-icon" /> <span style={{ color: 'var(--color-white)' }}>{thinkingPhase || 'Thinking...'}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-white-muted)', opacity: 0.6 }}>Extracting requirements from conversation</div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: '12px', borderTop: '1px solid var(--color-border)', background: 'var(--bg-nav)', flexShrink: 0 }}>
              <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--color-border)', padding: '8px 12px', borderRadius: '7px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                  disabled={isLoading}
                  placeholder="Describe a requirement or ask a question..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.8125rem', outline: 'none' }}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  style={{ background: 'var(--color-white)', color: '#000', border: 'none', borderRadius: '4px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, opacity: (isLoading || !input.trim()) ? 0.5 : 1 }}
                >
                  <Send size={12} /> Send
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {isEditing && editDraft && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '520px', maxWidth: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Edit Requirement</span>
              <button onClick={handleCancelEdit} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><X size={16} /></button>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
              {/* Name */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Name</div>
                <input value={editDraft.name} onChange={e => setEditDraft(d => d ? { ...d, name: e.target.value } : d)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.9rem', padding: '8px 12px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {/* Type & Priority */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Type</div>
                  <select value={editDraft.type} onChange={e => setEditDraft(d => d ? { ...d, type: e.target.value as BankedRequirement['type'] } : d)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', padding: '8px 10px', outline: 'none' }}>
                    <option value="process">Process</option>
                    <option value="dimension">Dimension</option>
                    <option value="kpi">KPI</option>
                    <option value="rule">Rule</option>
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Priority</div>
                  <select value={editDraft.priority} onChange={e => setEditDraft(d => d ? { ...d, priority: e.target.value as BankedRequirement['priority'] } : d)} style={{ width: '100%', background: '#1a1a1a', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', padding: '8px 10px', outline: 'none' }}>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              {/* Description */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px' }}>Description</div>
                <textarea value={editDraft.description} onChange={e => setEditDraft(d => d ? { ...d, description: e.target.value } : d)} rows={3} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.875rem', padding: '8px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }} />
              </div>
              {/* Logic */}
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}><Hash size={12} /> Technical Logic / Formula</div>
                <textarea value={editDraft.logic || ''} onChange={e => setEditDraft(d => d ? { ...d, logic: e.target.value } : d)} rows={4} placeholder="e.g. SUM(order_total) WHERE status = 'complete'" style={{ width: '100%', background: 'var(--bg-code)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-green)', fontSize: '0.8125rem', fontFamily: 'monospace', padding: '10px 12px', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--color-border)', background: 'var(--bg-page)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={handleCancelEdit} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.8125rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSaveEdit} style={{ padding: '8px 20px', background: 'var(--color-white)', border: 'none', borderRadius: '6px', color: '#000', fontSize: '0.8125rem', cursor: 'pointer', fontWeight: 600 }}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review / Handoff Modal ── */}
      {showReviewModal && (() => {
        const draftProcesses = requirements.filter(r => r.type === 'process' && r.status === 'Draft');
        const allProcessesFinalized = draftProcesses.length === 0;
        return <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-in" style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', width: '600px', maxWidth: '90vw', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-page)' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '4px' }}>Banked Requirements Summary</h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Review extracted items before generating the Bus Matrix.</div>
              </div>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <div style={{ padding: '24px', flex: 1, overflowY: 'auto', maxHeight: '50vh' }}>
              {/* Finalize warning */}
              {!allProcessesFinalized && (
                <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'rgba(255,189,46,0.08)', border: '1px solid rgba(255,189,46,0.3)', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>⚠️</span>
                  <div style={{ fontSize: '0.8125rem', color: '#ffbd2e', lineHeight: 1.5 }}>
                    <strong>{draftProcesses.length} Business Process{draftProcesses.length > 1 ? 'es are' : ' is'} still in Draft.</strong> Each process becomes a fact table in your schema. Finalize them in the BRD before proceeding, or continue knowing they will still be included.
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-green)' }}>{requirements.filter(r => r.type === 'process').length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Business Processes → Fact Tables</div>
                </div>
                <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-white)' }}>{requirements.filter(r => r.type === 'dimension').length}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Dimensions → Dim Tables</div>
                </div>
              </div>
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>All Extracted Items</h3>
              {requirements.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', textAlign: 'center', padding: '16px' }}>No requirements have been extracted.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {requirements.map(req => (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', borderLeft: req.status === 'Finalized' ? '2px solid #28c840' : '2px solid rgba(255,189,46,0.4)' }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{req.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginTop: '4px' }}>{req.type.toUpperCase()} • <span style={{ color: req.status === 'Finalized' ? '#28c840' : '#ffbd2e' }}>{req.status}</span></div>
                      </div>
                      <div style={{ padding: '4px 8px', background: req.priority === 'High' ? 'rgba(255,95,86,0.1)' : 'rgba(255,255,255,0.05)', color: req.priority === 'High' ? '#ff5f56' : 'var(--color-white-muted)', fontSize: '0.65rem', borderRadius: '4px' }}>
                        {req.priority}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '24px', borderTop: '1px solid var(--color-border)', background: 'var(--bg-page)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowReviewModal(false)} disabled={isSaving} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', fontSize: '0.875rem', cursor: 'pointer' }}>Cancel</button>
              <button onClick={confirmHandoff} disabled={isSaving} className="btn-primary" style={{ padding: '8px 24px', border: 'none', borderRadius: '6px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                {isSaving ? <><Loader2 size={16} className="spin-icon" /> Banking...</> : allProcessesFinalized ? 'Confirm & Generate Matrix' : 'Proceed Anyway →'}
              </button>
            </div>
          </div>
        </div>;
      })()}

    </div>
  );
}
