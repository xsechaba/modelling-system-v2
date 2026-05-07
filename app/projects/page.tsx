import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectsClient from "@/components/ProjectsClient";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/auth/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      projects: {
        orderBy: { updatedAt: 'desc' },
        include: { state: true }
      }
    }
  });

  if (!user) {
    redirect("/auth/login");
  }

  // Next.js passes serialized props to client components
  // so we stringify dates
  const projects = user.projects.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    state: p.state ? {
      ...p.state,
      updatedAt: p.state.updatedAt.toISOString()
    } : null
  }));

  return <ProjectsClient user={user} initialProjects={projects} />;
}
