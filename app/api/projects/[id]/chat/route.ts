import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { chatWithClaude, askClaude } from '@/lib/bedrock';
import { PROMPTS } from '@/lib/prompts';
import { mergeRequirements } from '@/lib/requirements';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { message, isDocument, forceExtract, imageData, imageMediaType, imageName, displayMessage } = await req.json();
    
    // Fetch project state for memory and profiling context
    const projectState = await prisma.projectState.findUnique({ where: { projectId: id } });
    if (!projectState) return new NextResponse('Project state not found', { status: 404 });

    const stateData = JSON.parse(projectState.stateData || '{}');
    const chatHistory = stateData.chatHistory || [
      { role: 'assistant', content: 'I am your **Business Analyst Agent**. Upload your transcripts or documents and I will extract and structure all requirements automatically.' }
    ];
    
    // Build context block for the system prompt
    const profilingContext = stateData.profileResults ? JSON.stringify(stateData.profileResults) : 'No profiling data available.';
    const aiInterpretation = stateData.aiInterpretation || 'No interpretation available.';
    
    const systemPromptWithContext = `${PROMPTS.REQUIREMENTS_INTERVIEWER}
    
=== UPLOADED DATA PROFILING CONTEXT ===
${profilingContext}

=== AI PROFILING INTERPRETATION ===
${aiInterpretation}
`;

    // Build the user content — plain text or multimodal (text + image)
    let userContent: any;
    if (imageData && imageMediaType) {
      userContent = [
        { type: 'image', source: { type: 'base64', media_type: imageMediaType, data: imageData } },
        { type: 'text', text: message || `[Uploaded Image: ${imageName || 'image'}] Please analyze this image for business requirements, KPIs, dimensions, and processes.` }
      ];
    } else {
      userContent = message;
    }

    // Add user message to history — store display label (not full file content) for chat rendering
    const storedUserMessage = imageData
      ? `[Uploaded Image: ${imageName || 'image'}] ${message || ''}`.trim()
      : (displayMessage || message);
    chatHistory.push({ role: 'user', content: storedUserMessage });

    // Build history for Bedrock — replace last entry with full content when a display label was stored
    const formattedHistory = chatHistory
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any, idx: number, arr: any[]) => {
        if (idx === arr.length - 1 && msg.role === 'user') {
          if (imageData) {
            // Replace stored text with multimodal content block for vision calls
            return { role: 'user', content: userContent };
          }
          if (displayMessage) {
            // Stored only a display label — send full document content to Claude
            return { role: 'user', content: message };
          }
        }
        return msg;
      });

    // ── PARALLEL CALLS ──────────────────────────────────────────────────────
    // Always run the conversational call.
    // Always run extraction so requirements stay in sync with every conversation turn.
    // Run modification handler only when the message contains modification keywords.
    const MODIFICATION_KEYWORDS = /\b(add|delete|remove|rename|update|change|modify|create new|insert|replace)\b/i;
    const isModificationCommand = MODIFICATION_KEYWORDS.test(message || '');

    // Build a text-only history for the extraction call (no base64 image payloads)
    // When a display label was stored, replace the last user entry with full document content
    const textOnlyHistory = chatHistory
      .filter((msg: any) => msg.role === 'user' || msg.role === 'assistant')
      .map((msg: any, idx: number, arr: any[]) => {
        if (idx === arr.length - 1 && msg.role === 'user' && displayMessage) {
          return { role: msg.role, content: message };
        }
        return { role: msg.role, content: typeof msg.content === 'string' ? msg.content : '[Image uploaded]' };
      });

    const [rawAiResponse, extractionRaw, modificationRaw] = await Promise.all([
      chatWithClaude(systemPromptWithContext, formattedHistory),
      // Always extract — requirements should sync on every turn, not just document uploads
      // Include profiling context so the extractor can identify dimensions/processes from column data
      chatWithClaude(
        `${PROMPTS.REQUIREMENTS_EXTRACTOR}\n\n=== SOURCE DATA PROFILING CONTEXT ===\n${profilingContext}\n\n=== AI PROFILING INTERPRETATION ===\n${aiInterpretation}`,
        [
          ...textOnlyHistory,
          { role: 'user', content: 'Extract all requirements from the above conversation now. Output ONLY the JSON array.' }
        ]
      ).catch((e: any) => {
          console.error('[chat/extract] Extraction call failed:', e?.message);
          return null;
        }),
      // Modification handler — runs only when message looks like a list modification command
      isModificationCommand
        ? askClaude(
            PROMPTS.REQUIREMENTS_MODIFIER,
            `CURRENT REQUIREMENTS:\n${JSON.stringify(stateData.bankedRequirements || [], null, 2)}\n\nUSER COMMAND: ${message}`
          ).catch((e: any) => {
            console.error('[chat/modify] Modification call failed:', e?.message);
            return null;
          })
        : Promise.resolve(null),
    ]);

    // ── PROCESS EXTRACTION RESULT ───────────────────────────────────────────
    let bankedRequirements: any[] = stateData.bankedRequirements || [];
    const reqsSnapshot = JSON.stringify(bankedRequirements);

    // ── APPLY MODIFICATION COMMANDS FIRST (before extraction merge) ─────────
    if (modificationRaw) {
      try {
        const cleanedMod = modificationRaw
          .replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
        const startMod = cleanedMod.indexOf('[');
        const endMod = cleanedMod.lastIndexOf(']');
        if (startMod !== -1 && endMod > startMod) {
          const ops = JSON.parse(cleanedMod.slice(startMod, endMod + 1));
          if (Array.isArray(ops) && ops.length > 0) {
            for (const op of ops) {
              if (op.op === 'delete' && op.id) {
                bankedRequirements = bankedRequirements.filter((r: any) => r.id !== op.id);
                console.log(`[chat/modify] Deleted requirement: ${op.id}`);
              } else if (op.op === 'add' && op.data) {
                const newReq = {
                  ...op.data,
                  id: op.data.id || `req-mod-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
                };
                bankedRequirements = mergeRequirements(bankedRequirements, [newReq]);
                console.log(`[chat/modify] Added requirement: ${newReq.name}`);
              } else if (op.op === 'update' && op.id && op.data) {
                bankedRequirements = bankedRequirements.map((r: any) =>
                  r.id === op.id ? { ...r, ...op.data, id: r.id, status: r.status } : r
                );
                console.log(`[chat/modify] Updated requirement: ${op.id}`);
              }
            }
          }
        }
      } catch (e) {
        console.error('[chat/modify] Failed to parse modification response:', e);
      }
    }

    // ── MERGE EXTRACTION RESULTS ────────────────────────────────────────────
    if (extractionRaw) {
      try {
        // The extractor prompt tells Claude to output ONLY JSON, so we can parse directly.
        // Try a few cleaning passes for safety.
        const cleaned = extractionRaw
          .replace(/```json\s*/gi, '').replace(/```\s*/g, '')  // strip code fences if any
          .trim();
        // Find the JSON array boundaries
        const start = cleaned.indexOf('[');
        const end = cleaned.lastIndexOf(']');
        if (start !== -1 && end > start) {
          const jsonStr = cleaned.slice(start, end + 1)
            .replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ') // flatten newlines in strings
            .replace(/,(\s*[}\]])/g, '$1'); // remove trailing commas
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            bankedRequirements = mergeRequirements(bankedRequirements, parsed);
            console.log(`[chat/extract] Extracted ${parsed.length} requirements, merged to ${bankedRequirements.length} total`);
          }
        }
      } catch (e) {
        console.error('[chat/extract] Failed to parse extraction response:', e);
        console.error('[chat/extract] Raw response was:', extractionRaw?.slice(0, 500));
      }
    }

    // ── COHERENCE TIMESTAMP ─────────────────────────────────────────────────
    // Track when requirements last changed so bus matrix and schema can detect staleness
    if (JSON.stringify(bankedRequirements) !== reqsSnapshot) {
      stateData.requirementsUpdatedAt = Date.now();
    }

    // ── SAVE STATE ──────────────────────────────────────────────────────────
    // Safety net: the BA agent sometimes still outputs inline JSON blocks despite prompt instructions.
    // These come in several formats: ---BANKED_REQUIREMENTS---, ---UPDATED_BANKED_REQUIREMENTS---, etc.
    // We must: 1) parse the JSON and apply it to bankedRequirements, 2) strip the block from the chat display.
    const INLINE_BLOCK_RE = /---[\w]*(?:BANKED_REQUIREMENTS|UPDATED_REQUIREMENTS|UPDATED_BANKED_REQUIREMENTS)---\s*([\s\S]*?)\s*---END[\w_]*---/g;
    let cleanedAiResponse = rawAiResponse;
    let inlineMatch: RegExpExecArray | null;
    while ((inlineMatch = INLINE_BLOCK_RE.exec(rawAiResponse)) !== null) {
      const blockContent = inlineMatch[1].trim();
      try {
        const startBracket = blockContent.indexOf('[');
        const endBracket = blockContent.lastIndexOf(']');
        if (startBracket !== -1 && endBracket > startBracket) {
          const jsonStr = blockContent.slice(startBracket, endBracket + 1)
            .replace(/\r\n/g, ' ').replace(/\r/g, ' ').replace(/\n/g, ' ')
            .replace(/,(\s*[}\]])/g, '$1');
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Replace the entire requirements list with the inline block (the agent curated it)
            bankedRequirements = parsed;
            stateData.requirementsUpdatedAt = Date.now();
            console.log(`[chat/inline-block] Parsed inline block with ${parsed.length} requirements`);
          }
        }
      } catch (e) {
        console.error('[chat/inline-block] Failed to parse inline requirements block:', e);
      }
      // Strip the entire block from the displayed response
      cleanedAiResponse = cleanedAiResponse.replace(inlineMatch[0], '').trim();
    }

    chatHistory.push({ role: 'assistant', content: cleanedAiResponse });
    stateData.chatHistory = chatHistory;
    stateData.bankedRequirements = bankedRequirements;

    await prisma.projectState.update({
      where: { projectId: id },
      data: { stateData: JSON.stringify(stateData) }
    });

    return NextResponse.json({
      response: rawAiResponse,
      chatHistory,
      bankedRequirements,
    });
  } catch (error: any) {
    console.error(error);
    return new NextResponse(error?.message || 'Internal Error', { status: 500 });
  }
}
