import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getWeather } from '@/lib/weather';
import { getTime } from '@/lib/time';
import { addLog } from '@/lib/store';
import type { LogEntry, Message, ToolCall } from '@/types';
import { randomUUID } from 'crypto';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_weather',
    description:
      'Get current weather conditions for a city. Returns temperature (°C), wind speed (km/h), and a description of the weather.',
    input_schema: {
      type: 'object' as const,
      properties: {
        city: { type: 'string', description: 'City name, e.g. "Amsterdam", "Tokyo", "New York"' },
      },
      required: ['city'],
    },
  },
  {
    name: 'get_time',
    description:
      'Get the current local date and time in any city or timezone. Handles daylight saving time (DST) automatically.',
    input_schema: {
      type: 'object' as const,
      properties: {
        city: { type: 'string', description: 'City name, e.g. "Tokyo", "New York", "Amsterdam"' },
      },
      required: ['city'],
    },
  },
];

const SYSTEM_PROMPT = `You are Stratos, a helpful AI assistant with access to real-time tools.
- get_weather: current weather for any city
- get_time: current local time in any city (DST-aware)
Always use the appropriate tool when the user asks for live data. Be concise and conversational.`;

export async function POST(req: NextRequest) {
  const { messages }: { messages: Message[] } = await req.json();

  const startTime = Date.now();
  const toolCalls: ToolCall[] = [];
  const userMessage = messages[messages.length - 1].content;

  let anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let finalText = '';

  // Agentic loop — runs until end_turn or max iterations
  for (let i = 0; i < 10; i++) {
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      tools: TOOLS,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
    });

    if (response.stop_reason === 'end_turn') {
      for (const block of response.content) {
        if (block.type === 'text') finalText = block.text;
      }
      break;
    }

    if (response.stop_reason === 'tool_use') {
      // Keep the full assistant message (including thinking blocks) in history
      anthropicMessages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        let output: string;
        try {
          if (block.name === 'get_weather') {
            const { city } = block.input as { city: string };
            const data = await getWeather(city);
            output = JSON.stringify(data);
          } else if (block.name === 'get_time') {
            const { city } = block.input as { city: string };
            const data = await getTime(city);
            output = JSON.stringify(data);
          } else {
            output = JSON.stringify({ error: `Unknown tool: ${block.name}` });
          }
        } catch (err) {
          output = JSON.stringify({ error: String(err) });
        }

        toolCalls.push({
          id: block.id,
          toolName: block.name,
          input: block.input as Record<string, unknown>,
          output,
          timestamp: new Date().toISOString(),
        });

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: output,
        });
      }

      anthropicMessages.push({ role: 'user', content: toolResults });
      continue;
    }

    break;
  }

  const entry: LogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    userMessage,
    assistantMessage: finalText,
    toolCalls,
    model: 'claude-opus-4-8',
    duration: Date.now() - startTime,
  };
  addLog(entry);

  return NextResponse.json({ message: finalText, logId: entry.id });
}
