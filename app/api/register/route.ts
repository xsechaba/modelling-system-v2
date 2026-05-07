import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return new NextResponse('Missing info', { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existingUser) {
      return new NextResponse('Email taken', { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword
      }
    });

    // Create a default organization for the user
    const org = await prisma.organization.create({
      data: {
        name: `${name}'s Workspace`,
        members: {
          create: {
            userId: user.id,
            role: 'ADMIN'
          }
        }
      }
    });

    // Create a sample project
    const project = await prisma.project.create({
      data: {
        name: 'Retail Analytics Demo',
        access: 'Team',
        creatorId: user.id,
        organizationId: org.id,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
