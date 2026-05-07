'use client';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function DeleteProjectButton({ projectId, projectName }: { projectId: string, projectName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete ${projectName}? This action cannot be undone.`)) {
      setIsDeleting(true);
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          router.push('/projects');
          router.refresh();
        } else {
          alert('Failed to delete project.');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={isDeleting}
      style={{ 
        padding: '12px', 
        background: 'rgba(255, 95, 86, 0.1)', 
        color: '#ff5f56', 
        border: '1px solid #ff5f56', 
        borderRadius: '6px', 
        cursor: isDeleting ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <Trash2 size={20} /> {isDeleting ? 'Deleting...' : 'Delete Project'}
    </button>
  );
}
