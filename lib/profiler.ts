/**
 * lib/profiler.ts — Shared column-profiling helpers
 *
 * Used by both the CSV upload profiler (/api/profile) and the live DB
 * profiler (/api/profile-db). A single source of truth for type inference
 * and statistics computation.
 *
 * Key improvements over the original per-route helpers:
 *  - Larger sample window (500 vs 200)
 *  - Column-name hints guide ambiguous cases
 *  - UUID / 32-char hex ID detection  (catches Olist customer_id, order_id, etc.)
 *  - ISO datetime detection           (catches "2018-08-06 22:29:24" timestamps)
 *  - Fixed-length numeric guard       (zip codes, postal codes → categorical, not numeric)
 *  - Currency-aware display           ($ prefix only for monetary column names)
 *  - stdDev + median on numeric cols
 *  - Outlier flag
 */

// ── Column-name hint regexes ───────────────────────────────────────────────

/** Columns whose names suggest they are IDs / surrogate keys */
const ID_NAME = /\b(id|key|uuid|guid|hash|token|ref|reference|sku|serial|barcode)\b/i;

/** Columns whose names suggest a date or timestamp */
const DATE_NAME = /\b(date|time|datetime|timestamp|created|updated|modified|_at|_on)\b/i;

/** Columns that look like geographic / telephone codes, NOT numeric measures */
const CODE_NAME = /\b(zip|postal|postcode|phone|fax|cep|prefix|area_code|phone_number|zipcode|zip_code)\b/i;

/** Columns that are likely monetary — only these get $ formatting */
const CURRENCY_NAME = /\b(price|cost|revenue|amount|value|payment|total|subtotal|fee|tax|discount|salary|wage|income|spend|budget|earning|freight)\b/i;

/** Columns whose names indicate a numeric measure (length, weight, height, count, etc.) */
const NUMERIC_NAME = /\b(length|lenght|width|height|depth|weight|volume|count|qty|quantity|score|rating|number|num|size|distance|duration|age|days|hours|minutes|seconds|installments|sequential)\b/i;

/** Columns that are strongly categorical by nature */
const CATEGORICAL_NAME = /\b(status|state|type|category|class|group|level|tier|gender|country|city|region|department|color|colour|size|segment|flag|channel|source|rating|grade|priority)\b/i;

// ── Date / Datetime patterns ───────────────────────────────────────────────

const DATE_PATTERNS: RegExp[] = [
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/,   // ISO datetime: 2018-08-06 22:29:24
  /^\d{4}[-/]\d{2}[-/]\d{2}$/,             // Date only:   2018-08-06 or 2018/08/06
  /^\d{2}[-/]\d{2}[-/]\d{4}$/,             // EU/US date:  06-08-2018 or 06/08/2018
];

// ── ID / Surrogate key patterns ────────────────────────────────────────────

const UUID_PAT     = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX32_PAT    = /^[0-9a-f]{16,64}$/i;       // 32-char lowercase hex (Olist IDs, MD5 hashes)
const ALPHA_ID_PAT = /^[A-Z]{1,6}[-_]?\d{3,}$/;  // ORD-12345, INV001, CUST_0042

// ──────────────────────────────────────────────────────────────────────────

export interface ColumnTypeInfo {
  type: 'id' | 'numeric' | 'date' | 'boolean' | 'categorical' | 'text';
  label: string;
  color: string;
  bgColor: string;
}

/**
 * Infer the semantic type of a column from its values and optional column name.
 * Uses a 500-row sample for type inference.
 */
export function inferType(values: string[], columnName = ''): ColumnTypeInfo {
  const sample = values.filter(v => v != null && v !== '').slice(0, 500);

  if (sample.length === 0) {
    return { type: 'text', label: 'TEXT', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
  }

  // ── 1. Date / Datetime ──────────────────────────────────────────────────
  const dateHits = sample.filter(v => DATE_PATTERNS.some(p => p.test(v.trim()))).length;
  const nameLooksDate = DATE_NAME.test(columnName);
  // Accept 70%+ match, or 40%+ with supportive column name
  if (dateHits / sample.length > 0.7 || (dateHits / sample.length > 0.4 && nameLooksDate)) {
    return { type: 'date', label: 'DATE / TIME', color: '#ffbd2e', bgColor: 'rgba(255,189,46,0.1)' };
  }

  // ── 2. ID / Primary-key patterns ───────────────────────────────────────
  const idHits = sample.filter(v => {
    const t = v.trim();
    return UUID_PAT.test(t) || HEX32_PAT.test(t) || ALPHA_ID_PAT.test(t);
  }).length;
  const uniqueRatio = new Set(sample).size / sample.length;
  const isHighCardinality = uniqueRatio > 0.9;
  const nameLooksId = ID_NAME.test(columnName);

  // Strong ID signal: pattern match on majority, or high-cardinality + name suggests ID
  if (idHits / sample.length > 0.7 || (isHighCardinality && nameLooksId)) {
    return { type: 'id', label: 'ID / PRIMARY KEY', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
  }

  // ── 3. Numeric (with postal / fixed-length code guard) ─────────────────
  const numericVals = sample.filter(v => v.trim() !== '' && !isNaN(Number(v.trim())));
  const numericRatio = numericVals.length / sample.length;

  if (numericRatio > 0.8) {
    const nameLooksCode = CODE_NAME.test(columnName);
    const nameLooksNumeric = NUMERIC_NAME.test(columnName);
    if (!nameLooksCode) {
      // Guard: if all numerics are exactly the same short length, treat as a code
      // (zip codes: all 5-digit; FIPS codes: all 5-digit; year: all 4-digit etc.)
      const lengths = numericVals.map(v => v.trim().length);
      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      const isFixedLen = maxLen === minLen && maxLen <= 5;

      // If column name strongly suggests numeric (e.g., "product_name_lenght"), override fixed-length guard
      if (!isFixedLen || nameLooksNumeric) {
        return { type: 'numeric', label: 'NUMERIC', color: '#00b4ff', bgColor: 'rgba(0,180,255,0.1)' };
      }
      // Fixed-length short numerics (zip, postcode) fall through to categorical
    }
    // Code column or fixed-length → fall through to categorical
  }

  // ── 4. Boolean ──────────────────────────────────────────────────────────
  const boolVals = new Set(sample.map(v => v.trim().toLowerCase()));
  if (
    boolVals.size <= 3 &&
    [...boolVals].every(v => ['yes', 'no', 'true', 'false', '0', '1', ''].includes(v))
  ) {
    return { type: 'boolean', label: 'BOOLEAN', color: '#c084fc', bgColor: 'rgba(192,132,252,0.1)' };
  }

  // ── 5. Categorical vs Text ───────────────────────────────────────────────
  const uniqueCount = new Set(sample).size;
  const nameLooksCategorical = CATEGORICAL_NAME.test(columnName);

  // Categorical if: few distinct values, OR very low ratio, OR column name strongly suggests it
  if (uniqueCount <= 50 || uniqueRatio < 0.05 || (uniqueCount <= 150 && nameLooksCategorical)) {
    return { type: 'categorical', label: 'CATEGORICAL', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
  }

  return { type: 'text', label: 'TEXT', color: 'var(--color-white)', bgColor: 'rgba(255,255,255,0.1)' };
}

/** Build a normalised histogram (0-100 scale) for a set of numeric values. */
export function computeHistogram(numericValues: number[], bins = 12): number[] {
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
    counts[Math.min(Math.floor((v - min) / binWidth), bins - 1)]++;
  }
  const maxCount = Math.max(...counts);
  return counts.map(c => maxCount > 0 ? Math.round((c / maxCount) * 100) : 0);
}

/** Return the most frequent values with their counts and percentages. */
export function getTopValues(
  values: string[],
  limit = 5
): { value: string; count: number; pct: number }[] {
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

/**
 * Profile a single column — returns a rich statistics object ready for the UI.
 * @param name   Column / field name (used for type-hint matching)
 * @param values Raw string values for every row
 */
export function profileColumn(name: string, values: string[]): Record<string, any> {
  const total = values.length;
  const missing = values.filter(v => v === '' || v == null || v.trim() === '').length;
  const missingPct = total > 0 ? (missing / total) * 100 : 0;
  const nonEmpty = values.filter(v => v !== '' && v != null && v.trim() !== '');
  const uniqueCount = new Set(nonEmpty).size;
  const uniquePct = nonEmpty.length > 0 ? (uniqueCount / nonEmpty.length) * 100 : 0;

  const typeInfo = inferType(values, name);

  const result: Record<string, any> = {
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

  // ── Flags ──────────────────────────────────────────────────────────────
  const flags: { label: string; color: string }[] = [];
  if (missingPct > 5) flags.push({ label: 'MISSING', color: '#ffbd2e' });
  if (uniquePct > 95 && total > 10) flags.push({ label: 'HIGH CARDINALITY', color: '#00b4ff' });

  if (typeInfo.type === 'numeric') {
    const nums = nonEmpty.map(Number).filter(n => !isNaN(n));
    if (nums.some(n => n < 0)) flags.push({ label: 'HAS NEGATIVES', color: '#ff5f56' });
    if (nums.length > 10) {
      const mean = nums.reduce((s, n) => s + n, 0) / nums.length;
      // Iterative max — avoids Math.max(...nums) stack overflow on large arrays
      let max = -Infinity;
      for (const n of nums) if (n > max) max = n;
      if (max > mean * 5) flags.push({ label: 'OUTLIERS', color: '#ff9900' });
    }
  }
  result.flags = flags;

  // ── Type-specific visualisation ────────────────────────────────────────
  if (typeInfo.type === 'numeric') {
    const nums = nonEmpty.map(Number).filter(n => !isNaN(n));

    if (nums.length > 0) {
      const sorted = [...nums].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const sum = sorted.reduce((s, n) => s + n, 0);
      const mean = sum / sorted.length;
      const variance = sorted.reduce((s, n) => s + (n - mean) ** 2, 0) / sorted.length;
      const stdDev = Math.sqrt(variance);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];

      result.min = min;
      result.max = max;
      result.mean   = Math.round(mean   * 100) / 100;
      result.median = Math.round(median * 100) / 100;
      result.stdDev = Math.round(stdDev * 100) / 100;
      result.histogram = computeHistogram(sorted);

      // Currency formatting ONLY for monetary column names
      const isCurrency = CURRENCY_NAME.test(name);
      const fmt = (n: number) =>
        isCurrency
          ? (n < 0 ? `-$${Math.abs(n).toLocaleString()}` : `$${n.toLocaleString()}`)
          : String(Math.round(n * 100) / 100);

      result.minDisplay = fmt(min);
      result.maxDisplay = fmt(max);
    } else {
      result.min = 0; result.max = 0; result.mean = 0; result.median = 0; result.stdDev = 0;
      result.histogram = Array(12).fill(0);
      result.minDisplay = '0'; result.maxDisplay = '0';
    }

  } else if (typeInfo.type === 'date') {
    const sorted = [...nonEmpty].sort();
    result.dateMin = sorted[0] || '';
    result.dateMax = sorted[sorted.length - 1] || '';

    // Monthly distribution bucketed on YYYY-MM prefix
    const monthBuckets: Record<string, number> = {};
    for (const v of nonEmpty) {
      const month = v.trim().substring(0, 7); // works for both date and datetime
      monthBuckets[month] = (monthBuckets[month] || 0) + 1;
    }
    const monthKeys = Object.keys(monthBuckets).sort();
    const monthCounts = monthKeys.map(k => monthBuckets[k]);
    const maxMC = Math.max(...monthCounts, 1);
    result.dateBars   = monthCounts.map(c => Math.round((c / maxMC) * 100));
    result.dateLabels = [
      monthKeys[0]?.substring(5) || '',
      monthKeys[monthKeys.length - 1]?.substring(5) || '',
    ];

  } else if (typeInfo.type === 'categorical' || typeInfo.type === 'boolean') {
    result.topValues = getTopValues(values);

  } else if (typeInfo.type === 'id') {
    result.visualization = 'distinct';

  } else {
    // text
    result.topValues = getTopValues(values, 3);
    result.validPct  = Math.round((1 - missingPct / 100) * 1000) / 10;
  }

  return result;
}
