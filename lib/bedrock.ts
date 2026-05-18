// lib/bedrock.ts — Universal Claude helper function via AWS Bedrock
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { awsConfig } from './aws';

const client = new BedrockRuntimeClient(awsConfig);

const MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

// A content block is either a plain text string or a multimodal array
// (Anthropic Messages API supports both forms)
type TextContent = string;
type ImageContent = { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };
type ContentBlock = TextContent | (Array<{ type: 'text'; text: string } | ImageContent>);

interface Message {
  role: 'user' | 'assistant';
  content: ContentBlock;
}

interface AskClaudeOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Send a single-turn request to Claude via Bedrock.
 * Use this for one-shot generation tasks (profile interpretation, schema generation, bus matrix).
 */
export async function askClaude(
  systemPrompt: string,
  userMessage: string,
  options: AskClaudeOptions = {}
): Promise<string> {
  const { maxTokens = 4096, temperature = 0.7 } = options;

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userMessage }
    ],
  });

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(body),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.content[0].text;
  } catch (error: any) {
    console.error('Bedrock invocation error:', error?.message || error);
    throw new Error(`AI Agent unavailable: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Send a multi-turn conversation to Claude via Bedrock.
 * Use this for chat agents (requirements chat, schema chat) that need conversation history.
 */
export async function chatWithClaude(
  systemPrompt: string,
  messages: Message[],
  options: AskClaudeOptions = {}
): Promise<string> {
  const { maxTokens = 4096, temperature = 0.7 } = options;

  // Anthropic API requires:
  // 1. The first message must be from 'user'.
  // 2. Roles must alternate strictly between 'user' and 'assistant'.
  let sanitizedMessages: Message[] = [];
  
  for (const msg of messages) {
    if (sanitizedMessages.length === 0) {
        if (msg.role === 'assistant') {
            // Prepend a dummy user message if the first message is assistant
            sanitizedMessages.push({ role: 'user', content: 'Hello.' });
        }
        sanitizedMessages.push(msg);
    } else {
        const lastMsg = sanitizedMessages[sanitizedMessages.length - 1];
        if (lastMsg.role === msg.role) {
            // Combine consecutive messages of the same role
            // Only combine if both are plain strings (can't merge multimodal blocks)
            if (typeof lastMsg.content === 'string' && typeof msg.content === 'string') {
              lastMsg.content += `\n\n${msg.content}`;
            } else {
              // For multimodal, insert a neutral turn to maintain alternation
              const bridgeRole = lastMsg.role === 'user' ? 'assistant' : 'user';
              sanitizedMessages.push({ role: bridgeRole, content: '...' });
              sanitizedMessages.push(msg);
            }
        } else {
            sanitizedMessages.push(msg);
        }
    }
  }

  // Ensure there's at least one message
  if (sanitizedMessages.length === 0) {
      sanitizedMessages.push({ role: 'user', content: 'Hello.' });
  }

  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: sanitizedMessages,
  });

  try {
    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: new TextEncoder().encode(body),
    });

    const response = await client.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    return responseBody.content[0].text;
  } catch (error: any) {
    console.error('Bedrock chat error:', error?.message || error);
    throw new Error(`AI Agent unavailable: ${error?.message || 'Unknown error'}`);
  }
}