'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [data, setData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const callback = await signIn('credentials', {
      ...data,
      redirect: false,
    });

    if (callback?.error) {
      setError(callback.error);
      setLoading(false);
    }
    
    if (callback?.ok && !callback?.error) {
      router.push('/projects');
      router.refresh();
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', background: '#050505', color: 'var(--color-white)' }}>
      {/* Left side - Branding */}
      <div style={{ flex: 1, borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', background: 'radial-gradient(circle at 0% 0%, rgba(134,188,37,0.15) 0%, transparent 50%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M12 2L2 7.5V16.5L12 22L22 16.5V7.5L12 2Z" fill="var(--color-green)" fillOpacity="0.1" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 22V12" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L22 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <path d="M12 12L2 7.5" stroke="var(--color-green)" strokeWidth="1.5" strokeLinejoin="round" />
             <circle cx="12" cy="12" r="3" fill="#000" stroke="var(--color-green)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.04em' }}>dim-wiz</span>
        </div>
        
        <div>
          <h1 className="heading-font" style={{ fontSize: '3rem', lineHeight: 1.1, marginBottom: '24px' }}>
            Welcome back.
          </h1>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '1.125rem', maxWidth: '400px', lineHeight: 1.6 }}>
            Log in to continue building enterprise-grade dimensional models and dbt pipelines with AI.
          </p>
        </div>
        
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)' }}>
          © 2026 Dim-Wiz Platform. All rights reserved.
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px' }}>Log In to Your Account</h2>
          <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem', marginBottom: '32px' }}>
            Enter your email and password to access your workspaces.
          </p>

          <form onSubmit={loginUser} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--color-white-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="email" 
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  placeholder="you@company.com" 
                  style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>
                Password
                <Link href="/auth/forgot-password" style={{ color: 'var(--color-green)', textDecoration: 'none' }}>Forgot?</Link>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--color-white-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  type="password" 
                  value={data.password}
                  onChange={(e) => setData({ ...data, password: e.target.value })}
                  placeholder="••••••••" 
                  style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} 
                  required
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px', background: 'rgba(255, 95, 86, 0.1)', border: '1px solid #ff5f56', borderRadius: '6px', color: '#ff5f56', fontSize: '0.8125rem' }}>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="btn-primary" 
              style={{ padding: '12px', width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '0.9375rem', borderRadius: '6px', marginTop: '8px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Logging in...' : 'Log In'} <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-white-muted)' }}>
            Don't have an account? <Link href="/auth/signup" style={{ color: 'var(--color-green)', textDecoration: 'none', fontWeight: 600 }}>Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
