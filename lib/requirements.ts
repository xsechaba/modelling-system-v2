/**
 * lib/requirements.ts
 * Shared utilities for handling banked requirements across the platform.
 */

export interface BankedRequirement {
  id: string;
  name: string;
  description: string;
  type: 'process' | 'dimension' | 'kpi' | 'rule';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Draft' | 'Finalized';
  logic?: string;
}

/**
 * Merges a new set of requirements into an existing set.
 * Deduplicates by name and updates existing ones if they share the same ID.
 */
export function mergeRequirements(existing: BankedRequirement[], incoming: BankedRequirement[]): BankedRequirement[] {
  const result = [...existing];

  incoming.forEach(newReq => {
    // Try to find by ID first
    const existingIndex = result.findIndex(r => r.id === newReq.id || r.name === newReq.name);
    
    if (existingIndex !== -1) {
      // Update existing
      result[existingIndex] = {
        ...result[existingIndex],
        ...newReq,
        // Preserve ID if name matched but ID was different
        id: result[existingIndex].id
      };
    } else {
      // Add new
      result.push({
        ...newReq,
        id: newReq.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      });
    }
  });

  return result;
}
