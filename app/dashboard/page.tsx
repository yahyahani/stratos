'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { LogEntry } from '@/types';

/* ── Helpers ── */
function formatDuration(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}
function formatRelative(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(iso).toLocaleDateString();
}
function formatTimeFull(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

type Filter = 'all' | 'tools' | 'no-tools';

/* ════════════════════ Page ═════════════════════ */
export default function DashboardPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');

  const fetchLogs = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch('/api/logs');
      setLogs(await res.json());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function handleClear() {
    if (!confirm('Clear all logs? This cannot be undone.')) return;
    await fetch('/api/logs', { method: 'DELETE' });
    setLogs([]);
    setSelected(null);
  }

  useEffect(() => {
    fetchLogs();
    const id = setInterval(() => fetchLogs(true), 5000);
    return () => clearInterval(id);
  }, [fetchLogs]);

  const filtered = useMemo(() => {
    if (filter === 'tools') return logs.filter((l) => l.toolCalls.length > 0);
    if (filter === 'no-tools') return logs.filter((l) => l.toolCalls.length === 0);
    return logs;
  }, [logs, filter]);

  const totalTools = logs.reduce((s, l) => s + l.toolCalls.length, 0);
  const avgMs = logs.length > 0 ? logs.reduce((s, l) => s + l.duration, 0) / logs.length : 0;

  const toolUsage = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => l.toolCalls.forEach((tc) => { map[tc.toolName] = (map[tc.toolName] ?? 0) + 1; }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [logs]);
  const maxToolCount = toolUsage[0]?.[1] ?? 1;

  return (
    <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Sidebar ── */}
      <aside className="sidebar w-56 shrink-0 flex flex-col overflow-y-auto">

        <div className="px-4 pt-5 pb-4">
          <p className="label-caps mb-3">Overview</p>
          <div className="space-y-2.5">
            <MiniStat icon="💬" label="Conversations" value={logs.length}        color="blue"    />
            <MiniStat icon="⚡" label="Tool Calls"    value={totalTools}         color="emerald" />
            <MiniStat icon="⏱" label="Avg Duration"  value={formatDuration(avgMs)} color="purple" />
          </div>
        </div>

        <SidebarDivider />

        <div className="px-4 py-4">
          <p className="label-caps mb-3">Tools Used</p>
          {toolUsage.length === 0 ? (
            <p className="text-[11px] fg-3">No tool calls yet</p>
          ) : (
            <div className="space-y-2.5">
              {toolUsage.map(([name, count]) => (
                <div key={name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 truncate mr-2">{name}</span>
                    <span className="text-[11px] fg-3 tabular-nums shrink-0">{count}×</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                      style={{ width: `${(count / maxToolCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <SidebarDivider />

        <div className="px-4 py-4">
          <p className="label-caps mb-3">Filter</p>
          <div className="space-y-0.5">
            {(
              [
                { value: 'all',      label: 'All conversations', count: logs.length },
                { value: 'tools',    label: 'Used tools',        count: logs.filter((l) => l.toolCalls.length > 0).length },
                { value: 'no-tools', label: 'No tools',          count: logs.filter((l) => l.toolCalls.length === 0).length },
              ] as { value: Filter; label: string; count: number }[]
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setFilter(opt.value); setSelected(null); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[12px] transition-all duration-150 ${
                  filter === opt.value
                    ? 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25'
                    : 'fg-2 hover-fg-1 hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <span>{opt.label}</span>
                <span className={`text-[10px] font-semibold tabular-nums px-1.5 py-0.5 rounded-full ${
                  filter === opt.value
                    ? 'bg-blue-500/15 text-blue-600 dark:text-blue-300'
                    : 'fg-3'
                }`}>
                  {opt.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1" />
        <SidebarDivider />

        <div className="px-4 py-4 space-y-2">
          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="btn-ghost w-full flex items-center justify-center gap-2 text-[12px] font-medium rounded-lg px-3 py-2
              fg-2 hover-fg-1 transition-colors disabled:opacity-50"
          >
            {refreshing ? <Spinner /> : <RefreshIcon />}
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="w-full flex items-center justify-center gap-2 text-[12px] font-medium rounded-lg px-3 py-2
              bg-red-50 border border-red-200 text-red-600
              dark:bg-red-500/8 dark:border-red-500/15 dark:text-red-400/80
              hover:bg-red-100 dark:hover:bg-red-500/14
              hover:border-red-300 dark:hover:border-red-500/25
              hover:text-red-700 dark:hover:text-red-300
              transition-all duration-150"
          >
            <TrashIcon />
            Clear Logs
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="panel-border-b flex items-center justify-between px-6 py-4 shrink-0">
          <div className="flex items-baseline gap-3">
            <h1 className="text-[15px] font-semibold fg-1">
              Agent Logs
            </h1>
            {filtered.length !== logs.length && (
              <span className="text-[11px] fg-3">
                Showing {filtered.length} of {logs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[12px] fg-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(52,211,153,0.7)]" />
            Auto-refreshes every 5s
          </div>
        </div>

        {/* Content grid */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* Log list */}
          <div className="panel-border-r w-72 shrink-0 flex flex-col overflow-hidden">
            <div className="panel-border-b px-4 py-2.5 flex items-center gap-2 shrink-0">
              <span className="label-caps">Conversations</span>
              {filtered.length > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {filtered.length}
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Spinner />
                  <span className="text-[11px] fg-3">Loading…</span>
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-1.5 text-center px-6">
                  <div className="text-xl opacity-40 mb-1">{logs.length === 0 ? '📭' : '🔍'}</div>
                  <p className="text-[12px] fg-3">
                    {logs.length === 0 ? 'No logs yet' : 'No matches for this filter'}
                  </p>
                  {logs.length === 0 && (
                    <p className="text-[11px] fg-3 opacity-60">Start chatting to see activity</p>
                  )}
                </div>
              ) : (
                filtered.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    active={selected?.id === log.id}
                    onClick={() => setSelected(log)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Detail pane */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="panel-border-b px-5 py-2.5 flex items-center gap-2 shrink-0">
              <span className="label-caps">Details</span>
              {selected && (
                <span className="text-[11px] fg-3">
                  {formatTimeFull(selected.timestamp)}
                </span>
              )}
            </div>

            <div className="overflow-y-auto flex-1 p-5">
              {!selected ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[240px] gap-2 text-center">
                  <div className="text-xl opacity-30 mb-1">←</div>
                  <p className="text-[12px] fg-3">
                    Select a conversation to inspect it
                  </p>
                </div>
              ) : (
                <DetailPane log={selected} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar pieces ── */
function SidebarDivider() {
  return <div className="mx-4 border-t divider" />;
}

function MiniStat({ icon, label, value, color }: {
  icon: string; label: string; value: string | number;
  color: 'blue' | 'emerald' | 'purple';
}) {
  const textColor = {
    blue:    'text-blue-600   dark:text-blue-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    purple:  'text-purple-600  dark:text-purple-400',
  }[color];
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <span className="text-[12px] fg-2">{label}</span>
      </div>
      <span className={`text-[13px] font-bold tabular-nums ${textColor}`}>{value}</span>
    </div>
  );
}

/* ── Log row ── */
function LogRow({ log, active, onClick }: { log: LogEntry; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 panel-border-b transition-all duration-150 relative ${
        active
          ? 'bg-blue-50 dark:bg-blue-500/[0.07] border-l-2 border-l-blue-500 pl-3.5'
          : 'hover:bg-slate-50 dark:hover:bg-white/[0.035]'
      }`}
    >
      <p className="text-[12px] font-medium fg-1 truncate mb-1.5 leading-snug">
        {log.userMessage}
      </p>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] fg-3">
          {formatRelative(log.timestamp)}
        </span>
        {log.toolCalls.length > 0 && (
          <span className="text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-full
            bg-blue-50 text-blue-600 border border-blue-200
            dark:bg-blue-500/12 dark:text-blue-400 dark:border-blue-500/20 uppercase">
            {log.toolCalls.length} tool{log.toolCalls.length > 1 ? 's' : ''}
          </span>
        )}
        <span className="text-[10px] fg-3 opacity-60 ml-auto">
          {formatDuration(log.duration)}
        </span>
      </div>
    </button>
  );
}

/* ── Detail pane ── */
function DetailPane({ log }: { log: LogEntry }) {
  return (
    <div className="space-y-4 animate-fade-in max-w-3xl">
      {/* Meta chips */}
      <div className="flex flex-wrap gap-1.5">
        <Chip color="indigo">{log.model}</Chip>
        <Chip color="slate">{formatDuration(log.duration)}</Chip>
        {log.toolCalls.length > 0 && (
          <Chip color="emerald">
            {log.toolCalls.length} tool call{log.toolCalls.length > 1 ? 's' : ''}
          </Chip>
        )}
      </div>

      <Section label="User">
        <div className="rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-500/10 dark:border-blue-500/20 px-3.5 py-2.5 text-[13px] fg-1 leading-relaxed">
          {log.userMessage}
        </div>
      </Section>

      {log.toolCalls.length > 0 && (
        <Section label={`Tool Calls (${log.toolCalls.length})`}>
          <div className="space-y-2">
            {log.toolCalls.map((tc) => (
              <div key={tc.id} className="rounded-xl border overflow-hidden
                border-emerald-200 bg-emerald-50/60
                dark:border-emerald-500/15 dark:bg-emerald-500/[0.04]">
                <div className="flex items-center gap-2 px-3.5 py-2 border-b border-emerald-100 dark:border-emerald-500/10">
                  <span className="font-mono text-[10px] font-bold tracking-widest uppercase
                    px-2 py-0.5 rounded-md
                    bg-emerald-100 text-emerald-700 border border-emerald-200
                    dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
                    {tc.toolName}
                  </span>
                  <span className="text-[10px] fg-3 ml-auto">
                    {new Date(tc.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="px-3.5 py-2.5 font-mono text-[11px] space-y-1.5 leading-relaxed">
                  <div className="flex gap-3">
                    <span className="fg-3 shrink-0 select-none w-6">IN</span>
                    <span className="text-amber-700 dark:text-yellow-300/90 break-all">
                      {JSON.stringify(tc.input)}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <span className="fg-3 shrink-0 select-none w-6">OUT</span>
                    <span className="text-teal-700 dark:text-cyan-300/90 break-all">
                      {tc.output}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section label="Assistant">
        <div className="glass rounded-xl px-3.5 py-2.5 text-[13px] fg-1 leading-relaxed whitespace-pre-wrap">
          {log.assistantMessage}
        </div>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="label-caps mb-1.5">{label}</div>
      {children}
    </div>
  );
}

function Chip({ children, color }: { children: React.ReactNode; color: 'indigo' | 'slate' | 'emerald' }) {
  const styles = {
    indigo:  'bg-indigo-50  border-indigo-200  text-indigo-700  dark:bg-indigo-500/10  dark:border-indigo-500/20  dark:text-indigo-400',
    slate:   'bg-slate-100  border-slate-200   dark:bg-white/[0.04]   dark:border-white/[0.08]   fg-2',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400',
  }[color];
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${styles}`}>
      {children}
    </span>
  );
}

/* ── Icons ── */
function Spinner() {
  return (
    <svg className="animate-spin w-3.5 h-3.5 text-indigo-500" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8a6 6 0 0 1 11.3-2.8M14 8a6 6 0 0 1-11.3 2.8" />
      <polyline points="14 3 14 7 10 7" /><polyline points="2 13 2 9 6 9" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 4 14 4" />
      <path d="M5 4V2h6v2" /><path d="M3 4l1 10h8l1-10" />
    </svg>
  );
}
