import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Webhook, Users, ShieldAlert, GitBranch, Save, Search, GitMerge } from "lucide-react";

export default async function ProjectSettings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    redirect("/projects");
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-page)', color: 'var(--color-white)' }}>
      {/* App Header */}
      <nav style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--color-glass)',
        borderBottom: '1px solid var(--color-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href={`/projects/${project.id}`} style={{ color: 'var(--color-white-muted)', display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '0.875rem' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <span style={{ color: 'var(--color-white-muted)', margin: '0 8px' }}>/</span>
          <span style={{ fontWeight: 600 }}>Project Settings</span>
        </div>
      </nav>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Sidebar Nav */}
        <div style={{ width: '260px', borderRight: '1px solid var(--color-border)', background: 'var(--color-black)', padding: '24px 16px' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-white-muted)', textTransform: 'uppercase', marginBottom: '16px', paddingLeft: '12px' }}>Advanced Settings</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <button style={{ background: 'rgba(134,188,37,0.1)', color: 'var(--color-green)', border: 'none', padding: '10px 12px', borderRadius: '6px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <Users size={16} /> Collaboration & Access
             </button>
             <button style={{ background: 'transparent', color: 'var(--color-white-muted)', border: 'none', padding: '10px 12px', borderRadius: '6px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <Webhook size={16} /> Webhooks & Events
             </button>
             <button style={{ background: 'transparent', color: 'var(--color-white-muted)', border: 'none', padding: '10px 12px', borderRadius: '6px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <ShieldAlert size={16} /> Impact Analysis Rules
             </button>
             <button style={{ background: 'transparent', color: 'var(--color-white-muted)', border: 'none', padding: '10px 12px', borderRadius: '6px', textAlign: 'left', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
               <GitBranch size={16} /> Git & CI/CD
             </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
           <div style={{ maxWidth: '800px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <div>
                   <h2 className="heading-font" style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Collaboration & Webhooks</h2>
                   <p style={{ color: 'var(--color-white-muted)', fontSize: '0.875rem' }}>Configure team access, event triggers, and schema impact analysis guardrails.</p>
                 </div>
                 <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Save size={14} /> Save Changes
                 </button>
              </div>

              {/* Collaboration Section */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="var(--color-green)" /> Team Access & Approvals
                 </h3>
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                       <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '8px' }}>Invite Team Members</label>
                       <div style={{ display: 'flex', gap: '12px' }}>
                          <input type="email" placeholder="email@company.com" style={{ flex: 1, padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }} />
                          <select style={{ padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none' }}>
                             <option>Editor</option>
                             <option>Viewer</option>
                             <option>Admin</option>
                          </select>
                          <button className="btn-secondary" style={{ padding: '0 16px' }}>Invite</button>
                       </div>
                    </div>
                    
                    <div style={{ marginTop: '16px', padding: '16px', borderTop: '1px solid var(--color-border)' }}>
                       <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--color-green)' }} />
                          <div>
                             <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Require Human-in-the-Loop Approvals</div>
                             <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Prevent AI from deploying schema changes directly without a human click.</div>
                          </div>
                       </label>
                    </div>
                 </div>
              </div>

              {/* Webhooks Section */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Webhook size={18} color="var(--color-green)" /> Webhook Endpoints
                 </h3>
                 <p style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '16px' }}>Trigger external actions when specific agentic events occur in this project.</p>
                 
                 <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                    <input type="url" placeholder="https://api.slack.com/webhook/..." style={{ flex: 1, padding: '10px', background: '#000', border: '1px solid var(--color-border)', color: '#fff', borderRadius: '4px', outline: 'none', fontFamily: 'monospace', fontSize: '0.8125rem' }} />
                    <button className="btn-secondary" style={{ padding: '0 16px' }}>Add Endpoint</button>
                 </div>

                 <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                    <thead>
                       <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left', color: 'var(--color-white-muted)' }}>
                          <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Event Trigger</th>
                          <th style={{ paddingBottom: '12px', fontWeight: 500 }}>Status</th>
                       </tr>
                    </thead>
                    <tbody>
                       <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 0' }}><code>schema.drift.detected</code></td>
                          <td><span style={{ color: 'var(--color-green)', background: 'rgba(0,255,102,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Active</span></td>
                       </tr>
                       <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '12px 0' }}><code>pipeline.deploy.success</code></td>
                          <td><span style={{ color: 'var(--color-green)', background: 'rgba(0,255,102,0.1)', padding: '2px 8px', borderRadius: '4px' }}>Active</span></td>
                       </tr>
                    </tbody>
                 </table>
              </div>

              {/* Impact Analysis */}
              <div style={{ background: 'var(--color-black-light)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '24px' }}>
                 <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitMerge size={18} color="var(--color-green)" /> Impact Analysis Guardrails
                 </h3>
                 <p style={{ fontSize: '0.8125rem', color: 'var(--color-white-muted)', marginBottom: '16px' }}>Control how strictly the agent protects downstream consumers (e.g. dashboards) during refactoring.</p>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                       <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--color-green)' }} />
                       <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Block Destructive Drops</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Prevent deleting columns that are actively queried by downstream BI tools.</div>
                       </div>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                       <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: 'var(--color-green)' }} />
                       <div>
                          <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Auto-Generate Deprecation Warnings</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-white-muted)' }}>Instead of dropping, rename to <code>_deprecated</code> and emit a webhook event.</div>
                       </div>
                    </label>
                 </div>
              </div>

           </div>
        </div>
      </div>
    </div>
  );
}
