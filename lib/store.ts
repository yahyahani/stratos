import type { LogEntry } from '@/types';

// Singleton persisted across Next.js hot-reloads in dev
const g = globalThis as typeof globalThis & { __agentLogs?: LogEntry[] };
if (!g.__agentLogs) g.__agentLogs = [];
const logs = g.__agentLogs;

export function addLog(entry: LogEntry) {
  logs.unshift(entry);
  if (logs.length > 500) logs.pop();
}

export function getLogs(): LogEntry[] {
  return logs;
}

export function clearLogs() {
  logs.length = 0;
}
