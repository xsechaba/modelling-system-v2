import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';
import { extractJSON } from '@/lib/markdown';
import { getKnowledge, updateKnowledge } from '@/lib/knowledge';

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
    const requirements = knowledge.kpis ? JSON.stringify(knowledge.kpis) : 'No explicit KPIs defined.';
    const profilingContext = knowledge.profileResults ? JSON.stringify(knowledge.profileResults) : 'No profiling data available.';
    const matrixContext = JSON.stringify(busMatrix);
    
    const systemPrompt = `${PROMPTS.SCHEMA_GENERATOR}
    
=== GATHERED REQUIREMENTS (KPIs) ===
${requirements}

=== BUS MATRIX ===
${matrixContext}

=== UPLOADED DATA PROFILING CONTEXT ===
${profilingContext}
`;

    // Call AWS Bedrock for real generation
    const rawAiResponse = await askClaude(systemPrompt, 'Generate the physical star schema ERD now.');

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
    let dimCount = 0;
    let factCount = 0;

    if (schemaData.nodes) {
        schemaData.nodes.forEach((n: any) => {
            const isFact = n.type === 'fact';
            const x = isFact ? 150 + (factCount * 350) : 50 + (dimCount * 350);
            const y = isFact ? 400 + (factCount % 2 * 150) : 50;
            
            if (isFact) factCount++; else dimCount++;

            // Format cols as strings for ReactFlow custom node
            const cols = (n.columns || []).map((c: any) => {
                let suffix = '';
                if (c.isPrimaryKey) suffix = ' (PK)';
                else if (c.isForeignKey) suffix = ' (FK)';
                return `${c.name} ${c.type ? `(${c.type})` : ''}${suffix}`.trim();
            });

            nodes.push({
                id: n.id,
                type: isFact ? 'factNode' : 'dimNode',
                position: { x, y },
                data: { label: n.label || n.id, cols }
            });
        });
    }

    if (schemaData.edges) {
        schemaData.edges.forEach((e: any) => {
            edges.push({
                id: `e-${edgeIdCounter++}`,
                source: e.target, // ReactFlow connects from Parent(Dim) to Child(Fact) typically, but either works
                target: e.source,
                animated: true,
                label: e.cardinality || '1:M',
                labelBgStyle: { fill: '#1a1a1a', color: '#fff' },
                labelStyle: { fill: '#fff', fontWeight: 700, fontSize: 12 },
                style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }
            });
        });
    }

    const newSchemaHistory = [...(knowledge.schemaHistory || []), {
        timestamp: new Date().toISOString(),
        schema: { nodes, edges }
    }];

    await updateKnowledge(id, { schema: { nodes, edges }, schemaHistory: newSchemaHistory });

    return NextResponse.json({ nodes, edges });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
