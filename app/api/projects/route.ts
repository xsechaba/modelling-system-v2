import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { name, access, repo, entryPath } = await req.json();

    if (!name) {
      return new NextResponse('Missing project name', { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        memberships: true
      }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    const organizationId = user.memberships[0]?.organizationId;

    const project = await prisma.project.create({
      data: {
        name,
        access,
        repo,
        creatorId: user.id,
        organizationId,
      }
    });

    // Initialize Knowledge Context based on Phase 2
    await prisma.projectState.create({
      data: {
        projectId: project.id,
        currentStep: entryPath === 'requirements-first' ? 'requirements' : 'upload',
        completedSteps: '[]',
        stateData: JSON.stringify({ entryPath: entryPath || 'data-first' })
      }
    });

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        projectId: project.id,
        action: 'CREATED_PROJECT',
        details: JSON.stringify({ name: project.name, access: project.access }),
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
