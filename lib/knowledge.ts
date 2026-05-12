import { prisma } from './prisma';

export interface FileMetadata {
  filename: string;
  s3Key?: string;
  sizeBytes: number;
}

export interface ProfileResults {
  [key: string]: any;
}

export interface KPI {
  name: string;
  formula: string;
  description: string;
}

export interface DimensionSpec {
  name: string;
  sourceColumns: string[];
  description: string;
}

export interface BusinessRule {
  name: string;
  rule: string;
  description: string;
}

export interface KnowledgeContext {
  // Data knowledge
  uploadedFiles?: FileMetadata[];
  profileResults?: ProfileResults;
  aiInterpretation?: string;

  // Business knowledge
  chatHistory?: { role: string, content: string }[];
  kpis?: KPI[];
  dimensions?: DimensionSpec[];
  businessRules?: BusinessRule[];
  grain?: string;

  // Industry/template knowledge
  entryPath?: string;
  industryContext?: string;
  templateId?: string;

  // Structural knowledge
  busMatrix?: any;
  schema?: any;
  schemaHistory?: any[];

  // Output knowledge
  generatedCode?: any[];
}

export async function getKnowledge(projectId: string): Promise<KnowledgeContext> {
  const state = await prisma.projectState.findUnique({
    where: { projectId },
  });

  if (!state || !state.stateData) {
    return {};
  }

  try {
    return JSON.parse(state.stateData) as KnowledgeContext;
  } catch (e) {
    console.error("Failed to parse knowledge context", e);
    return {};
  }
}

export async function updateKnowledge(projectId: string, partial: Partial<KnowledgeContext>): Promise<KnowledgeContext> {
  const currentKnowledge = await getKnowledge(projectId);
  const updatedKnowledge = { ...currentKnowledge, ...partial };

  // Use an upsert since the project state might not exist yet
  await prisma.projectState.upsert({
    where: { projectId },
    create: {
      projectId,
      currentStep: 'upload', // Default step
      completedSteps: '[]',
      stateData: JSON.stringify(updatedKnowledge)
    },
    update: {
      stateData: JSON.stringify(updatedKnowledge)
    }
  });

  return updatedKnowledge;
}

export async function getKnowledgeSummary(projectId: string): Promise<string> {
  const k = await getKnowledge(projectId);
  
  let summary = `Project Knowledge Summary:\n\n`;
  
  if (k.entryPath) {
    summary += `- Entry Path: ${k.entryPath}\n`;
  }
  
  if (k.uploadedFiles && k.uploadedFiles.length > 0) {
    summary += `- Uploaded Data: ${k.uploadedFiles.length} files (${k.uploadedFiles.map(f => f.filename).join(', ')})\n`;
  } else {
    summary += `- Uploaded Data: None\n`;
  }

  if (k.kpis && k.kpis.length > 0) {
    summary += `- Defined KPIs: ${k.kpis.length} (${k.kpis.map(kpi => kpi.name).join(', ')})\n`;
  }

  if (k.busMatrix) {
    summary += `- Bus Matrix Generated: Yes\n`;
  }

  if (k.schema) {
    summary += `- Schema Generated: Yes (${k.schema.nodes?.length || 0} tables)\n`;
  }

  return summary;
}
