export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ToolCall {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output: string;
  timestamp: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  userMessage: string;
  assistantMessage: string;
  toolCalls: ToolCall[];
  model: string;
  duration: number;
}
