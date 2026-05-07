# dim-wiz Frontend & Backend Export

Copy everything below and paste it to the coding agent on your work laptop.

Prompt: *"Here are the fully updated and stabilized files for dim-wiz. We have fixed the backend API for CSV profiling, fixed caching errors, configured the middleware to bypass Next.js dev server crashes, and updated ALL of the wizard UI pages (including the database connection ingest pages, review, requirements, deployment, and export simulations). Please apply these precise structural additions and design updates to the existing codebase securely. Overwrite existing files securely with these new components."*

---
## `middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

```

## `next.config.mjs`

```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;

```

## `app/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Automated Dimensional Data Modeller Agent',
  description: 'Transform raw data into precise dimensional models with human-guided AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

```

## `app/page.tsx`

```typescript
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
          <a href="#" style={{ fontSize: '0.875rem', color: 'var(--color-white)', fontWeight: 500, textDecoration: 'none' }}>Log In</a>
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

```

## `app/globals.css`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

:root {
  --color-black: #050505;
  --color-black-light: #111111;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-green: #86BC25;
  --color-green-glow: rgba(134, 188, 37, 0.3);
  --color-green-muted: #6a951d;
  --color-white: #ffffff;
  --color-white-muted: rgba(255, 255, 255, 0.6);
  --color-glass: rgba(17, 17, 17, 0.6);
}

* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
  background-color: var(--color-black);
  color: var(--color-white);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6, .heading-font {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-weight: 500;
  letter-spacing: -0.03em;
}

a {
  color: inherit;
  text-decoration: none;
}

/* Utilities */
.glass-panel {
  background: var(--color-glass);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 16px;
}

.text-gradient {
  background: linear-gradient(180deg, var(--color-white) 0%, rgba(255, 255, 255, 0.5) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* Fallback */
}

.text-gradient-green {
  background: linear-gradient(90deg, var(--color-green) 0%, #d4ff8a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  color: transparent; /* Fallback */
}

.btn-primary {
  background: var(--color-green);
  color: var(--color-black);
  border: none;
  padding: 16px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-shadow: 0 0 20px rgba(134, 188, 37, 0.2);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(134, 188, 37, 0.4);
  background: #9add2b;
}

.btn-secondary {
  background: transparent;
  color: var(--color-white);
  border: 1px solid var(--color-border);
  padding: 16px 32px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.2);
}

.ambient-glow {
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--color-green-glow) 0%, rgba(134, 188, 37, 0) 70%);
  border-radius: 50%;
  pointer-events: none;
  z-index: -1;
  filter: blur(80px);
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

/* Layout */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

```

## `app/projects/page.tsx`

```typescript
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Folder, FolderPlus, Clock, GitBranch, Users, Settings, Database, Play } from 'lucide-react';

export default function ProjectsHome() {
  const [showNewProject, setShowNewProject] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#050505' }}>
      
      {/* App Header */}
      <nav style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(5, 5, 5, 0.8)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)' }}>dim-wiz</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 600 }}>SM</div>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '48px 32px', overflowY: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '48px' }}>
                  <div>
                      <h1 className="heading-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>Workspaces</h1>
                      <p style={{ color: 'var(--color-white-muted)' }}>Manage modeling sessions, repositories, and team access.</p>
                  </div>
                  <button onClick={() => setShowNewProject(!showNewProject)} className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.9375rem', borderRadius: '6px' }}>
                      <FolderPlus size={16} /> New Project
                  </button>
              </div>

              {showNewProject && (
                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-green)', borderRadius: '8px', padding: '32px', marginBottom: '48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-white)' }}>Initialize New Modeling Project</h3>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '32px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Project Name</label>
                                  <input type="text" placeholder="e.g. Sales Data Warehouse" style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} />
                              </div>
                              <div>
                                  <label style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={14}/> Access Control</label>
                                  <select style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }}>
                                      <option>Private (Only Me)</option>
                                      <option>Team (Data Engineering)</option>
                                      <option>Organization (All)</option>
                                  </select>
                              </div>
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              <div>
                                  <label style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={14}/> Target Git Repository</label>
                                  <input type="text" placeholder="corp-repo/retail-dbt-models" style={{ width: '100%', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                                  <button onClick={() => setShowNewProject(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', cursor: 'pointer' }}>Cancel</button>
                                  <Link href="/wizard/upload" className="btn-primary" style={{ flex: 1, textAlign: 'center', padding: '12px', borderRadius: '6px' }}>Start Session</Link>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '24px' }}>Recent Sessions</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
                  
                  {/* Project Card 1 */}
                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-muted)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', background: 'rgba(134,188,37,0.1)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Database size={20} color="var(--color-green)" />
                              </div>
                              <div>
                                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-white)' }}>retail-analytics-v1</h4>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Updated 2h ago</span>
                              </div>
                          </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={12} /> repo: my-org/retails-dbt</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={12} /> Access: Team Engine</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                          <Link href="/wizard/upload" style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', fontSize: '0.8125rem', borderRadius: '4px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <Play size={14} /> Resume Session
                          </Link>
                          <button style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Settings size={14} /></button>
                      </div>
                  </div>

                  {/* Project Card 2 */}
                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-white-muted)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Folder size={20} color="var(--color-white)" />
                              </div>
                              <div>
                                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-white)' }}>hr-master-schema</h4>
                                  <span style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12}/> Updated 2 days ago</span>
                              </div>
                          </div>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><GitBranch size={12} /> repo: my-org/hr-models</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={12} /> Access: Private</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                          <Link href="/wizard/upload" style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', fontSize: '0.8125rem', borderRadius: '4px', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                              <Play size={14} /> Resume Session
                          </Link>
                          <button style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'var(--color-white)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}><Settings size={14} /></button>
                      </div>
                  </div>

              </div>
          </div>
      </div>
    </div>
  );
}

```

## `app/wizard/layout.tsx`

```typescript
'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Box, Settings, Database, FolderGit2, Activity, ChevronRight, LayoutDashboard, TerminalSquare } from 'lucide-react';

const steps = [
  { id: 'upload', label: 'Ingest Data', path: '/wizard/upload' },
  { id: 'profile', label: 'Profiling', path: '/wizard/profile' },
  { id: 'requirements', label: 'Define Requirements', path: '/wizard/requirements' },
  { id: 'bus-matrix', label: 'Bus Matrix', path: '/wizard/bus-matrix' },
  { id: 'review', label: 'Schema Editor', path: '/wizard/review' },
  { id: 'export', label: 'Code Generation', path: '/wizard/export' },
  { id: 'deploy', label: 'Deploy', path: '/wizard/deploy' },
];

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentStepIndex = steps.findIndex(step => pathname?.includes(step.id));
  const activeIndex = currentStepIndex === -1 ? 0 : currentStepIndex;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#000000', color: 'var(--color-white)', overflow: 'hidden' }}>
      
      {/* Top Application Bar */}
      <nav style={{
        height: '50px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#050505',
        fontSize: '0.875rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Custom Minimalist Vector Logo */}
          <svg style={{marginRight: '4px'}} width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="2" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="2"/>
          </svg>
          <Link href="/" style={{ fontWeight: 700, letterSpacing: '-0.04em', textDecoration: 'none', color: 'var(--color-white)', fontSize: '1rem' }}>dim-wiz</Link>
          <span style={{ color: 'var(--color-white-muted)', marginLeft: '8px' }}>/</span>
          <span style={{ color: 'var(--color-white-muted)' }}>retail-analytics-v1</span>
          <span style={{ color: 'var(--color-white-muted)' }}>/</span>
          
          {/* Subtle Breadcrumb Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
            {steps.map((step, idx) => (
              <React.Fragment key={step.id}>
                <Link href={step.path} style={{
                  color: idx === activeIndex ? 'var(--color-green)' : (idx < activeIndex ? 'var(--color-white)' : 'var(--color-white-muted)'),
                  fontWeight: idx === activeIndex ? 500 : 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  fontSize: '0.8125rem'
                }}>
                  {idx === activeIndex && <div style={{width: 6, height: 6, borderRadius: '50%', background: 'var(--color-green)'}} />}
                  {step.label}
                </Link>
                {idx < steps.length - 1 && <ChevronRight size={14} color="var(--color-white-muted)" opacity={0.3} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--color-white-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', background: 'rgba(0,255,102,0.1)', color: 'var(--color-green)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(0,255,102,0.2)' }}>
            <Activity size={12} /> Live Session Active
          </div>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             SM
          </div>
        </div>
      </nav>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Real App IDE-like Sidebar */}
        <aside style={{
          width: '56px',
          borderRight: '1px solid var(--color-border)',
          background: '#050505',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '24px'
        }}>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', cursor: 'pointer' }}><LayoutDashboard size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><Database size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><FolderGit2 size={20} strokeWidth={1.5} /></button>
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><TerminalSquare size={20} strokeWidth={1.5} /></button>
          
          <div style={{ flex: 1 }} />
          <button style={{ background: 'transparent', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer' }}><Settings size={20} strokeWidth={1.5} /></button>
        </aside>

        {/* Main Interface */}
        <main style={{ flex: 1, position: 'relative', overflowY: 'auto', background: '#0a0a0a' }}>
          <div
            key={pathname}
            className="animate-fade-in"
            style={{ width: '100%', height: '100%' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}


```

## `app/wizard/deploy/page.tsx`

```typescript
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Cloud, Database, Clock, Terminal, CheckCircle2 } from 'lucide-react';

export default function DeployPage() {
  const [deployTarget, setDeployTarget] = useState('dbt');
  const [schedule, setSchedule] = useState('daily');
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);

  const handleDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployed(true);
    }, 3000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Schedule & Deploy</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Compile the agent's work into physical DDL and orchestrate the pipeline.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/wizard/review" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            <ArrowLeft size={14} /> Back to Schema
          </Link>
          <button 
            onClick={handleDeploy}
            disabled={deploying || deployed}
            className="btn-primary" 
            style={{ padding: '8px 16px', fontSize: '0.875rem', opacity: deploying || deployed ? 0.5 : 1 }}>
            {deploying ? 'Deploying...' : deployed ? 'Deployed Successfully' : 'Deploy Pipeline'} <Send size={14} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#050505', display: 'flex', gap: '24px' }}>
        
        {/* Left Col - Configurations */}
        <div style={{ flex: '1', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="var(--color-green)" /> Target Environment
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div 
                onClick={() => setDeployTarget('dbt')}
                style={{ border: `1px solid ${deployTarget === 'dbt' ? 'var(--color-green)' : 'var(--color-border)'}`, background: deployTarget === 'dbt' ? 'rgba(134,188,37,0.05)' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>dbt Cloud</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Generate dbt models and schema.yml files</div>
              </div>
              <div 
                onClick={() => setDeployTarget('snowflake')}
                style={{ border: `1px solid ${deployTarget === 'snowflake' ? 'var(--color-green)' : 'var(--color-border)'}`, background: deployTarget === 'snowflake' ? 'rgba(134,188,37,0.05)' : 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Snowflake</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Execute DDL and tasks directly in Snowflake</div>
              </div>
            </div>
            
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Connection Profile</label>
              <select style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }}>
                <option>production_dwh_conn (Active)</option>
                <option>staging_dwh_conn</option>
              </select>
            </div>
          </div>

          <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="var(--color-green)" /> Orchestration & Scheduling
            </h3>
            
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'daily'} onChange={() => setSchedule('daily')} /> Daily
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'hourly'} onChange={() => setSchedule('hourly')} /> Hourly
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="radio" name="schedule" checked={schedule === 'custom'} onChange={() => setSchedule('custom')} /> Custom Cron
               </label>
            </div>

            {schedule === 'daily' && (
               <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Time (UTC)</label>
                  <input type="time" defaultValue="02:00" style={{ padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', width: '150px', colorScheme: 'dark' }} />
               </div>
            )}
            
            {schedule === 'custom' && (
               <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Cron Expression</label>
                  <input type="text" placeholder="0 2 * * *" style={{ width: '100%', padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
               </div>
            )}
          </div>

        </div>

        {/* Right Col - Logs / Output */}
        <div style={{ flex: '1', display: 'flex', flexDirection: 'column' }}>
           <div style={{ background: '#000', border: '1px solid var(--color-border)', borderRadius: '8px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-black-light)' }}>
                 <Terminal size={14} color="var(--color-white-muted)" /> <span style={{ fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>Deployment Console</span>
              </div>
              <div style={{ padding: '16px', flex: 1, fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--color-green)', lineHeight: 1.6, overflowY: 'auto' }}>
                 {!deploying && !deployed && (
                    <div style={{ color: 'var(--color-white-muted)' }}>Waiting to deploy...</div>
                 )}
                 {deploying && (
                    <>
                       <div>{'>'} Compiling logical schema to target dialect... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Generating dbt models...</div>
                       <div style={{ color: 'var(--color-white-muted)', paddingLeft: '16px' }}>- fact_retail_sales.sql</div>
                       <div style={{ color: 'var(--color-white-muted)', paddingLeft: '16px' }}>- dim_store.sql</div>
                       <div style={{ color: 'var(--color-white-muted)', paddingLeft: '16px' }}>- dim_date.sql</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Connecting to Git repository... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing commit &apos;Auto-generated schema from DimWiz&apos;... [PENDING]</div>
                    </>
                 )}
                 {deployed && (
                    <>
                       <div>{'>'} Compiling logical schema to target dialect... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Generating dbt models... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Connecting to Git repository... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Pushing commit &apos;Auto-generated schema from DimWiz&apos;... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Creating Pull Request... [OK]</div>
                       <div style={{ marginTop: '8px' }}>{'>'} Registering Orchestration Job... [OK]</div>
                       
                       <div style={{ marginTop: '24px', background: 'rgba(134,188,37,0.1)', border: '1px solid var(--color-green)', padding: '16px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle2 size={24} color="var(--color-green)" />
                          <div>
                             <div style={{ fontWeight: 600, color: '#fff' }}>Successfully Deployed</div>
                             <div style={{ color: 'var(--color-white-muted)', marginTop: '4px' }}>Pipeline is now active and scheduled to run {schedule}.</div>
                          </div>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

```

## `app/wizard/requirements/page.tsx`

```typescript
'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Bot, Target, Send, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';


export default function RequirementsPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'To determine what dimensions and facts make up the Bus Matrix, I need your business requirements. Do you have any existing dashboard mockups, reporting specs, or KPI definition documents I can parse?' }
  ]);
  const [input, setInput] = useState('');
  const [showKPIs, setShowKPIs] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showKPIs]);

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setInput('');
    
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `I have parsed your requirement: "${input.substring(0, 30)}...". I've extracted the core KPIs. You can review and edit their formulas in the extraction panel on the right.` 
      }]);
      setShowKPIs(true);
    }, 1500);
  };

  const handleFileUpload = () => {
    setMessages(prev => [...prev, { role: 'user', content: '[Uploaded: Q3_Retail_Dashboard_Spec.pdf]' }]);
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Document processed. I identified 3 primary KPIs required for the Retail Dashboard. Review the extracted formulas on the right.` 
      }]);
      setShowKPIs(true);
    }, 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Define Requirements & KPIs</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Upload documents or chat with the agent to extract business rules before designing the Bus Matrix.</p>
        </div>
        <Link href="/wizard/bus-matrix" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
          Proceed to Bus Matrix <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Side: IDE Integrated Chat */}
        <div style={{ flex: 1, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          
          {/* Upload Drop Zone for Docs */}
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
             <button onClick={handleFileUpload} style={{ width: '100%', padding: '16px', border: '1px dashed var(--color-border)', borderRadius: '6px', background: 'transparent', color: 'var(--color-white-muted)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-green)'} onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}>
                <UploadCloud size={20} />
                <span style={{ fontSize: '0.8125rem' }}>Drop Dashboard Specs, PDFs, or Requirements Docs here</span>
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
                  {msg.role === 'assistant' && i === 0 && <span style={{display: 'block', color: 'var(--color-white-muted)', fontSize: '0.75rem', marginBottom: '8px'}}>DIMENSION AGENT</span>}
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div style={{ padding: '24px', background: 'var(--color-black)' }}>
            <div style={{ display: 'flex', gap: '12px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '12px 16px', borderRadius: '8px' }}>
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Or type a raw requirement (e.g., We need to track daily revenue per store...)"
                style={{
                  flex: 1, background: 'transparent', border: 'none', color: 'var(--color-white)',
                  fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit'
                }}
              />
              <button 
                onClick={handleSend}
                style={{
                  background: 'var(--color-white)', color: 'var(--color-black)', border: 'none', borderRadius: '4px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8125rem', fontWeight: 500
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
                     
                     <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: '#050505' }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Net Revenue</span>
                            <CheckCircle2 size={14} color="var(--color-green)" />
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '4px' }}>Formula (Editable)</div>
                                <input type="text" defaultValue="SUM(total_amount) - SUM(discounts)" style={{ width: '100%', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '8px', color: 'var(--color-white)', fontFamily: 'monospace', fontSize: '0.8125rem', borderRadius: '4px', outline: 'none' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <span style={{ fontSize: '0.65rem', background: 'rgba(134,188,37,0.1)', color: 'var(--color-green)', padding: '2px 6px', borderRadius: '4px' }}>Requires: total_amount</span>
                                <span style={{ fontSize: '0.65rem', background: 'rgba(134,188,37,0.1)', color: 'var(--color-green)', padding: '2px 6px', borderRadius: '4px' }}>Requires: time grain</span>
                            </div>
                        </div>
                     </div>

                     <div style={{ border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', background: '#050505' }}>
                        <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Return Rate</span>
                            <CheckCircle2 size={14} color="var(--color-green)" />
                        </div>
                        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', marginBottom: '4px' }}>Formula (Editable)</div>
                                <input type="text" defaultValue="COUNT(negative_transactions) / COUNT(all_transactions)" style={{ width: '100%', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '8px', color: 'var(--color-white)', fontFamily: 'monospace', fontSize: '0.8125rem', borderRadius: '4px', outline: 'none' }} />
                            </div>
                        </div>
                     </div>

                  </div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}

```

## `app/wizard/profile/page.tsx`

```typescript
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Search, CheckCircle2, FileText, Hash, Calendar, Key, BarChart2, Loader2, Database } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{ files: FileProfile[]; callouts: Callout[] } | null>(null);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('dimwiz_profile_results');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProfileData(data);
      } catch (e) {
        console.error('Failed to parse profile data:', e);
      }
    }
    // Simulate a brief processing delay for visual polish
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const activeFile = profileData?.files?.[activeFileIndex];
  const callouts = profileData?.callouts || [];

  const filteredColumns = activeFile?.columns.filter(col =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalMissing = activeFile
    ? (activeFile.columns.reduce((sum, c) => sum + c.missingPct, 0) / activeFile.columns.length).toFixed(1)
    : '0';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Data Understanding & Rules Profiler</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Deterministic, Kaggle-style structural analysis generated via automated parser rules. No AI utilized.</p>
        </div>
        <Link href="/wizard/requirements" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
          Define Requirements <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#050505' }}>
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
          <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '32px' }}>
            
            {/* Top Summary area - Callouts */}
            {callouts.length > 0 && (
              <div style={{ padding: '24px', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', marginBottom: '32px', flexShrink: 0 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-white)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={16} color="var(--color-green)" /> Key Profiling Callouts
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(callouts.length, 3)}, minmax(0, 1fr))`, gap: '16px' }}>
                  {callouts.map((callout, i) => {
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
            <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px', background: 'var(--color-black-light)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: `${filteredColumns.length * 250}px`, textAlign: 'left' }}>
                <thead>
                  <tr>
                    {filteredColumns.map((col, i) => {
                      const Icon = getColumnIcon(col.type);
                      return (
                        <th key={i} style={{ width: '250px', minWidth: '250px', padding: '16px', verticalAlign: 'top', borderBottom: '1px solid var(--color-border)', borderRight: i < filteredColumns.length - 1 ? '1px solid var(--color-border)' : 'none', background: 'var(--color-black)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '160px', fontWeight: 'normal' }}>
                            {/* Column Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--color-white)', fontSize: '0.875rem' }}>
                              <Icon size={14} color="var(--color-white-muted)" /> {col.name}
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

```

## `app/wizard/review/page.tsx`

```typescript
'use client';
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Database, Settings2, Trash2, Edit2 } from 'lucide-react';
import { ReactFlow, Background, Controls, Handle, Position, useNodesState, useEdgesState, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const DimNode = ({ data, selected }: any) => (
  <div style={{ width: '220px', background: 'var(--color-black)', border: selected ? '2px solid var(--color-white)' : '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-black-light)', borderBottom: '1px solid var(--color-border)' }}>
      <span style={{ fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-white)' }}>{data.label} <Edit2 size={12} style={{cursor: 'pointer', color: 'var(--color-white-muted)'}} /></span>
      <span style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-white)' }}>DIMENSION</span>
    </div>
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>
      {data.cols.map((c: string, i: number) => (
        <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between' }}>
           <span>{c.split(' ')[0]}</span>
           {c.includes('(PK)') && <span style={{ color: '#ffbd2e', fontSize: '0.65rem' }}>PK</span>}
        </div>
      ))}
    </div>
  </div>
);

const FactNode = ({ data, selected }: any) => (
  <div style={{ width: '260px', background: 'var(--color-black)', border: selected ? '2px solid var(--color-green)' : '1px solid var(--color-border)', borderRadius: '6px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
    <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    <div style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(134,188,37,0.1)', borderBottom: '1px solid rgba(134,188,37,0.2)' }}>
      <span style={{ fontWeight: 600, color: 'var(--color-green)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>{data.label} <Edit2 size={12} style={{cursor: 'pointer'}} /></span>
      <span style={{ fontSize: '0.65rem', background: 'rgba(134,188,37,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-green)' }}>FACT</span>
    </div>
    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--color-white)' }}>
      {data.cols.map((c: string, i: number) => {
        const parts = c.split(' ');
        const isFK = parts[1] === '(FK)';
        const isMetric = !isFK;
        return (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span>{parts[0]}</span>
            {isFK ? <span style={{ color: '#ffbd2e' }}>FK</span> : <span style={{ color: 'var(--color-white-muted)' }}>{parts[1]?.replace('(', '')?.replace(')', '')}</span>}
          </div>
        )
      })}
    </div>
  </div>
);

const nodeTypes = { dimNode: DimNode, factNode: FactNode };

const initialNodes = [
  { id: 'dim_store', type: 'dimNode', position: { x: 50, y: 350 }, data: { label: 'dim_store', cols: ['store_key (PK)', 'store_name', 'region'] } },
  { id: 'dim_date', type: 'dimNode', position: { x: 450, y: 50 }, data: { label: 'dim_date', cols: ['date_key (PK)', 'full_date', 'month_name'] } },
  { id: 'dim_product', type: 'dimNode', position: { x: 850, y: 50 }, data: { label: 'dim_product', cols: ['product_key (PK)', 'product_name', 'category'] } },
  { id: 'dim_warehouse', type: 'dimNode', position: { x: 850, y: 650 }, data: { label: 'dim_warehouse', cols: ['warehouse_key (PK)', 'location'] } },
  
  { id: 'fact_retail_sales', type: 'factNode', position: { x: 450, y: 250 }, data: { label: 'fact_retail_sales', cols: ['date_key (FK)', 'store_key (FK)', 'product_key (FK)', 'revenue (DECIMAL)', 'quantity (INT)'] } },
  { id: 'fact_store_inventory', type: 'factNode', position: { x: 450, y: 650 }, data: { label: 'fact_store_inventory', cols: ['date_key (FK)', 'store_key (FK)', 'product_key (FK)', 'warehouse_key (FK)', 'stock_level (INT)'] } },
  { id: 'fact_customer_returns', type: 'factNode', position: { x: 50, y: 650 }, data: { label: 'fact_customer_returns', cols: ['date_key (FK)', 'store_key (FK)', 'product_key (FK)', 'return_amount (DECIMAL)'] } },
];

const initialEdges = [
  { id: 'e-1', source: 'dim_store', target: 'fact_retail_sales', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-2', source: 'dim_date', target: 'fact_retail_sales', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-3', source: 'dim_product', target: 'fact_retail_sales', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },

  { id: 'e-4', source: 'dim_store', target: 'fact_store_inventory', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-5', source: 'dim_date', target: 'fact_store_inventory', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-6', source: 'dim_product', target: 'fact_store_inventory', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-7', source: 'dim_warehouse', target: 'fact_store_inventory', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },

  { id: 'e-8', source: 'dim_date', target: 'fact_customer_returns', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-9', source: 'dim_store', target: 'fact_customer_returns', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
  { id: 'e-10', source: 'dim_product', target: 'fact_customer_returns', animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } },
];

export default function ReviewPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedTable, setSelectedTable] = useState<string | null>('fact_retail_sales');

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 } }, eds)), [setEdges]);

  const onNodeClick = (event: any, node: any) => {
    setSelectedTable(node.id);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 className="heading-font" style={{ fontSize: '1.25rem' }}>Schema Editor Workspace</h1>
          <div style={{ display: 'flex', background: 'var(--color-black-light)', borderRadius: '4px', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <button style={{ background: 'var(--color-green)', padding: '6px 12px', border: 'none', borderRight: '1px solid var(--color-border)', color: '#000', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>Visual</button>
            <button style={{ background: 'transparent', padding: '6px 12px', border: 'none', color: 'var(--color-white-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>YAML Override</button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <Plus size={14}/> Add Custom Table
          </button>
          <Link href="/wizard/export" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Approve & Export <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative', background: '#080808', borderRight: '1px solid var(--color-border)' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
                className="dark"
            >
                <Background color="var(--color-border)" gap={40} size={1} />
                <Controls style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '4px' }} />
            </ReactFlow>
        </div>

        {/* Right Panel - Context & Properties */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', background: 'var(--color-black)', zIndex: 10 }}>
          
          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={16} /> <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Properties</span>
          </div>

          <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
             <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Selected Table</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ fontSize: '1rem', fontWeight: 600, color: selectedTable?.startsWith('fact') ? 'var(--color-green)' : 'var(--color-white)', display: 'flex', alignItems: 'center', gap: '8px', wordBreak: 'break-all' }}>
                    <Database size={16} /> {selectedTable || 'None'}
                 </div>
             </div>
          </div>

          <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
             {selectedTable?.startsWith('fact') && (
               <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Columns</span>
                      <span style={{ color: 'var(--color-green)', cursor: 'pointer' }}>+ Add</span>
                  </div>
                  
                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', marginBottom: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{fontWeight: 600}}>date_key</span><span style={{color: '#ffbd2e', cursor: 'pointer', display:'flex', alignItems:'center', gap:'4px'}}>Foreign Key <Edit2 size={10}/></span></div>
                    <div style={{ color: 'var(--color-white-muted)', fontSize: '0.75rem' }}>Links to dim_date</div>
                  </div>

                  <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '4px', padding: '8px 12px', marginBottom: '8px', fontSize: '0.8125rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}><span style={{fontWeight: 600}}>{selectedTable === 'fact_retail_sales' ? 'revenue' : 'stock_level'}</span><span style={{color: 'var(--color-green)', cursor: 'pointer', display:'flex', alignItems:'center', gap:'4px'}}>Measure <Edit2 size={10}/></span></div>
                    <div style={{ color: 'var(--color-white-muted)', fontSize: '0.75rem' }}>Core fact metric</div>
                  </div>
               </div>
             )}
          </div>

        </div>

      </div>
    </div>
  );
}

```

## `app/wizard/export/page.tsx`

```typescript
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Code, Download, FileJson, CheckCircle2, Copy, Terminal, ChevronRight, Folder } from 'lucide-react';

export default function ExportPage() {
  const [generating, setGenerating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setGenerating(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const dbtCode = `{{ config(
    materialized='incremental',
    unique_key='date_key'
) }}

WITH source_data AS (
    SELECT *
    FROM {{ source('raw_erp', 'sales_transactions') }}
),

fact_sales AS (
    SELECT 
        {{ dbt_utils.generate_surrogate_key(['transaction_date']) }} AS date_key,
        {{ dbt_utils.generate_surrogate_key(['product_id']) }} AS product_key,
        
        CAST(total_amount AS DECIMAL(18,2)) AS revenue,
        CAST(quantity AS INT) AS quantity
        
    FROM source_data
)

SELECT * FROM fact_sales`;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#050505' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 className="heading-font" style={{ fontSize: '1.25rem' }}>Compiler Output</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" style={{ padding: '6px 12px', gap: '8px', display: 'flex', fontSize: '0.8125rem' }}>
             <Download size={14} /> Output ZIP
          </button>
          <Link href="/wizard/deploy" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
            Schedule & Deploy <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Left Panel: File Explorer */}
        <div style={{ width: '260px', borderRight: '1px solid var(--color-border)', background: 'var(--color-black)', overflowY: 'auto' }}>
           <div style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>Project Explorer</div>
           
           <div style={{ padding: '0 16px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer' }}>
               <ChevronRight size={14} /> <Folder size={14} color="#ffbd2e" /> models
             </div>
             <div style={{ paddingLeft: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer' }}>
                  <ChevronRight size={14} /> <Folder size={14} color="#ffbd2e" /> marts
                </div>
                <div style={{ paddingLeft: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer', color: 'var(--color-green)', background: 'rgba(0,255,102,0.1)', margin: '0 -16px', paddingLeft: '16px', borderLeft: '2px solid var(--color-green)' }}>
                     <Code size={14} /> fact_sales.sql
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer', color: 'var(--color-white-muted)' }}>
                     <Code size={14} /> dim_date.sql
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '6px 0', cursor: 'pointer', color: 'var(--color-white-muted)' }}>
                     <FileJson size={14} /> _marts__models.yml
                   </div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Panel: Editor + Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#0a0a0a', position: 'relative' }}>
          
          {generating ? (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', zIndex: 10, background: '#0a0a0a' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-green)', animation: 'spin 1s linear infinite' }} />
              <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--color-white-muted)' }}>dbt compile --select fact_sales...</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Code Editor */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', height: '40px' }}>
                   <div style={{ padding: '0 16px', borderRight: '1px solid var(--color-border)', borderTop: '2px solid var(--color-green)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', background: '#0a0a0a' }}>
                     <Code size={14} color="var(--color-green)" /> fact_sales.sql
                   </div>
                </div>
                
                <div style={{ padding: '16px 0', display: 'flex' }}>
                   {/* Line numbers */}
                   <div style={{ width: '40px', textAlign: 'right', paddingRight: '16px', color: 'var(--color-border)', fontFamily: 'monospace', fontSize: '0.875rem', userSelect: 'none' }}>
                     {dbtCode.split('\n').map((_, i) => <div key={i}>{i+1}</div>)}
                   </div>
                   {/* Code content */}
                   <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.5, color: '#e0e0e0' }}>
                    <code>
                      {dbtCode.split('\n').map((line, i) => (
                        <div key={i} dangerouslySetInnerHTML={{ __html: line.replace(/\{\{/g, '<span style="color: #ffbd2e">{{').replace(/\}\}/g, '}}</span>').replace(/(SELECT|FROM|WITH|AS|CAST)/g, '<span style="color: #c678dd">$1</span>') }} />
                      ))}
                    </code>
                   </pre>
                </div>
              </div>

              {/* Terminal View */}
              <div style={{ height: '200px', borderTop: '1px solid var(--color-border)', background: '#050505', display: 'flex', flexDirection: 'column' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderBottom: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-white-muted)', textTransform: 'uppercase' }}>
                   <Terminal size={14} /> Output logs
                 </div>
                 <div style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-white-muted)', overflowY: 'auto', lineHeight: 1.6 }}>
                    <div style={{ color: 'var(--color-white)' }}>$ dbt compile --select state:modified</div>
                    <div>Running with dbt=1.7.0</div>
                    <div>Found 3 models, 4 tests, 2 sources...</div>
                    <div style={{ color: 'var(--color-green)', marginTop: '8px' }}>✔ Compiled node fact_sales successfully.</div>
                    <div style={{ color: 'var(--color-green)' }}>✔ Compiled node dim_date successfully.</div>
                    <div style={{ marginTop: '8px' }}>Ready for deployment or manual export.</div>
                 </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}

```

## `app/wizard/bus-matrix/page.tsx`

```typescript
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Grid, Plus, Check, X, Edit2, Trash2 } from 'lucide-react';

export default function BusMatrixPage() {
  const [matrix, setMatrix] = useState([
    { process: 'Retail Sales', dims: [true, true, true, false] },
    { process: 'Store Inventory', dims: [true, false, true, true] },
    { process: 'Customer Returns', dims: [true, true, true, false] }
  ]);
  const dimensions = ['Date', 'Product', 'Store', 'Warehouse'];

  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<number | null>(null);

  const toggleCell = (rIdx: number, cIdx: number) => {
    const newMatrix = [...matrix];
    newMatrix[rIdx].dims[cIdx] = !newMatrix[rIdx].dims[cIdx];
    setMatrix(newMatrix);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Enterprise Bus Matrix</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Align business processes (Facts) to Conformed Dimensions before generating the physical ERD.</p>
        </div>
        <Link href="/wizard/review" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem' }}>
          Generate Schema <ArrowRight size={14} />
        </Link>
      </div>

      <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: '#050505' }}>
        
        <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', overflow: 'hidden', maxWidth: '1000px', margin: '0 auto' }}>
            
            {/* Toolbar */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, fontSize: '0.9375rem' }}>
                    <Grid size={18} color="var(--color-green)" /> Conformed Dimensional Matrix
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Plus size={12}/> Add Process</button>
                    <button style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-white)', padding: '6px 12px', borderRadius: '4px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}><Plus size={12}/> Add Dimension</button>
                </div>
            </div>

            {/* Matrix Grid */}
            <div style={{ overflowX: 'auto' }}>
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
                                        <div style={{ display: 'flex', gap: '4px', opacity: hoveredCol === i ? 0.5 : 0, transition: 'opacity 0.2s' }}>
                                            <Edit2 size={12} style={{ cursor: 'pointer' }} />
                                            <Trash2 size={12} color="#ff5f56" style={{ cursor: 'pointer' }} />
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
                                        <div style={{ display: 'flex', gap: '8px', opacity: hoveredRow === rIdx ? 0.5 : 0, transition: 'opacity 0.2s' }}>
                                            <Edit2 size={14} style={{ cursor: 'pointer' }} />
                                            <Trash2 size={14} color="#ff5f56" style={{ cursor: 'pointer' }} />
                                        </div>
                                    </div>
                                </td>
                                {row.dims.map((isActive, cIdx) => (
                                    <td key={cIdx} style={{ borderRight: cIdx === dimensions.length -1 ? 'none' : '1px solid var(--color-border)', textAlign: 'center', padding: '0' }}>
                                        <button 
                                            onClick={() => toggleCell(rIdx, cIdx)}
                                            style={{ 
                                                width: '100%', height: '100%', minHeight: '60px', background: isActive ? 'rgba(134,188,37,0.1)' : 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
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

```

## `app/wizard/upload/page.tsx`

```typescript
'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, File, X, ArrowRight, Database, Plug, Plus, Search, Server, CheckSquare, Square, Loader2 } from 'lucide-react';

interface UploadedFile {
  file: File;
  name: string;
  size: string;
  status: 'ready' | 'profiling' | 'done';
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'database'>('upload');
  const [dbConnected, setDbConnected] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [profiling, setProfiling] = useState(false);

  const [dbTables, setDbTables] = useState([
    { name: 'public.users', selected: true },
    { name: 'public.transactions', selected: true },
    { name: 'public.stores', selected: true },
    { name: 'audit.logs', selected: false },
    { name: 'staging.raw_events', selected: false }
  ]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newFiles: UploadedFile[] = [];
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      // Only accept CSV files
      if (!f.name.endsWith('.csv')) continue;
      // Don't add duplicates
      if (uploadedFiles.some(u => u.name === f.name)) continue;
      newFiles.push({
        file: f,
        name: f.name,
        size: formatBytes(f.size),
        status: 'ready',
      });
    }
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    // Reset the input so re-selecting the same file works
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTable = (index: number) => {
    const newTables = [...dbTables];
    newTables[index].selected = !newTables[index].selected;
    setDbTables(newTables);
  };

  const handleRunProfiler = async () => {
    if (uploadedFiles.length === 0) return;
    setProfiling(true);
    setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'profiling' as const })));

    try {
      const formData = new FormData();
      for (const uf of uploadedFiles) {
        formData.append('files', uf.file);
      }

      const res = await fetch('/api/profile', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.error) {
        alert('Profiling error: ' + data.error);
        setProfiling(false);
        return;
      }

      // Store results in localStorage so the profile page can read them
      localStorage.setItem('dimwiz_profile_results', JSON.stringify(data));
      localStorage.setItem('dimwiz_uploaded_files', JSON.stringify(
        uploadedFiles.map(f => ({ name: f.name, size: f.size }))
      ));

      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'done' as const })));

      // Navigate to profiling page
      setTimeout(() => router.push('/wizard/profile'), 400);
    } catch (err: any) {
      alert('Failed to profile: ' + err.message);
      setProfiling(false);
    }
  };

  return (
    <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Workspace Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="heading-font" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Data Ingestion & Connectors</h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Upload sample datasets or establish live metadata connections to source systems.</p>
        </div>
        <button
          onClick={handleRunProfiler}
          disabled={uploadedFiles.length === 0 || profiling}
          className="btn-primary"
          style={{ 
            padding: '8px 16px', 
            fontSize: '0.875rem', 
            opacity: uploadedFiles.length === 0 || profiling ? 0.5 : 1,
            pointerEvents: uploadedFiles.length === 0 || profiling ? 'none' : 'auto',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {profiling ? (
            <>
              <Loader2 size={14} className="spin-icon" /> Profiling...
            </>
          ) : (
            <>
              Run Initial Profiler <ArrowRight size={14} />
            </>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Column - Active Sources */}
        <div style={{ flex: '1', borderRight: '1px solid var(--color-border)', padding: '24px 32px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white-muted)' }}>Configured Sources</h3>
            <div style={{ display: 'flex', background: 'var(--color-black-light)', border: '1px solid var(--color-border)', padding: '6px 12px', borderRadius: '4px', gap: '8px', alignItems: 'center' }}>
              <Search size={14} color="var(--color-white-muted)" />
              <input type="text" placeholder="Search sources..." style={{ background: 'transparent', border: 'none', color: 'var(--color-white)', fontSize: '0.8125rem', outline: 'none' }} />
            </div>
          </div>

          {uploadedFiles.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>
              <Database size={32} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <div>No sources configured yet.</div>
              <div style={{ fontSize: '0.8125rem', marginTop: '8px' }}>Upload CSV files using the panel on the right to begin profiling.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)', color: 'var(--color-white-muted)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Name</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Type</th>
                  <th style={{ textAlign: 'left', padding: '12px 0', fontWeight: 500 }}>Size</th>
                  <th style={{ textAlign: 'right', padding: '12px 0', fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {uploadedFiles.map((f, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <File size={14} color="var(--color-green)" /> {f.name}
                    </td>
                    <td style={{ padding: '16px 0', color: 'var(--color-white-muted)' }}>Local CSV</td>
                    <td style={{ padding: '16px 0', color: 'var(--color-white-muted)' }}>{f.size}</td>
                    <td style={{ padding: '16px 0', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        {f.status === 'profiling' ? (
                          <span style={{ background: 'rgba(255,189,46,0.1)', color: '#ffbd2e', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(255,189,46,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Loader2 size={10} className="spin-icon" /> Profiling
                          </span>
                        ) : f.status === 'done' ? (
                          <span style={{ background: 'rgba(0,255,102,0.1)', color: 'var(--color-green)', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(0,255,102,0.2)' }}>Profiled</span>
                        ) : (
                          <>
                            <span style={{ background: 'rgba(0,180,255,0.1)', color: '#00b4ff', padding: '2px 8px', borderRadius: '100px', fontSize: '0.75rem', border: '1px solid rgba(0,180,255,0.2)' }}>Ready</span>
                            <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center' }}>
                              <X size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right Column - New Source Form */}
        <div style={{ width: '400px', background: 'var(--color-black-light)', padding: '24px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-white-muted)', marginBottom: '16px' }}>Add Source</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
            <button 
                onClick={() => setActiveTab('upload')}
                style={{ background: 'var(--color-black)', border: `1px solid ${activeTab === 'upload' ? 'var(--color-green)' : 'var(--color-border)'}`, padding: '12px', borderRadius: '6px', color: activeTab === 'upload' ? 'var(--color-green)' : 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <UploadCloud size={20} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Upload File</span>
            </button>
            <button 
                onClick={() => setActiveTab('database')}
                style={{ background: 'var(--color-black)', border: `1px solid ${activeTab === 'database' ? 'var(--color-green)' : 'var(--color-border)'}`, padding: '12px', borderRadius: '6px', color: activeTab === 'database' ? 'var(--color-green)' : 'var(--color-white-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s' }}>
              <Plug size={20} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500 }}>Live DB</span>
            </button>
          </div>

          {activeTab === 'upload' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  style={{
                    border: `1px dashed ${dragActive ? 'var(--color-green)' : 'var(--color-border)'}`,
                    background: dragActive ? 'rgba(0,255,102,0.05)' : 'var(--color-black)',
                    borderRadius: '6px', padding: '32px 16px', textAlign: 'center', transition: 'all 0.2s', cursor: 'pointer'
                  }}
                >
                  <Plus size={24} color={dragActive ? 'var(--color-green)' : 'var(--color-white-muted)'} style={{ margin: '0 auto 12px' }} />
                  <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Drop CSV files here or click to browse</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)', opacity: 0.5, marginTop: '8px' }}>Supports .csv files</div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', fontSize: '0.8125rem' }}>
                    <div style={{ color: 'var(--color-green)', fontWeight: 600, marginBottom: '8px' }}>{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} queued</div>
                    <div style={{ color: 'var(--color-white-muted)' }}>Click &quot;Run Initial Profiler&quot; to parse and analyse your data.</div>
                  </div>
                )}
              </>
          )}

          {activeTab === 'database' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!dbConnected ? (
                      <div style={{ background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ marginBottom: '16px', fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>Configure connection to your live database.</div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8125rem' }}>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Engine</label>
                                  <select style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }}>
                                      <option>PostgreSQL</option>
                                      <option>Snowflake</option>
                                      <option>BigQuery</option>
                                      <option>SQL Server</option>
                                  </select>
                              </div>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Host</label>
                                  <input type="text" placeholder="db.internal.example.com" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              <div style={{ display: 'flex', gap: '12px' }}>
                                  <div style={{ flex: 1 }}>
                                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Port</label>
                                      <input type="text" placeholder="5432" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                                  </div>
                                  <div style={{ flex: 1 }}>
                                      <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Database</label>
                                      <input type="text" placeholder="analytics_prod" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                                  </div>
                              </div>
                              <div>
                                  <label style={{ display: 'block', marginBottom: '4px', color: 'var(--color-white-muted)' }}>Username / Role</label>
                                  <input type="text" placeholder="service_account" style={{ width: '100%', background: '#111', border: '1px solid var(--color-border)', color: '#fff', padding: '8px', borderRadius: '4px', outline: 'none' }} />
                              </div>
                              <button 
                                onClick={() => setDbConnected(true)}
                                style={{ background: 'var(--color-green)', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                                  Test & Connect
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div style={{ background: 'var(--color-black)', border: '1px solid var(--color-green)', borderRadius: '6px', padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)', marginBottom: '16px', fontSize: '0.875rem', fontWeight: 600 }}>
                              <Server size={16} /> Connected to PostgreSQL
                          </div>
                          
                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '12px' }}>
                              Select tables to import for profiling:
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '8px' }}>
                              {dbTables.map((table, i) => (
                                  <div key={i} onClick={() => toggleTable(i)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer' }}>
                                      {table.selected ? <CheckSquare size={16} color="var(--color-green)" /> : <Square size={16} color="var(--color-white-muted)" />}
                                      <Database size={14} color="var(--color-white-muted)" />
                                      <span style={{ fontSize: '0.8125rem', color: table.selected ? '#fff' : 'var(--color-white-muted)' }}>{table.name}</span>
                                  </div>
                              ))}
                          </div>

                          <button 
                            onClick={() => setDbConnected(false)}
                            style={{ width: '100%', background: '#fff', color: '#000', border: 'none', padding: '10px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer', marginTop: '16px' }}>
                              Import Selected Tables
                          </button>
                      </div>
                  )}
              </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}

```

## `app/api/profile/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';

// ---- helpers ----

function inferType(values: string[]): { type: string; label: string; color: string; bgColor: string } {
  const sample = values.filter(v => v !== '' && v != null).slice(0, 200);
  if (sample.length === 0) return { type: 'text', label: 'TEXT', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };

  // check for dates: yyyy-mm-dd or mm/dd/yyyy etc.
  const datePattern = /^\d{4}[-/]\d{2}[-/]\d{2}$/;
  const dateCount = sample.filter(v => datePattern.test(v.trim())).length;
  if (dateCount / sample.length > 0.8) return { type: 'date', label: 'DATE / TIME', color: '#ffbd2e', bgColor: 'rgba(255,189,46,0.1)' };

  // check for numeric
  const numCount = sample.filter(v => !isNaN(Number(v.trim())) && v.trim() !== '').length;
  if (numCount / sample.length > 0.8) return { type: 'numeric', label: 'NUMERIC', color: '#00b4ff', bgColor: 'rgba(0,180,255,0.1)' };

  // check for boolean-like
  const boolValues = new Set(sample.map(v => v.trim().toLowerCase()));
  if (boolValues.size <= 3 && Array.from(boolValues).every(v => ['yes', 'no', 'true', 'false', '0', '1', ''].includes(v))) {
    return { type: 'boolean', label: 'BOOLEAN', color: '#c084fc', bgColor: 'rgba(192,132,252,0.1)' };
  }

  // check for id / primary key (high uniqueness + pattern)
  const uniqueRatio = new Set(sample).size / sample.length;
  const idPattern = /^[A-Z]{1,3}\d{3,}$/;
  const idCount = sample.filter(v => idPattern.test(v.trim())).length;
  if (uniqueRatio > 0.95 && idCount / sample.length > 0.8) {
    return { type: 'id', label: 'ID / PRIMARY KEY', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
  }

  // check cardinality for categorical vs text
  const uniqueValues = new Set(sample).size;
  if (uniqueValues <= 30) return { type: 'categorical', label: 'CATEGORICAL', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };

  return { type: 'text', label: 'TEXT', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
}

function computeHistogram(numericValues: number[], bins: number = 12): number[] {
  if (numericValues.length === 0) return Array(bins).fill(0);
  let min = Infinity, max = -Infinity;
  for (const v of numericValues) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  if (min === max) return [100, ...Array(bins - 1).fill(0)];
  const binWidth = (max - min) / bins;
  const counts = Array(bins).fill(0);
  for (const v of numericValues) {
    const idx = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    counts[idx]++;
  }
  let maxCount = 0;
  for (const c of counts) { if (c > maxCount) maxCount = c; }
  return counts.map(c => maxCount > 0 ? Math.round((c / maxCount) * 100) : 0);
}

function getTopValues(values: string[], limit: number = 5): { value: string; count: number; pct: number }[] {
  const freq: Record<string, number> = {};
  const total = values.filter(v => v !== '' && v != null).length;
  for (const v of values) {
    if (v === '' || v == null) continue;
    freq[v] = (freq[v] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count, pct: Math.round((count / total) * 100) }));
}

function profileColumn(name: string, values: string[]) {
  const total = values.length;
  const missing = values.filter(v => v === '' || v == null || v.trim() === '').length;
  const missingPct = total > 0 ? ((missing / total) * 100) : 0;
  const nonEmpty = values.filter(v => v !== '' && v != null && v.trim() !== '');
  const uniqueValues = new Set(nonEmpty);
  const uniqueCount = uniqueValues.size;
  const uniquePct = nonEmpty.length > 0 ? ((uniqueCount / nonEmpty.length) * 100) : 0;

  const typeInfo = inferType(values);

  const result: any = {
    name,
    type: typeInfo.type,
    typeLabel: typeInfo.label,
    typeColor: typeInfo.color,
    typeBgColor: typeInfo.bgColor,
    total,
    missing,
    missingPct: Math.round(missingPct * 10) / 10,
    uniqueCount,
    uniquePct: Math.round(uniquePct * 10) / 10,
    uniqueDisplay: uniqueCount > 1000 ? `${(uniqueCount / 1000).toFixed(1)}k` : String(uniqueCount),
  };

  // extra flags
  const flags: { label: string; color: string }[] = [];
  if (missingPct > 5) flags.push({ label: 'MISSING', color: '#ffbd2e' });
  if (typeInfo.type === 'numeric') {
    const nums = nonEmpty.map(Number).filter(n => !isNaN(n));
    const hasNegatives = nums.some(n => n < 0);
    if (hasNegatives) flags.push({ label: 'HAS NEGATIVES', color: '#ff5f56' });
  }
  if (uniquePct > 95 && total > 10) flags.push({ label: 'HIGH CARDINALITY', color: '#00b4ff' });
  result.flags = flags;

  // type-specific visualisation data
  if (typeInfo.type === 'numeric') {
    const nums = nonEmpty.map(Number).filter(n => !isNaN(n));
    let numMin = Infinity, numMax = -Infinity, numSum = 0;
    for (const n of nums) {
      if (n < numMin) numMin = n;
      if (n > numMax) numMax = n;
      numSum += n;
    }
    result.min = nums.length > 0 ? numMin : 0;
    result.max = nums.length > 0 ? numMax : 0;
    result.mean = nums.length > 0 ? Math.round((numSum / nums.length) * 100) / 100 : 0;
    result.histogram = computeHistogram(nums);
    result.minDisplay = result.min < 0 ? `-$${Math.abs(result.min)}` : (result.max > 100 ? `$${result.min}` : String(result.min));
    result.maxDisplay = result.max > 100 ? `$${result.max.toLocaleString()}` : String(result.max);
    // For non-dollar amounts just use raw values
    if (name.toLowerCase().includes('percent') || name.toLowerCase().includes('quantity') || name.toLowerCase().includes('qty') || name.toLowerCase().includes('id')) {
      result.minDisplay = String(result.min);
      result.maxDisplay = String(result.max);
    }
  } else if (typeInfo.type === 'date') {
    const sorted = nonEmpty.sort();
    result.dateMin = sorted[0] || '';
    result.dateMax = sorted[sorted.length - 1] || '';
    // Generate a simple monthly-ish distribution
    const monthBuckets: Record<string, number> = {};
    for (const v of nonEmpty) {
      const month = v.substring(0, 7); // YYYY-MM
      monthBuckets[month] = (monthBuckets[month] || 0) + 1;
    }
    const monthKeys = Object.keys(monthBuckets).sort();
    const monthCounts = monthKeys.map(k => monthBuckets[k]);
    const maxMC = monthCounts.reduce((a, b) => Math.max(a, b), 1);
    result.dateBars = monthCounts.map(c => Math.round((c / maxMC) * 100));
    result.dateLabels = [monthKeys[0]?.substring(5) || '', monthKeys[monthKeys.length - 1]?.substring(5) || ''];
  } else if (typeInfo.type === 'categorical' || typeInfo.type === 'boolean') {
    result.topValues = getTopValues(values);
  } else if (typeInfo.type === 'id') {
    result.visualization = 'distinct'; // 100% distinct pattern
  } else {
    // text — show valid/null split + top values
    result.topValues = getTopValues(values, 3);
    result.validPct = Math.round((1 - missingPct / 100) * 1000) / 10;
  }

  return result;
}

// ---- route handler ----

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files: { name: string; size: number; columns: any[]; rowCount: number; sampleRows: any[] }[] = [];

    for (const [key, value] of Array.from(formData.entries())) {
      if (typeof value === 'object' && value !== null && typeof (value as any).text === 'function') {
        const blob = value as Blob & { name: string; size: number };
        const text = await blob.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data as Record<string, string>[];
        const headers = parsed.meta.fields || [];

        const columns = headers.map(h => {
          const values = rows.map(r => r[h] ?? '');
          return profileColumn(h, values);
        });

        // Take sample rows (first 15)
        const sampleRows = rows.slice(0, 15).map(row => {
          const clean: Record<string, string> = {};
          for (const h of headers) {
            clean[h] = row[h] ?? '';
          }
          return clean;
        });

        files.push({
          name: blob.name,
          size: blob.size,
          columns,
          rowCount: rows.length,
          sampleRows,
        });
      }
    }

    // Generate callouts (insights) from the profiled data
    const callouts: { title: string; description: string; severity: 'warning' | 'success' | 'error' }[] = [];
    for (const file of files) {
      for (const col of file.columns) {
        if (col.missingPct > 5) {
          callouts.push({
            title: `Missing Values in \`${col.name}\``,
            description: `\`${col.name}\` is missing in ${col.missingPct}% of records. This may impact dimension linkage quality.`,
            severity: 'warning',
          });
        }
        if (col.type === 'date' && col.uniqueCount > 30) {
          callouts.push({
            title: 'Date Grain Detected',
            description: `\`${col.name}\` has ${col.uniqueCount} unique date values spanning ${col.dateMin} to ${col.dateMax}. Strong candidate for a time dimension.`,
            severity: 'success',
          });
        }
        if (col.flags?.some((f: any) => f.label === 'HAS NEGATIVES')) {
          callouts.push({
            title: `Negative Values in \`${col.name}\``,
            description: `\`${col.name}\` contains negative values (min: ${col.min}). This may indicate returns or adjustments in the raw data.`,
            severity: 'error',
          });
        }
      }
    }
    // Limit to 3 most important callouts
    const sortedCallouts = callouts.sort((a, b) => {
      const order = { error: 0, warning: 1, success: 2 };
      return order[a.severity] - order[b.severity];
    }).slice(0, 3);

    return NextResponse.json({ files, callouts: sortedCallouts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

```

