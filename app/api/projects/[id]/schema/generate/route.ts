import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';
import { extractJSON } from '@/lib/markdown';
import { getKnowledge, updateKnowledge, DEFAULT_TECHNICAL_CONFIG } from '@/lib/knowledge';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const knowledge = await getKnowledge(id);
    
    const busMatrix = knowledge.busMatrix;
    if (!busMatrix) {
        return new NextResponse('Bus Matrix not found. Complete previous step.', { status: 400 });
    }

    // Build context
    const requirements = knowledge.bankedRequirements
      ? JSON.stringify(knowledge.bankedRequirements)
      : knowledge.kpis
        ? JSON.stringify(knowledge.kpis)
        : 'No explicit requirements defined.';
    const profilingContext = knowledge.profileResults ? JSON.stringify(knowledge.profileResults) : 'No profiling data available.';
    const matrixContext = JSON.stringify(busMatrix);

    // ── Derive mandatory table names directly from the bus matrix ──────────
    // This enforces coherence: schema table names must match bus matrix process/dimension names.
    const tc = knowledge.technicalConfig || DEFAULT_TECHNICAL_CONFIG;
    const factPrefix = tc.factPrefix;
    const dimPrefix = tc.dimPrefix;
    const toSnakeCase = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    const processList: string[] = (busMatrix.matrix || []).map((r: any) => r.process);
    const dimensionList: string[] = busMatrix.dimensions || [];

    const factTableLines = processList
      .map((p: string) => `  "${p}"  →  ${factPrefix}${toSnakeCase(p)}`)
      .join('\n');
    const dimTableLines = dimensionList
      .map((d: string) => `  "${d}"  →  ${dimPrefix}${toSnakeCase(d)}`)
      .join('\n');

    // Build config instructions for the prompt
    const configInstructions = `
=== TECHNICAL CONFIGURATION (user-defined naming conventions) ===
- Fact table prefix: "${factPrefix}" (e.g. order_items → ${factPrefix}order_items)
- Dimension table prefix: "${dimPrefix}" (e.g. customer → ${dimPrefix}customer)
- Surrogate key suffix: "${tc.keySuffix}" (e.g. customer${tc.keySuffix})
- Surrogate key type: ${tc.surrogateKeyStrategy === 'integer' ? 'INT (auto-increment)' : tc.surrogateKeyStrategy === 'uuid' ? 'UUID' : 'VARCHAR(64) hash'}
- Include natural keys: ${tc.naturalKeyInclude ? 'YES — always include business key alongside surrogate' : 'NO — surrogate keys only'}
- Column naming style: ${tc.columnNamingStyle}
- Strip source prefixes from dimension columns: ${tc.stripSourcePrefixes ? 'YES' : 'NO'}
- SCD Type 2 columns: ${tc.scdType2Enabled ? 'YES — add effective_date, expiry_date, is_current to all dimensions' : 'NO — do not add SCD2 columns'}

IMPORTANT: Use these EXACT prefixes and suffixes in all generated table and column names. Override any defaults in the system prompt with these user-configured values.
`;

    const factTableLines = processList
      .map((p: string) => `  "${p}"  →  fct_${toSnakeCase(p)}`)
      .join('\n');
    const dimTableLines = dimensionList
      .map((d: string) => `  "${d}"  →  dim_${toSnakeCase(d)}`)
      .join('\n');
    
    const systemPrompt = `${PROMPTS.SCHEMA_GENERATOR}
${configInstructions}
=== BUS MATRIX — MANDATORY FACT TABLE NAMES (${processList.length} total) ===
Each bus matrix process MUST produce EXACTLY ONE fact table using these exact names:
${factTableLines}

=== BUS MATRIX — MANDATORY DIMENSION TABLE NAMES (${dimensionList.length} total) ===
Each bus matrix dimension MUST produce EXACTLY ONE dimension table using these exact names:
${dimTableLines}

DO NOT rename, combine, or add tables beyond this list. The number of fact tables MUST be ${processList.length}. The number of dimension tables MUST be ${dimensionList.length}.

=== BANKED REQUIREMENTS (KPIs, Processes, Dimensions, Rules — WITH FORMULAS) ===
${requirements}

=== BUS MATRIX (full JSON) ===
${matrixContext}

=== UPLOADED DATA PROFILING CONTEXT ===
${profilingContext}
`;

    // Call AWS Bedrock for real generation — schema JSON is large, needs higher token limit
    const rawAiResponse = await askClaude(systemPrompt, 'Generate the physical star schema ERD now.', { maxTokens: 16384 });

    let schemaData;
    const extractionResult = extractJSON(rawAiResponse);
    if (extractionResult) {
       schemaData = extractionResult.json;
    } else {
       try {
           schemaData = JSON.parse(rawAiResponse);
       } catch (e) {
           console.error("Failed to parse Claude schema:", rawAiResponse);
           throw new Error("Failed to generate a valid schema. Please try again.");
       }
    }

    // Adapt Claude's output to ReactFlow format
    const nodes: any[] = [];
    const edges: any[] = [];
    let edgeIdCounter = 1;

    // ── Build allowed table name sets from the bus matrix ────────────────────
    const allowedFacts = new Set(processList.map((p: string) => `${factPrefix}${toSnakeCase(p)}`));
    const allowedDims = new Set(dimensionList.map((d: string) => `${dimPrefix}${toSnakeCase(d)}`));
    const allowedIds = new Set([...allowedFacts, ...allowedDims]);

    // ── Filter out any tables Claude added that aren't in the bus matrix ────
    const allDefs = schemaData.nodes || [];
    const filteredDefs = allDefs.filter((n: any) => allowedIds.has(n.id));
    if (filteredDefs.length < allDefs.length) {
      const dropped = allDefs.filter((n: any) => !allowedIds.has(n.id)).map((n: any) => n.id);
      console.log(`[schema/generate] Dropped ${dropped.length} table(s) not in bus matrix:`, dropped);
    }

    // ── Filter edges to only reference allowed tables ───────────────────────
    const filteredEdges = (schemaData.edges || []).filter((e: any) =>
      allowedIds.has(e.source) && allowedIds.has(e.target)
    );

    // ── Classify nodes ──────────────────────────────────────────────────────
    const factDefs = filteredDefs.filter((n: any) => n.type === 'fact');
    const dimDefs  = filteredDefs.filter((n: any) => n.type === 'dimension' || n.type === 'dim');

    // ── Count how many facts each dim connects to (for shared vs specific) ─
    const dimFactLinks: Record<string, Set<string>> = {};
    dimDefs.forEach((d: any) => { dimFactLinks[d.id] = new Set(); });
    filteredEdges.forEach((e: any) => {
      const srcNode = filteredDefs.find((n: any) => n.id === e.source);
      const tgtNode = filteredDefs.find((n: any) => n.id === e.target);
      if (!srcNode || !tgtNode) return;
      if (srcNode.type === 'fact' && (tgtNode.type === 'dimension' || tgtNode.type === 'dim')) {
        dimFactLinks[tgtNode.id]?.add(srcNode.id);
      } else if ((srcNode.type === 'dimension' || srcNode.type === 'dim') && tgtNode.type === 'fact') {
        dimFactLinks[srcNode.id]?.add(tgtNode.id);
      }
    });

    const sharedDims = dimDefs.filter((d: any) => (dimFactLinks[d.id]?.size || 0) >= 2);
    const specificDims = dimDefs.filter((d: any) => (dimFactLinks[d.id]?.size || 0) < 2);

    // ── Node height estimation ─────────────────────────────────────────────
    const nodeH = (n: any) => 48 + (n.columns?.length || 4) * 33;
    const VPAD = 40;

    // ── Facts: center column ────────────────────────────────────────────────
    const FACT_X = 700;
    let factY = 100;
    factDefs.forEach((n: any) => {
      const cols = (n.columns || []).map((c: any) => {
        let suffix = '';
        if (c.isPrimaryKey) suffix = ' (PK)';
        else if (c.isForeignKey) suffix = ' (FK)';
        return `${c.name} ${c.type ? `(${c.type})` : ''}${suffix}`.trim();
      });
      nodes.push({
        id: n.id, type: 'factNode',
        position: { x: FACT_X, y: factY },
        data: { label: n.label || n.id, cols }
      });
      factY += nodeH(n) + VPAD + 120;
    });
    const totalFactH = factY - 100;

    // ── Shared dims: left column, vertically centered ──────────────────────
    const SHARED_X = 100;
    let sharedTotalH = sharedDims.reduce((h: number, d: any) => h + nodeH(d) + VPAD, -VPAD);
    let sharedY = 100 + Math.max(0, (totalFactH - sharedTotalH) / 2);
    sharedDims.forEach((n: any) => {
      const cols = (n.columns || []).map((c: any) => {
        let suffix = '';
        if (c.isPrimaryKey) suffix = ' (PK)';
        else if (c.isForeignKey) suffix = ' (FK)';
        return `${c.name} ${c.type ? `(${c.type})` : ''}${suffix}`.trim();
      });
      nodes.push({
        id: n.id, type: 'dimNode',
        position: { x: SHARED_X, y: sharedY },
        data: { label: n.label || n.id, cols }
      });
      sharedY += nodeH(n) + VPAD;
    });

    // ── Specific dims: right column ────────────────────────────────────────
    const SPECIFIC_X = 1300;
    let specY = 100;
    specificDims.forEach((n: any) => {
      const cols = (n.columns || []).map((c: any) => {
        let suffix = '';
        if (c.isPrimaryKey) suffix = ' (PK)';
        else if (c.isForeignKey) suffix = ' (FK)';
        return `${c.name} ${c.type ? `(${c.type})` : ''}${suffix}`.trim();
      });
      nodes.push({
        id: n.id, type: 'dimNode',
        position: { x: SPECIFIC_X, y: specY },
        data: { label: n.label || n.id, cols }
      });
      specY += nodeH(n) + VPAD;
    });

    if (filteredEdges.length > 0) {
        filteredEdges.forEach((e: any) => {
            const srcNode = nodes.find((n: any) => n.id === e.target);
            const tgtNode = nodes.find((n: any) => n.id === e.source);
            let sourceHandle = 'right';
            let targetHandle = 'left';
            if (srcNode?.position && tgtNode?.position) {
              if (tgtNode.position.x < srcNode.position.x) {
                sourceHandle = 'left';
                targetHandle = 'right';
              }
            }
            edges.push({
                id: `e-${edgeIdCounter++}`,
                source: e.target,
                target: e.source,
                sourceHandle,
                targetHandle,
                animated: true,
                label: e.cardinality || 'M:1',
                labelBgStyle: { fill: '#1a1a1a', color: '#fff' },
                labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 12 },
                style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 },
                markerEnd: { type: 'arrowclosed', width: 20, height: 20 }
            });
        });
    }

    const newSchemaHistory = [...(knowledge.schemaHistory || []), {
        timestamp: new Date().toISOString(),
        schema: { nodes, edges }
    }];

    await updateKnowledge(id, { schema: { nodes, edges }, schemaHistory: newSchemaHistory, schemaGeneratedAt: Date.now() });

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
