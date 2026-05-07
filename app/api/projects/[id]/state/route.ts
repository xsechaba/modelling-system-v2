import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const state = await prisma.projectState.findUnique({
      where: { projectId: id },
    });

    if (!state) {
      // If no state exists, initialize one
      const newState = await prisma.projectState.create({
        data: {
          projectId: id,
          currentStep: 'upload',
          completedSteps: JSON.stringify([]),
          stateData: JSON.stringify({}),
        }
      });
      return NextResponse.json(newState);
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { currentStep, completedSteps, stateData } = await req.json();

    const state = await prisma.projectState.upsert({
      where: { projectId: id },
      update: {
        currentStep: currentStep ?? undefined,
        completedSteps: completedSteps ? JSON.stringify(completedSteps) : undefined,
        stateData: stateData ? JSON.stringify(stateData) : undefined,
      },
      create: {
        projectId: id,
        currentStep: currentStep || 'upload',
        completedSteps: JSON.stringify(completedSteps || []),
        stateData: JSON.stringify(stateData || {}),
      }
    });

    return NextResponse.json(state);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
