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

    const { message, isDocument } = await req.json();
    
    // Fetch project state for memory and profiling context
    const projectState = await prisma.projectState.findUnique({ where: { projectId: id } });
    if (!projectState) return new NextResponse('Project state not found', { status: 404 });

    const stateData = JSON.parse(projectState.stateData || "{}");
    const chatHistory = stateData.chatHistory || [
      { role: 'assistant', content: 'To determine what dimensions and facts make up the Bus Matrix, I need your business requirements. Do you have any existing dashboard mockups, reporting specs, or KPI definition documents I can parse?' }
    ];
    let existingKPIs = stateData.kpis || [];
    
    // Build context block for the system prompt
    const profilingContext = stateData.profileResults ? JSON.stringify(stateData.profileResults) : 'No profiling data available.';
    const aiInterpretation = stateData.aiInterpretation ? stateData.aiInterpretation : 'No interpretation available.';
    
    const systemPromptWithContext = `${PROMPTS.REQUIREMENTS_INTERVIEWER}
    
=== UPLOADED DATA PROFILING CONTEXT ===
${profilingContext}

=== AI PROFILING INTERPRETATION ===
${aiInterpretation}
`;

    // Add user message to history
    chatHistory.push({ role: 'user', content: message });

    // Format history for Bedrock (only user/assistant roles allowed)
    const formattedHistory = chatHistory.filter((msg: any) => msg.role === 'user' || msg.role === 'assistant');

    // Call AWS Bedrock for real AI chat response
    const rawAiResponse = await chatWithClaude(systemPromptWithContext, formattedHistory);

    // Parse out KPI JSON if Claude decided it's time to extract
    const extractionResult = extractJSON(rawAiResponse);
    let aiResponse = rawAiResponse;
    
    if (extractionResult) {
      aiResponse = extractionResult.remainingText;
      const extractedData = extractionResult.json;
      
      // Merge KPIs
      if (extractedData.kpis && Array.isArray(extractedData.kpis)) {
         const newKPIs = extractedData.kpis.map((k: any) => ({
           id: Date.now().toString() + Math.random().toString(),
           name: k.name,
           formula: k.formula,
           requires: [k.description]
         }));
         
         const newKpisFiltered = newKPIs.filter((nk: any) => !existingKPIs.some((ek: any) => ek.name === nk.name));
         existingKPIs = [...existingKPIs, ...newKpisFiltered];
      }
    }

    // Add assistant message to history
    chatHistory.push({ role: 'assistant', content: aiResponse });

    // Save back to state
    stateData.chatHistory = chatHistory;
    stateData.kpis = existingKPIs;
    
    await prisma.projectState.update({
        where: { projectId: id },
        data: { stateData: JSON.stringify(stateData) }
    });

    return NextResponse.json({ 
        response: aiResponse, 
        chatHistory,
        kpis: existingKPIs
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
