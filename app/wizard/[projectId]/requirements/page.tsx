'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Bot, Target, Send, UploadCloud, FileText, CheckCircle2, Loader2, Save } from 'lucide-react';
import { renderAIResponse } from '@/lib/markdown';


export default function RequirementsPage() {
  const { projectId } = useParams() as { projectId: string };
  const router = useRouter();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [kpis, setKpis] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showKPIs, setShowKPIs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function loadState() {
      try {
        const res = await fetch(`/api/projects/${projectId}/state`);
        if (res.ok) {
          const data = await res.json();
          const parsed = JSON.parse(data.stateData || '{}');
          if (parsed.chatHistory && parsed.chatHistory.length > 0) {
              setMessages(parsed.chatHistory);
          } else {
              setMessages([{ role: 'assistant', content: 'To determine what dimensions and facts make up the Bus Matrix, I need your business requirements. Do you have any existing dashboard mockups, reporting specs, or KPI definition documents I can parse?' }]);
          }
          
          if (parsed.kpis && parsed.kpis.length > 0) {
              setKpis(parsed.kpis);
              setShowKPIs(true);
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
  }, [messages, showKPIs]);

  const sendMessage = async (messageText: string, isDoc: boolean = false) => {
    if (!messageText.trim()) return;
    
    // Optimistic UI update
    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setInput('');
    setIsLoading(true);
    
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText, isDocument: isDoc })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages(data.chatHistory);
        if (data.kpis && data.kpis.length > 0) {
          setKpis(data.kpis);
          setShowKPIs(true);
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

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      // We truncate the text if it's too massive, just to be safe for the API limit
      const truncatedText = text.length > 20000 ? text.substring(0, 20000) + '... [Truncated]' : text;
      
      const messageText = `[Uploaded Document: ${file.name}]\n\n${truncatedText}`;
      sendMessage(messageText, true);
    };
    
    // Read the file as text (supports .txt, .csv, .md, .json)
    reader.readAsText(file);
    
    // Reset the input so the same file can be selected again if needed
    e.target.value = '';
  };

  const handleSaveAndProceed = async () => {
    // In a real app we might want to save any edited KPI formulas here before proceeding
    try {
      const res = await fetch(`/api/projects/${projectId}/state`);
      const data = await res.json();
      const completedSteps = JSON.parse(data.completedSteps || '[]');
      if (!completedSteps.includes('requirements')) completedSteps.push('requirements');
      
      await fetch(`/api/projects/${projectId}/state`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep: 'bus-matrix',
          completedSteps
        })
      });
      router.push(`/wizard/${projectId}/bus-matrix`);
    } catch (e) {
      console.error(e);
      router.push(`/wizard/${projectId}/bus-matrix`);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Define Requirements & KPIs</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Upload documents or chat with the agent to extract business rules before designing the Bus Matrix.</p>
        </div>
        <button onClick={handleSaveAndProceed} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          Proceed to Bus Matrix <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: IDE Integrated Chat */}
        <div style={{ flex: 1, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Upload Drop Zone for Docs */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
             <input 
               type="file" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               style={{ display: 'none' }} 
               accept=".txt,.md,.csv,.json"
             />
             <button onClick={handleFileUpload} disabled={isLoading} style={{ width: '100%', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '6px', background: 'transparent', color: 'var(--color-white-muted)', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s', opacity: isLoading ? 0.5 : 1 }} onMouseEnter={e => !isLoading && (e.currentTarget.style.borderColor = 'var(--color-green)')} onMouseLeave={e => !isLoading && (e.currentTarget.style.borderColor = 'var(--color-border)')}>
                <UploadCloud size={20} />
                <span style={{ fontSize: '0.8125rem' }}>Click to upload Dashboard Specs, requirements (.txt, .md, .csv)</span>
             </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {messages.map((msg, i) => (
              <div 
                key={i} 
                style={{
                  display: 'flex',
                  gap: '16px',
                  alignSelf: 'stretch',
                }}
              >
                <div style={{ 
                  width: '28px', height: '28px', borderRadius: '4px', 
                  background: msg.role === 'assistant' ? 'var(--color-green)' : 'var(--color-border)',
                  color: msg.role === 'assistant' ? '#000' : 'var(--color-white)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {msg.role === 'assistant' ? <Bot size={16} /> : <span style={{ fontSize: '10px', fontWeight: 600 }}>USR</span>}
                </div>
                
                <div style={{
                  color: msg.content.startsWith('[Uploaded') ? 'var(--color-green)' : 'var(--color-white)',
                  lineHeight: 1.6,
                  fontSize: '0.9375rem',
                  paddingTop: '4px'
                }}>
                  {msg.role === 'assistant' && i === 0 && <span style={{display: 'block', color: 'var(--color-white-muted)', fontSize: '0.75rem', marginBottom: '8px'}}>REQUIREMENTS AGENT</span>}
                  {msg.role === 'assistant' ? (
                    <div dangerouslySetInnerHTML={{ __html: renderAIResponse(msg.content) }} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', gap: '16px', alignSelf: 'stretch' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--color-green)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Bot size={16} />
                </div>
                <div style={{ paddingTop: '4px', color: 'var(--color-white-muted)', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Loader2 size={16} className="spin-icon" /> Thinking...
                  <style>{`@keyframes spin { 100% { transform: rotate(360deg); } } .spin-icon { animation: spin 1.5s linear infinite; }`}</style>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', background: 'var(--color-black)' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '8px' }}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
                disabled={isLoading}
                placeholder="Or type a raw requirement (e.g., We need to track daily revenue per store...)"
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)',
                  fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit', opacity: isLoading ? 0.5 : 1
                }}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{
                  background: 'var(--color-white)', color: 'var(--color-black)', border: 'none', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', fontSize: '0.8125rem', fontWeight: 500, opacity: (isLoading || !input.trim()) ? 0.5 : 1
                }}
              >
                Send
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: KPI Review Area */}
        <div style={{ width: '450px', background: 'var(--color-black-light)', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={18} color="var(--color-green)" />
              <span style={{ fontSize: '1rem', fontWeight: 600 }}>Extracted KPI Models</span>
           </div>
           
           <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              {!showKPIs ? (
                  <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-white-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '0 32px' }}>
                      Provide requirements or upload documents to auto-extract KPIs here.
                  </div>
              ) : (
                  <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                     
                     {kpis.map((kpi, index) => (
                       <div key={kpi.id || index} style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: '#050505' }}>
                          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{kpi.name}</span>
                              <CheckCircle2 size={14} color="var(--color-green)" />
                          </div>
                          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                              <div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '4px' }}>Formula (Editable)</div>
                                  <input type="text" defaultValue={kpi.formula} style={{ width: '100%', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '8px', color: 'var(--color-white)', fontFamily: 'monospace', fontSize: '0.8125rem', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              {kpi.requires && kpi.requires.length > 0 && (
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {kpi.requires.map((req: string, rIdx: number) => (
                                      <span key={rIdx} style={{ fontSize: '0.65rem', background: 'rgba(134,188,37,0.1)', color: 'var(--color-green)', padding: '2px 6px', borderRadius: '4px' }}>Requires: {req}</span>
                                    ))}
                                </div>
                              )}
                          </div>
                       </div>
                     ))}

                  </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}