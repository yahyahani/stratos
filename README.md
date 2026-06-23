<p align="center">
  <img src="public/logo.svg" width="72" height="72" alt="AI Agent Dashboard logo" />
</p>

<h1 align="center">AI Agent Dashboard</h1>

<p align="center">
  A Next.js 15 app that puts a Claude-powered AI agent in your browser.<br/>
  Ask questions in the chat, watch it call real tools, and inspect every interaction in the logs dashboard.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/Claude-claude--opus--4--8-7C3AED?logo=anthropic" alt="Claude claude-opus-4-8" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss" alt="Tailwind CSS 3" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?logo=docker" alt="Docker" />
</p>

---

## Features

**Tool calling with an agentic loop**
The agent uses `claude-opus-4-8` with adaptive thinking. When a question requires live data it calls the built-in `get_weather` tool (powered by Open-Meteo — no API key required), inspects the result, and decides whether to call more tools before writing a final answer. The loop runs server-side and supports up to 10 consecutive tool calls per turn.

**Logs dashboard**
Every conversation is stored in an in-memory log and shown in a three-column dashboard: a stats sidebar (total conversations, tool calls, average duration, tool usage breakdown with progress bars), a filterable log list, and a detail pane that shows the user message, each tool call with its input/output, and the assistant reply.

**Dark / light mode**
System preference is detected on first load. The toggle switches themes without a flash (an inline `<script>` in `<head>` sets the class before React hydrates). All colours are expressed as CSS custom properties so switching is instant and reliable:

| Token | Light | Dark | Contrast (WCAG) |
|-------|-------|------|-----------------|
| `--fg-1` | `#0f172a` | `#E8EEFF` | **17.1 : 1 AAA** |
| `--fg-2` | `#334155` | `#A8B8E0` | **9.9 : 1 AA** |
| `--fg-3` | `#64748b` | `#8B9CC8` | **4.5 : 1 AA** |

---

## Screenshots

| Dark mode | Light mode |
|-----------|------------|
| ![Chat in dark mode](docs/screenshots/chat-dark.png) | ![Chat in light mode](docs/screenshots/chat-light.png) |

---

## Setup

### 1. Prerequisites

- Node.js ≥ 20
- An [Anthropic API key](https://console.anthropic.com/)

### 2. Environment variables

Create `.env.local` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Run locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 4. Run with Docker

```bash
docker compose up --build
# → http://localhost:3000
```

The `ANTHROPIC_API_KEY` is read from `.env.local` at **runtime** — it is never baked into the image.

To stop the container:

```bash
docker compose down
```

---

## Project structure

```
app/
  api/
    chat/route.ts       # Agentic loop, tool execution, logging
    logs/route.ts       # GET / DELETE log store
  dashboard/page.tsx    # Logs dashboard with sidebar
  page.tsx              # Chat interface
  globals.css           # CSS custom properties, glassmorphism utilities
  layout.tsx            # Nav, ThemeProvider, no-flash theme script
components/
  ThemeProvider.tsx     # Context + localStorage persistence
  ThemeToggle.tsx       # Sun / moon button
lib/
  store.ts              # In-memory log store (globalThis singleton)
  weather.ts            # Open-Meteo geocoding + forecast
types/
  index.ts              # Message, ToolCall, LogEntry
public/
  logo.svg              # Project logo
Dockerfile              # Multi-stage build (deps → builder → runner)
docker-compose.yml      # Reads ANTHROPIC_API_KEY from .env.local
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, React 19) |
| AI | [Anthropic SDK](https://github.com/anthropics/anthropic-sdk-typescript) · model `claude-opus-4-8` |
| Weather | [Open-Meteo](https://open-meteo.com/) (free, no API key) |
| Styling | [Tailwind CSS 3](https://tailwindcss.com/) + CSS custom properties |
| Language | TypeScript 5 |
| Container | Docker (multi-stage, `output: 'standalone'`, non-root user) |
