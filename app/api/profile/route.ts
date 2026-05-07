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
