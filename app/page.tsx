'use client';

import Image from 'next/image';
import { useState, useRef, useEffect, FormEvent } from 'react';
import type { Message } from '@/types';

const SUGGESTIONS = [
  { icon: '🌧️', text: "What's the weather in Amsterdam?" },
  { icon: '🌸', text: "How's the weather in Tokyo right now?" },
  { icon: '🗽', text: 'Tell me about the weather in New York' },
  { icon: '🌍', text: 'Compare weather in London and Paris' },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setMessages((p) => [...p, { role: 'assistant', content: data.message }]);
    } catch {
      setMessages((p) => [
        ...p,
        { role: 'assistant', content: 'Something went wrong — check your API key in `.env.local` and try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <main className="flex flex-col relative" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Gradient mesh — only rendered in empty/hero state */}
      {messages.length === 0 && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="gradient-blob blob-1" />
          <div className="gradient-blob blob-2" />
          <div className="gradient-blob blob-3" />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-2xl mx-auto px-4 py-6">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center pt-14 pb-8 animate-fade-in">
              {/* Hero logo */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-600/10 dark:from-blue-500/20 dark:via-indigo-500/15 dark:to-purple-600/20 border border-white/60 dark:border-white/10 flex items-center justify-center shadow-[0_0_32px_rgba(99,102,241,0.18)] dark:shadow-[0_0_40px_rgba(99,102,241,0.30)] backdrop-blur-sm">
                  <Image src="/logo.svg" alt="Stratos" width={48} height={48} priority />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-white dark:border-[#07080F] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>

              <h1 className="text-3xl font-bold mb-2 fg-1 tracking-tight">
                Stratos
              </h1>
              <p className="text-[13px] fg-3 mb-8 max-w-sm">
                AI agent met live tool calling, powered by{' '}
                <span className="gradient-text font-semibold">claude-opus-4-8</span>
                {' '}— vraag naar het weer overal ter wereld
              </p>

              {/* Suggestion grid */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.text}
                    onClick={() => send(s.text)}
                    className="glass rounded-xl px-4 py-3 text-left text-[13px]
                      fg-2 hover-fg-1
                      hover-glow-blue transition-all duration-200
                      hover:bg-white dark:hover:bg-white/[0.06]"
                  >
                    <span className="mr-2 text-base">{s.icon}</span>
                    {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && <AgentAvatar />}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'btn-gradient text-white rounded-br-md'
                      : 'glass fg-1 rounded-bl-md'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && <UserAvatar />}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3 justify-start animate-fade-in">
                <AgentAvatar />
                <div className="glass rounded-2xl rounded-bl-md px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {[0, 1, 2].map((n) => (
                      <div
                        key={n}
                        className="bounce-dot w-1.5 h-1.5 rounded-full bg-gradient-to-b from-blue-400 to-indigo-500"
                        style={{ animation: 'bounce-dot 1.2s ease-in-out infinite', animationDelay: `${n * 160}ms` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="glass-nav px-4 py-3 relative z-10">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2.5 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about weather anywhere…"
            rows={1}
            className="glass-input flex-1 rounded-xl px-4 py-2.5 resize-none text-sm
              fg-1 placeholder-slate-400 dark:placeholder-[#4A5580]"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="btn-gradient text-white rounded-xl px-5 py-2.5 text-sm font-medium shrink-0"
          >
            Send
          </button>
        </form>
        <p className="max-w-2xl mx-auto mt-1.5 text-[11px] fg-3">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </main>
  );
}

function AgentAvatar() {
  return (
    <div className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]">
      AI
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="shrink-0 w-7 h-7 mt-0.5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/10">
      U
    </div>
  );
}
