import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chatWithClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';
import { extractJSON } from '@/lib/markdown';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { message } = await req.json();
    
    const projectState = await prisma.projectState.findUnique({ where: { projectId: id } });
    if (!projectState) return new NextResponse('Project state not found', { status: 404 });

    const stateData = JSON.parse(projectState.stateData || "{}");
    if (!stateData.schema) {
        return new NextResponse('No schema to modify', { status: 400 });
    }

    // Convert ReactFlow schema back to standard format for Claude
    const claudeSchemaContext = {
      nodes: stateData.schema.nodes.map((n: any) => ({
        id: n.id,
        type: n.type === 'factNode' ? 'fact' : 'dimension',
        label: n.data.label,
        columns: n.data.cols.map((c: string) => {
          const isPK = c.includes('(PK)');
          const isFK = c.includes('(FK)');
          const nameMatch = c.match(/^([\w_]+)/);
          const typeMatch = c.match(/\(([\w\s,]+)\)/);
          return {
            name: nameMatch ? nameMatch[1] : c,
            type: typeMatch && !['PK','FK'].includes(typeMatch[1]) ? typeMatch[1] : 'VARCHAR',
            isPrimaryKey: isPK,
            isForeignKey: isFK
          };
        })
      })),
      edges: stateData.schema.edges.map((e: any) => ({
        source: e.target,
        target: e.source
      }))
    };

    const systemPrompt = `${PROMPTS.SCHEMA_CHAT}
    
=== CURRENT SCHEMA ===
${JSON.stringify(claudeSchemaContext, null, 2)}
`;

    // Chat history for schema agent
    if (!stateData.schemaChatHistory) stateData.schemaChatHistory = [];
    stateData.schemaChatHistory.push({ role: 'user', content: message });
    
    const formattedHistory = stateData.schemaChatHistory.filter((msg: any) => msg.role === 'user' || msg.role === 'assistant');

    // Call AWS Bedrock
    const rawAiResponse = await chatWithClaude(systemPrompt, formattedHistory);

    // Extract JSON and explanation
    let schemaData;
    let aiResponse = "I have updated the schema based on your request.";
    
    const extractionResult = extractJSON(rawAiResponse);
    if (extractionResult) {
       schemaData = extractionResult.json;
       aiResponse = extractionResult.remainingText.replace(/---EXPLANATION---/g, '').trim() || aiResponse;
    } else {
       // Fallback
       const parts = rawAiResponse.split('---EXPLANATION---');
       try {
           schemaData = JSON.parse(parts[0].trim());
           if (parts[1]) aiResponse = parts[1].trim();
       } catch (e) {
           console.error("Failed to parse Schema Chat JSON:", rawAiResponse);
           throw new Error("I couldn't safely update the schema based on that request. Could you be more specific?");
       }
    }

    // Re-adapt Claude's output to ReactFlow format
    const nodes: any[] = [];
    const edges: any[] = [];
    let edgeIdCounter = 1;
    let dimCount = 0;
    let factCount = 0;

    if (schemaData.nodes) {
        schemaData.nodes.forEach((n: any) => {
            const isFact = n.type === 'fact';
            // Try to preserve position if it existed, otherwise auto-layout
            const existingNode = stateData.schema.nodes.find((en: any) => en.id === n.id);
            const x = existingNode ? existingNode.position.x : (isFact ? 150 + (factCount * 350) : 50 + (dimCount * 350));
            const y = existingNode ? existingNode.position.y : (isFact ? 400 + (factCount % 2 * 150) : 50);
            
            if (!existingNode) { if (isFact) factCount++; else dimCount++; }

            const cols = (n.columns || []).map((c: any) => {
                let suffix = '';
                if (c.isPrimaryKey) suffix = ' (PK)';
                else if (c.isForeignKey) suffix = ' (FK)';
                return `${c.name} ${c.type && c.type !== 'VARCHAR' ? `(${c.type})` : ''}${suffix}`.trim();
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
                source: e.target, 
                target: e.source,
                animated: true,
                style: { stroke: 'rgba(255,255,255,0.3)', strokeWidth: 2 }
            });
        });
    }

    stateData.schema = { nodes, edges };
    stateData.schemaChatHistory.push({ role: 'assistant', content: aiResponse });

    await prisma.projectState.update({
        where: { projectId: id },
        data: { stateData: JSON.stringify(stateData) }
    });

    return NextResponse.json({ 
        response: aiResponse, 
        schema: stateData.schema 
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
