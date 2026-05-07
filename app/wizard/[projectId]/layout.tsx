import { prisma } from "@/lib/prisma";
import WizardLayoutClient from "@/components/WizardLayoutClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function WizardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return null; // Handled by middleware, but TS needs it
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { state: true },
  });

  if (!project) {
    return notFound();
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return (
    <WizardLayoutClient project={project} projectId={projectId} user={user}>
      {children}
    </WizardLayoutClient>
  );
}
