'use client';
import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Database, ArrowRight, UploadCloud, BarChart2, MessageSquare, Box, PlayCircle, Code, Workflow, Layout } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const { scrollY } = useScroll();
  const uiY = useTransform(scrollY, [0, 800], [0, -150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0.2]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <main style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000000' }}>
      {/* Dynamic Cursor Glow */}
      <div 
        className="ambient-glow"
        style={{
          left: mousePosition.x - 300,
          top: mousePosition.y - 300,
          transition: 'top 0.1s ease-out, left 0.1s ease-out'
        }}
      />

      {/* Grid Pattern Background */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)', backgroundSize: '60px 60px', zIndex: 0, pointerEvents: 'none', maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at top, black, transparent 80%)' }} />

      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        height: '64px',
        padding: '0 32px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Custom Minimalist Vector Logo */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)' }}>dim-wiz</span>
        </div>

        {/* Desktop Links */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#features" style={{ fontSize: '0.875rem', color: 'var(--color-white)', opacity: 0.7, fontWeight: 500, transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Product</a>
          <a href="#solutions" style={{ fontSize: '0.875rem', color: 'var(--color-white)', opacity: 0.7, fontWeight: 500, transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Solutions</a>
          <a href="#docs" style={{ fontSize: '0.875rem', color: 'var(--color-white)', opacity: 0.7, fontWeight: 500, transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Documentation</a>
          <a href="#pricing" style={{ fontSize: '0.875rem', color: 'var(--color-white)', opacity: 0.7, fontWeight: 500, transition: 'opacity 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.opacity='1'} onMouseLeave={e => e.currentTarget.style.opacity='0.7'}>Pricing</a>
        </div>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/auth/login" style={{ fontSize: '0.875rem', color: 'var(--color-white)', fontWeight: 500, textDecoration: 'none' }}>Log In</Link>
          <Link href="/projects" style={{ fontSize: '0.875rem', color: '#000', fontWeight: 600, background: 'var(--color-green)', padding: '8px 16px', borderRadius: '6px', transition: 'all 0.2s', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
            Start Building
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        paddingTop: '160px',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        position: 'relative',
        zIndex: 10
      }}>
        
        <div className="container" style={{ textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
          >
            {/* Tagline */}
            <div style={{ 
              display: 'inline-flex', 
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px', 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid var(--color-border)',
              borderRadius: '100px',
              marginBottom: '32px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-green)' }} />
              <span style={{ color: 'var(--color-white-muted)', fontSize: '0.8125rem', fontWeight: 500 }}>Data Infrastructure Automated v2.0</span>
            </div>
            
            <h1 className="heading-font" style={{ 
              fontSize: 'clamp(3.5rem, 6vw, 5.5rem)', 
              lineHeight: 1.05,
              marginBottom: '24px',
              maxWidth: '900px',
              color: 'var(--color-white)',
              letterSpacing: '-0.04em',
              fontWeight: 600
            }}>
              Deploy Dimensional Models in <span style={{ color: 'var(--color-green)' }}>Minutes.</span>
            </h1>

            <p style={{ 
              fontSize: '1.25rem', 
              color: 'var(--color-white-muted)',
              maxWidth: '650px',
              margin: '0 auto 48px',
              lineHeight: 1.6,
              fontWeight: 400
            }}>
              Turn raw metadata and source tables into production-ready dbt schemas. Guided AI assists data architects from profiling to export.
            </p>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <Link href="/projects" className="btn-primary" style={{ padding: '16px 28px', borderRadius: '8px', gap: '12px', fontSize: '0.9375rem' }}>
                Launch Modeller <ArrowRight size={16} />
              </Link>
              <button style={{ background: 'transparent', color: 'var(--color-white)', border: '1px solid var(--color-border)', padding: '16px 28px', fontSize: '0.9375rem', fontWeight: 500, borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Code size={16} color="var(--color-white-muted)" /> View Documentation
              </button>
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
          <div style={{ 
            background: '#050505', 
            borderRadius: '12px', 
            border: '1px solid var(--color-border)', 
            boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset',
            overflow: 'hidden',
             display: 'flex',
             flexDirection: 'column',
             height: '600px',
             position: 'relative'
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

            {/* App Mockup Header */}
            <div style={{ height: '48px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', padding: '0 16px', background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(10px)', zIndex: 1, justifyContent: 'space-between' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-white-muted)', fontSize: '0.8125rem' }}>
                  <Layout size={14} /> dim-wiz / retail-analytics / <span style={{ color: 'var(--color-white)' }}>Schema Editor</span>
               </div>
               <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
               </div>
            </div>

            {/* App Mockup Body */}
            <div style={{ flex: 1, display: 'flex', background: '#0a0a0a', zIndex: 1 }}>
               {/* Sidebar */}
               <div style={{ width: '240px', borderRight: '1px solid var(--color-border)', background: '#050505', padding: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>Generated Models</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                     <div style={{ fontSize: '0.8125rem', color: 'var(--color-white)', background: 'rgba(0,255,102,0.1)', borderLeft: '2px solid var(--color-green)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>fact_sales</div>
                     <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>dim_date</div>
                     <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', padding: '6px 12px', marginLeft: '-16px', paddingLeft: '14px' }}>dim_store</div>
                  </div>
               </div>
               
               {/* Canvas */}
               <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                  {/* Grid */}
                  <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }} />
                  
                  {/* ERD Node 1 */}
                  <div style={{ position: 'absolute', top: '20%', left: '30%', width: '260px', background: '#050505', border: '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                     <div style={{ padding: '12px', background: 'rgba(0,255,102,0.05)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-white)' }}>fact_sales</div>
                     <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>date_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>store_key</span><span style={{ color: '#ffbd2e' }}>FK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>revenue</span><span>DECIMAL</span></div>
                     </div>
                  </div>

                  {/* ERD Node 2 */}
                  <div style={{ position: 'absolute', top: '60%', left: '60%', width: '220px', background: '#050505', border: '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                     <div style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--color-border)', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-white)' }}>dim_store</div>
                     <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>store_key</span><span style={{ color: '#ffbd2e' }}>PK</span></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>region</span><span>VARCHAR</span></div>
                     </div>
                  </div>

                  {/* Connection Line Fake */}
                  <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <path d="M 450 250 Q 550 250 550 400" fill="transparent" stroke="var(--color-white-muted)" strokeWidth="1" strokeDasharray="4 4" opacity={0.5} />
                  </svg>
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Overview */}
      <section id="how-it-works" style={{ padding: '160px 0', position: 'relative', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <div style={{ marginBottom: '80px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="heading-font" style={{ fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.02em' }}>Unified Architecture Workflow</h2>
            <p style={{ color: 'var(--color-white-muted)', fontSize: '1.125rem', maxWidth: '600px', lineHeight: 1.6 }}>
              Upload schema metadata, define your objective KPIs, profile automatically, and compile scalable `dbt` pipelines instantly.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '2px',
            background: 'var(--color-border)'
          }}>
            {[
              {
                icon: <Database size={24} color="var(--color-white)" />,
                title: 'Data Ingestion',
                desc: 'Upload CSV, JSON samples, or connect real-time structures. The engine immediately profiles for blanks, risks, and surrogate key candidates.'
              },
              {
                icon: <MessageSquare size={24} color="var(--color-white)" />,
                title: 'Objective Analysis',
                desc: 'Context-aware interactive prompts collect your required dashboard KPIs, determining exactly which facts and dimensions are absolutely required.'
              },
              {
                icon: <Workflow size={24} color="var(--color-white)" />,
                title: 'Schema Editor',
                desc: 'Visualise the AI-generated Entity-Relationship Diagram. Drag and drop relationships, configure constraints, and refine with inline chat.'
              },
              {
                icon: <Code size={24} color="var(--color-white)" />,
                title: 'dbt Compilation',
                desc: 'One click instantly generates modular, scalable, and fully runnable `dbt` SQL files matching your reviewed schema exactly.'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                style={{
                  background: '#050505',
                  padding: '48px 40px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '24px',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {feature.icon}
                </div>
                <div>
                  <h3 className="heading-font" style={{ fontSize: '1.25rem', marginBottom: '12px', fontWeight: 600 }}>{feature.title}</h3>
                  <p style={{ color: 'var(--color-white-muted)', lineHeight: 1.6, fontSize: '0.9375rem' }}>{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer style={{ padding: '120px 0 60px', textAlign: 'center', background: '#050505', borderTop: '1px solid var(--color-border)' }}>
        <div className="container">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.6 }}
          >
            <h2 className="heading-font" style={{ fontSize: '3rem', marginBottom: '32px', letterSpacing: '-0.03em' }}>Ready to architect?</h2>
            <Link href="/projects" className="btn-primary" style={{ padding: '16px 40px', fontSize: '1rem', borderRadius: '8px' }}>
              Launch Guided Workspace
            </Link>
            <div style={{ marginTop: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
              <div>&copy; 2026 dim-wiz inc.</div>
              <div style={{ display: 'flex', gap: '24px' }}>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">System Status</a>
              </div>
            </div>
          </motion.div>
        </div>
      </footer>
    </main>
  );
}
