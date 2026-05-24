// lib/markdown.ts — Clean renderer that converts AI text responses into styled HTML
// Strips raw markdown artifacts and applies our dark-theme design system.

/**
 * Converts AI-generated text into clean, styled HTML for rendering in the UI.
 * Handles: section headers, bullet points, inline code, bold text, newlines.
 */
export function renderAIResponse(text: string): string {
  if (!text) return '';

  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

    // Section headers (ALL CAPS lines on their own line)
    .replace(/^([A-Z][A-Z &\-\/]+)$/gm,
      '<div style="margin-top:24px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(134,188,37,0.3);font-size:0.8125rem;font-weight:700;color:#86BC25;letter-spacing:0.08em;">$1</div>')

    // Bold text: **text** → <strong>
    .replace(/\*\*(.*?)\*\*/g,
      '<strong style="color:var(--color-white);font-weight:600;">$1</strong>')

    // Inline code: `text` → styled chip
    .replace(/`([^`]+)`/g,
      '<code style="background:var(--bg-input);color:#86BC25;padding:2px 6px;border-radius:3px;font-family:monospace;font-size:0.8125rem;">$1</code>')

    // Bullet points: lines starting with - or •
    .replace(/^[\-•]\s+(.+)$/gm,
      '<div style="display:flex;gap:8px;margin-bottom:6px;line-height:1.6;"><span style="color:#86BC25;font-size:0.75rem;margin-top:4px;">●</span><span>$1</span></div>')

    // Numbered items: lines starting with 1. 2. etc.
    .replace(/^(\d+)\.\s+(.+)$/gm,
      '<div style="display:flex;gap:8px;margin-bottom:6px;line-height:1.6;"><span style="color:#86BC25;font-weight:600;font-size:0.8125rem;min-width:18px;">$1.</span><span>$2</span></div>')

    // Convert remaining double newlines to paragraph breaks
    .replace(/\n\n/g, '<div style="margin-top:12px;"></div>')

    // Convert remaining single newlines to line breaks
    .replace(/\n/g, '<br/>');

  return `<div style="font-size:0.875rem;line-height:1.7;color:var(--color-white-muted);">${html}</div>`;
}

/**
 * Extracts a JSON block from a mixed text+JSON AI response.
 * Looks for the first { and last } to extract the JSON portion.
 */

/**
 * Sanitize a JSON string that may contain literal newlines inside string values.
 * LLMs frequently output multi-line SQL/text that is invalid JSON.
 *
 * Strategy: try parsing as-is first. If that fails, replace ALL literal newlines
 * with spaces — JSON is whitespace-insensitive outside strings, and inside strings
 * literal newlines are invalid anyway (they should be \\n escape sequences).
 * This is always safe and handles every LLM formatting quirk in one pass.
 */
function sanitizeJsonString(raw: string): string {
  return raw.replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ');
}

function tryParseJSON(raw: string): any {
  // Pass 1: try raw
  try { return JSON.parse(raw); } catch {}
  // Pass 2: replace all literal newlines (handles multi-line SQL in string values)
  try { return JSON.parse(sanitizeJsonString(raw)); } catch {}
  // Pass 3: also strip trailing commas before ] or } (another common LLM mistake)
  try {
    const cleaned = sanitizeJsonString(raw).replace(/,(\s*[}\]])/g, '$1');
    return JSON.parse(cleaned);
  } catch {}
  return null;
}

export function extractJSON(text: string): { json: any; remainingText: string } | null {
  // Try to find a JSON block between markers (Banked Requirements)
  const bankMatch = text.match(/---BANKED_REQUIREMENTS---([\s\S]*?)---END_BANKED_REQUIREMENTS---/);
  if (bankMatch) {
    const json = tryParseJSON(bankMatch[1].trim());
    if (!json) { console.error('[extractJSON] Failed to parse BANKED_REQUIREMENTS block'); return null; }
    const remainingText = text.replace(/---BANKED_REQUIREMENTS---[\s\S]*?---END_BANKED_REQUIREMENTS---/, '').trim();
    return { json, remainingText };
  }

  // Try to find a JSON block between markers (Legacy KPIs)
  const markerMatch = text.match(/---KPI_EXTRACT---([\s\S]*?)---END_KPI_EXTRACT---/);
  if (markerMatch) {
    const json = tryParseJSON(markerMatch[1].trim());
    if (!json) { console.error('[extractJSON] Failed to parse KPI_EXTRACT block'); return null; }
    const remainingText = text.replace(/---KPI_EXTRACT---[\s\S]*?---END_KPI_EXTRACT---/, '').trim();
    return { json, remainingText };
  }

  // Try to find a raw JSON object
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  // Determine whether an array or object appears first in the text
  const hasArray = firstBracket !== -1 && lastBracket > firstBracket;
  const hasObject = firstBrace !== -1 && lastBrace > firstBrace;
  const arrayFirst = hasArray && (!hasObject || firstBracket < firstBrace);

  if (arrayFirst) {
    const jsonStr = text.substring(firstBracket, lastBracket + 1);
    const json = tryParseJSON(jsonStr);
    if (!json) return null;
    const before = text.substring(0, firstBracket).trim();
    const after = text.substring(lastBracket + 1).trim();
    const remainingText = [before, after].filter(Boolean).join('\n');
    return { json, remainingText };
  }

  if (hasObject) {
    const jsonStr = text.substring(firstBrace, lastBrace + 1);
    const json = tryParseJSON(jsonStr);
    if (!json) return null;
    const before = text.substring(0, firstBrace).trim();
    const after = text.substring(lastBrace + 1).trim();
    const remainingText = [before, after].filter(Boolean).join('\n');
    return { json, remainingText };
  }

  return null;
}
