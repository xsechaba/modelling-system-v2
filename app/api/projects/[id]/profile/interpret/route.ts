import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { askClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { profileData } = await req.json();
    
    // Call AWS Bedrock for real AI interpretation
    const interpretation = await askClaude(
      PROMPTS.PROFILE_INTERPRETER,
      `Here is the profiling data for analysis:\n${JSON.stringify(profileData)}`
    );

    // Optionally update the project state with these insights so the Requirements Agent can read them later
    const projectState = await prisma.projectState.findUnique({ where: { projectId: id } });
    if (projectState) {
        let currentData: any = {};
        try {
            currentData = projectState.stateData ? JSON.parse(projectState.stateData) : {};
        } catch (e) {
            console.warn("Failed to parse stateData, initializing empty object");
        }
        currentData.aiInterpretation = interpretation;
        await prisma.projectState.update({
            where: { projectId: id },
            data: { stateData: JSON.stringify(currentData) }
        });
    }

    return NextResponse.json({ interpretation });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
