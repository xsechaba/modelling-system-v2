import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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
    
    // Build context - prioritize banked requirements
    const bankedReqs = knowledge.bankedRequirements ? JSON.stringify(knowledge.bankedRequirements) : 'No banked requirements available.';
    const profilingContext = knowledge.profileResults ? JSON.stringify(knowledge.profileResults) : 'No profiling data available.';
    
    const systemPrompt = `${PROMPTS.BUS_MATRIX_GENERATOR}
    
    === BANKED REQUIREMENTS (INPUT) ===
    ${bankedReqs}
    
    === SOURCE DATA PROFILING (CONTEXT) ===
    ${profilingContext}
    `;

    // Call AWS Bedrock for real generation
    const rawAiResponse = await askClaude(systemPrompt, 'Generate the bus matrix now.');

    // Parse the JSON
    let matrixData;
    const extractionResult = extractJSON(rawAiResponse);
    if (extractionResult) {
       matrixData = extractionResult.json;
    } else {
       // Fallback: try parsing the whole response if it's pure JSON
       try {
           matrixData = JSON.parse(rawAiResponse);
       } catch (e) {
           console.error("Failed to parse Claude bus matrix:", rawAiResponse);
           throw new Error("Failed to generate a valid bus matrix. Please try again.");
       }
    }

    // Save to state
    await updateKnowledge(id, { busMatrix: matrixData });

    return NextResponse.json(matrixData);
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}