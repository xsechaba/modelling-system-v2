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

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        creator: { select: { name: true, email: true } },
        state: true,
      }
    });

    if (!project) {
      return new NextResponse('Not Found', { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse('User not found', { status: 404 });

    const data = await req.json();

    const project = await prisma.project.update({
      where: { id },
      data,
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        projectId: project.id,
        action: 'UPDATED_PROJECT',
        details: JSON.stringify(data),
      }
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return new NextResponse('User not found', { status: 404 });

    // Ensure they have permission to delete
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return new NextResponse('Not found', { status: 404 });
    }

    if (project.creatorId !== user.id) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.project.delete({
      where: { id },
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'DELETED_PROJECT',
        details: JSON.stringify({ projectId: project.id, projectName: project.name }),
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
