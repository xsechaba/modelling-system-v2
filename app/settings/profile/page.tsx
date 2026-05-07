import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { User, Mail, Shield, Save } from "lucide-react";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    redirect("/auth/login");
  }

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
          <Link href="/projects" style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--color-white)', textDecoration: 'none' }}>dim-wiz</Link>
          <span style={{ color: 'var(--color-white-muted)', marginLeft: '8px' }}>/</span>
          <span style={{ color: 'var(--color-white-muted)' }}>Settings</span>
        </div>
      </nav>

      <div style={{ flex: 1, padding: '48px 32px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', gap: '48px' }}>
          
          {/* Settings Sidebar */}
          <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link href="/settings/profile" style={{ padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--color-white)', textDecoration: 'none', fontSize: '0.9375rem', fontWeight: 500 }}>
              Profile
            </Link>
            <Link href="/settings/security" style={{ padding: '10px 16px', color: 'var(--color-white-muted)', textDecoration: 'none', fontSize: '0.9375rem' }}>
              Security
            </Link>
            <Link href="/settings/organization" style={{ padding: '10px 16px', color: 'var(--color-white-muted)', textDecoration: 'none', fontSize: '0.9375rem' }}>
              Organization
            </Link>
          </div>

          {/* Main Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div>
              <h1 className="heading-font" style={{ fontSize: '2rem', marginBottom: '8px' }}>Your Profile</h1>
              <p style={{ color: 'var(--color-white-muted)' }}>Manage your personal account settings and preferences.</p>
            </div>

            <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 600 }}>
                  {user.name ? user.name.substring(0,2).toUpperCase() : 'U'}
                </div>
                <button style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', cursor: 'pointer', fontSize: '0.875rem' }}>
                  Upload Avatar
                </button>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color="var(--color-white-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      defaultValue={user.name || ''}
                      style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--color-black)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white)', outline: 'none' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="var(--color-white-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="email" 
                      defaultValue={user.email || ''}
                      disabled
                      style={{ width: '100%', padding: '12px 12px 12px 36px', background: '#111', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white-muted)', outline: 'none', cursor: 'not-allowed' }} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Role</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} color="var(--color-white-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      value="Organization Admin"
                      disabled
                      style={{ width: '100%', padding: '12px 12px 12px 36px', background: '#111', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-white-muted)', outline: 'none', cursor: 'not-allowed' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: '0.9375rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
