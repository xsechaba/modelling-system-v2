'use client';
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, UploadCloud, MessageSquare, Code, Workflow, Layout, Moon, Sun, Zap, Star, Bot, FileCode, BarChart3 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from '@/lib/theme';

export default function Home() {
  const { scrollY } = useScroll();
  const uiY = useTransform(scrollY, [0, 800], [0, -150]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const steps = [
    { num: '01', icon: <UploadCloud size={22} />, color: '#0ea5e9', title: 'Upload & Profile', desc: 'Upload CSVs or metadata schemas. AI profiles every column, surfaces data quality issues, and identifies surrogate key candidates.' },
    { num: '02', icon: <MessageSquare size={22} />, color: '#86BC25', title: 'Define Requirements', desc: 'Your AI Business Analyst extracts KPIs, dimensions, and business processes from interview transcripts, mockups, or prompts.' },
    { num: '03', icon: <Workflow size={22} />, color: '#a855f7', title: 'Design Your Schema', desc: 'Visualize the auto-generated ERD in a live canvas. Chat with the AI to rename, add, or restructure tables in real time.' },
    { num: '04', icon: <Code size={22} />, color: '#f59e0b', title: 'Export & Deploy', desc: 'Generate modular, production-ready dbt SQL files, YAML configs, and full technical documentation in a single click.' },
  ];

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: 'var(--color-black)' }}>
      {/* Cursor Glow */}
      <div className="ambient-glow" style={{ left: mousePosition.x - 300, top: mousePosition.y - 300, transition: 'top 0.1s ease-out, left 0.1s ease-out' }} />

      {/* Grid Background */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '60px 60px', zIndex: 0, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 65%)', WebkitMaskImage: 'radial-gradient(ellipse at top, black 0%, transparent 65%)' }} />

      {/* Navigation */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '64px', padding: '0 32px', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-glass)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" fill="var(--color-black)" stroke="var(--color-green)" strokeWidth="1.5" />
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)' }}>dim-wiz</span>
        </div>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          {['Product', 'Solutions', 'Documentation', 'Pricing'].map(label => (
            <a key={label} href="#" style={{ fontSize: '0.875rem', color: 'var(--color-white)', opacity: 0.65, fontWeight: 500, textDecoration: 'none', transition: 'opacity 0.2s' }} onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }} onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; }}>{label}</a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button onClick={toggleTheme} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-white-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <Link href="/auth/login" style={{ fontSize: '0.875rem', color: 'var(--color-white)', fontWeight: 500, textDecoration: 'none', opacity: 0.8 }}>Log In</Link>
          <Link href="/projects" style={{ fontSize: '0.875rem', fontWeight: 600, background: 'var(--color-green)', color: '#050505', padding: '8px 18px', borderRadius: '100px', textDecoration: 'none', boxShadow: '0 0 16px rgba(134,188,37,0.25)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            Start Building <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: '148px', paddingBottom: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            {/* Announcement Badge */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.05 }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '5px 6px 5px 16px', background: 'rgba(134,188,37,0.06)', border: '1px solid rgba(134,188,37,0.22)', borderRadius: '100px', marginBottom: '44px', cursor: 'pointer' }}>
              <span style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem', letterSpacing: '-0.01em' }}>Schema Chat Agent is now live</span>
              <span style={{ background: 'var(--color-green)', color: '#050505', fontSize: '0.7rem', fontWeight: 700, padding: '4px 12px', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}>
                Try it free <ArrowRight size={11} />
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="heading-font" style={{ fontSize: 'clamp(2.75rem, 5.5vw, 5.5rem)', lineHeight: 1.0, marginBottom: '28px', color: 'var(--color-white)', letterSpacing: '-0.05em', fontWeight: 700, maxWidth: '920px' }}>
              Production-Ready<br />Dimensional Models,{' '}
              <span className="text-gradient-green">Instantly.</span>
            </h1>

            {/* Sub */}
            <p style={{ fontSize: '1.125rem', color: 'var(--color-white-muted)', maxWidth: '580px', margin: '0 auto 48px', lineHeight: 1.7, fontWeight: 400 }}>
              The only AI-native platform for designing, validating, and deploying Kimball star schemas — from raw data upload to production dbt code in one guided workflow.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/projects" className="btn-primary" style={{ padding: '14px 28px', fontSize: '0.9375rem', borderRadius: '100px', gap: '10px' }}>
                Start Building Free <ArrowRight size={16} />
              </Link>
              <button className="btn-secondary" style={{ padding: '14px 28px', fontSize: '0.9375rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={15} /> Watch Demo
              </button>
            </div>

            {/* Trust Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '28px', marginTop: '56px', paddingTop: '32px', borderTop: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex' }}>
                  {['#86bc25', '#0ea5e9', '#a855f7', '#f59e0b'].map((bg, i) => (
                    <div key={i} style={{ width: '30px', height: '30px', borderRadius: '50%', background: bg, border: '2px solid var(--color-black)', marginLeft: i > 0 ? '-9px' : '0', zIndex: 4 - i, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800, color: '#fff' }}>
                      {['S', 'N', 'A', 'J'][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: '2px', marginBottom: '3px' }}>{[1,2,3,4,5].map(i => <Star key={i} size={11} fill="#86bc25" color="#86bc25" />)}</div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Trusted by data teams</span>
                </div>
              </div>
              <div style={{ width: '1px', height: '32px', background: 'var(--color-border)' }} />
              {[{ val: '6', label: 'Pipeline stages' }, { val: 'Kimball', label: 'Star & Snowflake' }, { val: '1-click', label: 'dbt export' }].map(item => (
                <div key={item.val} style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.02em' }}>{item.val}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-white-muted)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Hero Interactive UI Mockup */}
        <motion.div 
          style={{ y: uiY, marginTop: '80px', width: '100%', maxWidth: '1200px', padding: '0 24px', perspective: '1000px' }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* macOS-style screenshot frame wrapper */}
          <div style={{
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset, 0 0 0 4px rgba(255,255,255,0.03)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '600px',
            position: 'relative',
            background: '#050505',
          }}>
            {/* Texture Overlay from Pexels inside the app shell header for a subtle realistic touch */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', zIndex: 0, opacity: 0.1, overflow: 'hidden' }}>
               <Image
                 src="https://images.pexels.com/photos/16708389/pexels-photo-16708389.jpeg"
                 alt="Texture"
                 fill
                 unoptimized
                 style={{ objectFit: 'cover' }}
               />
               <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #050505)' }} />
            </div>

            {/* macOS Window Title Bar */}
            <div style={{
              height: '44px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              background: 'rgba(18,18,18,0.95)',
              backdropFilter: 'blur(12px)',
              zIndex: 1,
              position: 'relative',
              flexShrink: 0,
            }}>
              {/* Traffic light buttons — left side, macOS style */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#ff5f57', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#ffbd2e', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
                <div style={{ width: 13, height: 13, borderRadius: '50%', background: '#28c840', border: '1px solid rgba(0,0,0,0.15)', flexShrink: 0 }} />
              </div>
              {/* Centered title */}
              <div style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '0.8125rem',
                fontWeight: 500,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
                <Layout size={13} />
                dim-wiz / retail-analytics / <span style={{ color: 'rgba(255,255,255,0.75)' }}>Schema Editor</span>
              </div>
            </div>

            {/* App Mockup Body */}
            <div style={{ flex: 1, display: 'flex', background: '#0a0a0a', zIndex: 1 }}>
               {/* Sidebar */}
               <div style={{ width: '240px', borderRight: '1px solid rgba(255,255,255,0.08)', background: '#050505', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '16px' }}>Generated Models</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ fontSize: '0.8125rem', color: '#ffffff', background: 'rgba(0,255,102,0.1)', borderLeft: '2px solid var(--color-green)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>fact_sales</div>
                     <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>dim_date</div>
                     <div style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.5)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>dim_store</div>
                  </div>
               </div>
               
               {/* Canvas */}
               <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {/* Grid */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />
                  
                  {/* ERD Node 1 */}
                  <div style={{ position: 'absolute', top: '20%', left: '30%', width: '260px', background: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                     <div style={{ padding: '12px', background: 'rgba(0,255,102,0.05)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff' }}>fact_sales</div>
                     <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>date_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>store_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>revenue</span><span>DECIMAL</span></div>
                     </div>
                  </div>

                  {/* ERD Node 2 */}
                  <div style={{ position: 'absolute', top: '60%', left: '60%', width: '220px', background: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                     <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: '0.8125rem', fontWeight: 600, color: '#ffffff' }}>dim_store</div>
                     <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.55)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>store_key</span><span style={{ color: '#ffbd2e' }}>PK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>region</span><span>VARCHAR</span></div>
                     </div>
                  </div>

                  {/* Connection Line Fake */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <path d="M 450 250 Q 550 250 550 400" fill="transparent" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="4 4" opacity={0.5} />
                  </svg>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" style={{ padding: '160px 0 120px', position: 'relative', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(134,188,37,0.06)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '100px', marginBottom: '20px' }}>
              <Zap size={12} color="#86bc25" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#86bc25', textTransform: 'uppercase', letterSpacing: '0.06em' }}>How it works</span>
            </div>
            <h2 className="heading-font" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)', marginBottom: '16px' }}>
              A complete pipeline in four stages
            </h2>
            <p style={{ color: 'var(--color-white-muted)', fontSize: '1.0625rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
              Every stage feeds the next. No manual handoffs, no context loss.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '26px', left: '12.5%', right: '12.5%', height: '1px', background: 'linear-gradient(to right, transparent, rgba(134,188,37,0.35), rgba(134,188,37,0.35), transparent)', zIndex: 0, pointerEvents: 'none' }} />
            {steps.map((step, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 1 }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${step.color}12`, border: `1px solid ${step.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: step.color, position: 'relative' }}>
                  {step.icon}
                  <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--color-black)', border: `1px solid ${step.color}50`, fontSize: '0.55rem', fontWeight: 800, color: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                </div>
                <div>
                  <h3 className="heading-font" style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-white)', marginBottom: '10px', letterSpacing: '-0.025em' }}>{step.title}</h3>
                  <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', lineHeight: 1.7 }}>{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CAPABILITIES BENTO ── */}
      <section id="features" style={{ padding: '0 0 160px', position: 'relative' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <h2 className="heading-font" style={{ fontSize: 'clamp(2rem, 3.5vw, 3rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)', marginBottom: '16px' }}>
              The complete dimensional{' '}<span className="text-gradient-green">modelling toolkit</span>
            </h2>
            <p style={{ color: 'var(--color-white-muted)', fontSize: '1.0625rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.65 }}>
              Every tool you need, deeply integrated. No context switching.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>

            {/* Card 1: AI Requirements Agent — 2 cols wide */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
              style={{ gridColumn: 'span 2', background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '40px', overflow: 'hidden', position: 'relative', transition: 'border-color 0.3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(134,188,37,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
              <div style={{ position: 'absolute', top: -80, left: -80, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(134,188,37,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(134,188,37,0.08)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '100px', marginBottom: '20px' }}>
                <Bot size={13} color="#86bc25" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#86bc25', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Business Analyst</span>
              </div>
              <h3 className="heading-font" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.03em', marginBottom: '10px' }}>Requirements extracted from your transcripts</h3>
              <p style={{ color: 'var(--color-white-muted)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '28px', maxWidth: '460px' }}>
                Upload interview recordings, dashboard mockups, or specs. The BA Agent extracts every KPI, dimension, and business rule into a structured BRD document.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '480px' }}>
                {[
                  { role: 'agent', text: 'I can see 3 business processes in your data. Shall I extract KPIs for each with concrete formulas?' },
                  { role: 'user', text: 'Yes — include delivery SLA metrics with actual column references.' },
                  { role: 'agent', text: '✓ Extracted 18 requirements across 4 categories — On-Time Delivery %, GMV, Cancellation Rate and 15 more.' },
                ].map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.role === 'agent' && <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#86bc25', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}><Bot size={12} color="#050505" /></div>}
                    <div style={{ background: msg.role === 'agent' ? 'rgba(134,188,37,0.07)' : 'var(--bg-input)', border: `1px solid ${msg.role === 'agent' ? 'rgba(134,188,37,0.15)' : 'var(--color-border)'}`, borderRadius: '10px', padding: '9px 14px', fontSize: '0.775rem', color: 'var(--color-white)', lineHeight: 1.5, maxWidth: '80%' }}>{msg.text}</div>
                    {msg.role === 'user' && <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-input)', border: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: 'var(--color-white-muted)', marginTop: '2px' }}>U</div>}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 2: Schema ERD — tall, right col, row span 2 */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}
              style={{ gridRow: 'span 2', background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '40px', overflow: 'hidden', position: 'relative', transition: 'border-color 0.3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(168,85,247,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: '100px', marginBottom: '20px' }}>
                <Workflow size={13} color="#a855f7" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visual Schema Editor</span>
              </div>
              <h3 className="heading-font" style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.03em', marginBottom: '10px' }}>Live ERD canvas with AI chat</h3>
              <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '28px' }}>
                Drag and rearrange your schema. Chat with the AI to add dimensions, restructure fact tables, or enforce referential integrity.
              </p>
              <div style={{ position: 'relative', height: '200px', background: 'var(--bg-page)', borderRadius: '12px', border: '1px solid var(--color-border)', overflow: 'hidden', marginBottom: '24px' }}>
                <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.8 }} />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100px', background: 'var(--bg-surface)', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', zIndex: 2 }}>
                  <div style={{ padding: '6px 10px', background: 'rgba(168,85,247,0.08)', borderBottom: '1px solid rgba(168,85,247,0.2)', fontSize: '0.62rem', fontWeight: 700, color: '#a855f7' }}>fact_sales</div>
                  <div style={{ padding: '8px 10px', fontSize: '0.58rem', fontFamily: 'monospace', color: 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>date_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>cust_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                  </div>
                </div>
                <div style={{ position: 'absolute', top: '8%', left: '6%', width: '80px', background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                  <div style={{ padding: '5px 8px', fontSize: '0.58rem', fontWeight: 700, color: 'var(--color-white-muted)', borderBottom: '1px solid var(--color-border)' }}>dim_date</div>
                  <div style={{ padding: '5px 8px', fontSize: '0.55rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>date_key PK</div>
                </div>
                <div style={{ position: 'absolute', bottom: '8%', right: '6%', width: '80px', background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '6px' }}>
                  <div style={{ padding: '5px 8px', fontSize: '0.58rem', fontWeight: 700, color: 'var(--color-white-muted)', borderBottom: '1px solid var(--color-border)' }}>dim_customer</div>
                  <div style={{ padding: '5px 8px', fontSize: '0.55rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>cust_key PK</div>
                </div>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  <path d="M 86 38 Q 130 38 130 100" fill="none" stroke="rgba(168,85,247,0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <path d="M 200 152 Q 200 168 220 168" fill="none" stroke="rgba(168,85,247,0.45)" strokeWidth="1.5" strokeDasharray="4 3" />
                </svg>
              </div>
              {['Star & snowflake schemas', 'Natural language schema chat', 'Auto FK coherence enforcement'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.825rem', color: 'var(--color-white-muted)', marginBottom: '10px' }}>
                  <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(134,188,37,0.1)', border: '1px solid rgba(134,188,37,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1.5 4L3 5.5L6.5 2" stroke="#86bc25" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
                  </div>
                  {f}
                </div>
              ))}
            </motion.div>

            {/* Card 3: Bus Matrix */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '36px', overflow: 'hidden', position: 'relative', transition: 'border-color 0.3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(14,165,233,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
              <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '100px', marginBottom: '20px' }}>
                <BarChart3 size={13} color="#0ea5e9" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bus Matrix</span>
              </div>
              <h3 className="heading-font" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.03em', marginBottom: '10px' }}>Conformed dimensions at a glance</h3>
              <p style={{ color: 'var(--color-white-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '24px' }}>Auto-generated Kimball bus matrix. Edit cells interactively and track staleness when requirements change.</p>
              <div style={{ overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', background: 'var(--bg-nav)', borderBottom: '1px solid var(--color-border)' }}>
                  {['', 'Date', 'Cust', 'Geo', 'Prod'].map(h => (
                    <div key={h} style={{ padding: '7px 6px', fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-white-muted)', textAlign: 'center', borderRight: '1px solid var(--color-border)' }}>{h}</div>
                  ))}
                </div>
                {[['Order Sales', true, true, true, true], ['Payments', true, true, false, false], ['Reviews', true, false, false, true]].map((row, ri) => (
                  <div key={ri} style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', background: ri % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-page)' }}>
                    <div style={{ padding: '8px 10px', fontSize: '0.65rem', color: 'var(--color-white)', fontWeight: 500, borderRight: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>{row[0] as string}</div>
                    {(row.slice(1) as boolean[]).map((v, ci) => (
                      <div key={ci} style={{ padding: '8px', textAlign: 'center', borderRight: '1px solid var(--color-border)', fontSize: '0.7rem', color: v ? '#86bc25' : 'var(--color-white-muted)', fontWeight: v ? 700 : 400 }}>{v ? '✓' : '·'}</div>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Card 4: dbt Compilation */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--color-border)', borderRadius: '20px', padding: '36px', overflow: 'hidden', position: 'relative', transition: 'border-color 0.3s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.35)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)'; }}>
              <div style={{ position: 'absolute', bottom: -60, right: -60, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 12px', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '100px', marginBottom: '20px' }}>
                <FileCode size={13} color="#f59e0b" />
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>dbt Compilation</span>
              </div>
              <h3 className="heading-font" style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-white)', letterSpacing: '-0.03em', marginBottom: '10px' }}>One click to production SQL</h3>
              <p style={{ color: 'var(--color-white-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '20px' }}>Generates dbt SQL, schema YAML, and documentation. Cached — only regenerates when your schema changes.</p>
              <div style={{ background: 'var(--bg-code)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <div style={{ padding: '7px 14px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-nav)' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f57' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#28c840' }} />
                  <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--color-white-muted)', fontFamily: 'monospace' }}>fct_order_items.sql</span>
                </div>
                <pre style={{ margin: 0, padding: '14px 16px', fontSize: '0.72rem', fontFamily: 'monospace', lineHeight: 1.7, color: 'var(--color-white-muted)', overflowX: 'auto' }}>{`with source as (
  select * from {{ ref('stg_orders') }}
)
select
  order_id,
  date_key,      -- FK → dim_date
  customer_key,  -- FK → dim_customer
  sum(price) as gmv
from source
group by 1, 2, 3`}</pre>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <footer style={{ position: 'relative', overflow: 'hidden', borderTop: '1px solid var(--color-border)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center top, rgba(134,188,37,0.07) 0%, transparent 55%)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} style={{ textAlign: 'center', padding: '120px 0 60px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', background: 'rgba(134,188,37,0.06)', border: '1px solid rgba(134,188,37,0.2)', borderRadius: '100px', marginBottom: '28px' }}>
              <Zap size={12} color="#86bc25" />
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#86bc25' }}>Free to start — no credit card required</span>
            </div>
            <h2 className="heading-font" style={{ fontSize: 'clamp(2.5rem, 4.5vw, 4rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)', marginBottom: '20px', lineHeight: 1.05 }}>
              Ready to architect<br /><span className="text-gradient-green">your first model?</span>
            </h2>
            <p style={{ color: 'var(--color-white-muted)', fontSize: '1.0625rem', maxWidth: '460px', margin: '0 auto 48px', lineHeight: 1.65 }}>
              Upload your data, describe your KPIs, and walk out with production-ready dbt code in under 30 minutes.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/projects" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1rem', borderRadius: '100px', gap: '10px' }}>
                Launch Guided Workspace <ArrowRight size={16} />
              </Link>
              <Link href="/auth/login" className="btn-secondary" style={{ padding: '16px 36px', fontSize: '1rem', borderRadius: '100px', display: 'inline-flex', alignItems: 'center' }}>
                Sign in
              </Link>
            </div>
            <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-white-muted)', fontSize: '0.8125rem', flexWrap: 'wrap', gap: '16px', paddingBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" /></svg>
                <span>&copy; 2026 dim-wiz inc.</span>
              </div>
              <div style={{ display: 'flex', gap: '24px' }}>
                {['Privacy', 'Terms', 'System Status', 'GitHub'].map(link => (
                  <a key={link} href="#" style={{ color: 'var(--color-white-muted)', textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'var(--color-white)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--color-white-muted)'; }}>{link}</a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}

