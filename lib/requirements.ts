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
 * Normalizes a requirement name for fuzzy matching.
 * Strips common prefixes/suffixes and lowercases so "Date Dimension", "dim_date", and "Date" all match.
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(dim_|fct_|fact_)/, '')       // strip table prefixes
    .replace(/\s*(dimension|fact|table)\s*/g, '') // strip common suffixes
    .replace(/[_\-\s]+/g, '')                // collapse separators
    .trim();
}

/**
 * Merges a new set of requirements into an existing set.
 * Deduplicates by ID, exact name, or normalized name to prevent duplicates
 * when Claude rephrases names (e.g. "Date" vs "Date Dimension").
 */
export function mergeRequirements(existing: BankedRequirement[], incoming: BankedRequirement[]): BankedRequirement[] {
  const result = [...existing];

  incoming.forEach(newReq => {
    const normalizedNew = normalizeName(newReq.name || '');
    
    // Try to find by ID first, then exact name, then normalized name
    const existingIndex = result.findIndex(r => 
      r.id === newReq.id || 
      r.name === newReq.name ||
      (r.type === newReq.type && normalizeName(r.name || '') === normalizedNew && normalizedNew.length > 0)
    );
    
    if (existingIndex !== -1) {
      // Update existing — but preserve user-managed fields (status, id)
      // so a "Finalized" requirement doesn't revert to "Draft" on re-extraction
      result[existingIndex] = {
        ...result[existingIndex],
        ...newReq,
        id: result[existingIndex].id,
        status: result[existingIndex].status,
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
