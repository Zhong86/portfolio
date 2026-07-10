# Portfolio Website — Zhong86

A terminal-themed personal portfolio built with Next.js (App Router), React, and Tailwind CSS. The whole site is styled like a code editor / terminal, complete with a sidebar file tree, a `tail -f`-style activity log, and an interactive command-line bar at the bottom of the screen.

## Tech Stack
- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **Storage:** Vercel KV (Upstash Redis) for logs and tool links
- **AI:** Groq SDK (Llama 3.3 70B) powering the in-site "Talos" chat assistant
- **Analytics:** Vercel Analytics

## Site Flow

### 1. Layout & Navigation
Every page is wrapped by `src/app/layout.tsx`, which renders:
- **`Sidebar`** (desktop) — a file-tree-style nav (`about.md`, `stats.json`, `projects/`, `learn.log`, `tools.json`, `contact.json`) plus a live uptime counter.
- **`MobileNav`** (mobile) — a horizontally scrollable tab bar with the same links.
- **`Terminal`** — a persistent bottom command bar available on every page (see below).

Navigation targets are defined once in `src/lib/navigation.ts` and reused by the sidebar, mobile nav, and the terminal's `cd` command.

### 2. Pages
| Route | Component | Purpose |
|---|---|---|
| `/` | `HomePage` + `LogStream` | Landing page with a short bio and a scrolling "career.log" of milestones |
| `/about` | `SchemaTable` | Personal info rendered as a schema/table (roles, stack, focus areas) |
| `/stats` | `GithubStats`, `LeetcodeStats` | Live GitHub contribution heatmap/languages and LeetCode solve stats, pulled from `/api/github` and `/api/leetcode` |
| `/projects` | `MigrationList` | Expandable list of projects, styled as DB "migrations" (PROD/ARCHIVED) |
| `/learn` | `LearnLogs` | Markdown-based learning journal, fetched from `/api/logs` (backed by KV) |
| `/tools` | `ToolLinks` | Curated links to tools/resources, fetched from `/api/tools` (backed by KV) |
| `/contact` | `ContactGrid` | Direct contact links (email, WhatsApp, GitHub, Instagram, LinkedIn, Telegram) |

### 3. The Terminal (always-on)
`src/components/Terminal.tsx` is a floating command bar with a fuzzy-matched command palette. It supports:
- **`cd <section>`** — navigates to a page (aliases resolved via `resolveCdTarget`)
- **`talos_ai <question>`** — opens a chat modal and talks to "Talos," an AI persona (see below)
- **`sudo`** — opens a password modal; on success it unlocks admin controls (edit/delete buttons) on the Learn and Tools pages for that browser session

### 4. Talos — the AI Assistant
Typing `talos_ai` opens a chat UI that streams responses from `/api/ai/route.ts`:
1. The user's message is sent to Groq (Llama 3.3 70B) along with a system prompt describing "Talos."
2. Talos can call a `load_information` tool to pull reference `.md` files from `information/` (`coding.md`, `profession.md`, `hobbies.md`, `contact.md`) so its answers stay grounded in Billy's actual background.
3. Talos can also call `contact_zhong86`, which relays a visitor's message to Billy via a Telegram bot — but only once the visitor has provided real message content (not just "can you contact him?").
4. The final answer is streamed back to the client as SSE and rendered live in the chat window.

### 5. Sudo-Gated Admin Mode
Entering the correct password via the `sudo` terminal command (checked against `/api/sudo`) unlocks a session flag (`sudoUnlocked` in `sessionStorage`). While unlocked:
- The `/learn` and `/tools` pages show **+ new**, **edit**, and **del** controls.
- Mutating requests (`POST`/`PUT`/`DELETE` to `/api/logs` and `/api/tools`) include an `x-sudo-token` header, which the API routes validate against the server-side password before writing to KV.

### 6. Data & APIs
| Route | Backing store | Description |
|---|---|---|
| `/api/logs` | Vercel KV | CRUD for learning-log entries (markdown content) |
| `/api/tools` | Vercel KV | CRUD for tool/resource links |
| `/api/github` | GitHub API | Proxies recent repos (keeps the GitHub token server-side) |
| `/api/leetcode` | LeetCode GraphQL | Fetches solve stats, language breakdown, and submission calendar |
| `/api/ai` | Groq | Powers the Talos chat assistant (tool-calling + streaming) |
| `/api/sudo` | env var | Validates the admin password |

### 7. Build Info
`scripts/generate_build_date.mts` runs on `prebuild` and writes the current date/commit into `src/lib/build-info.json`, which the sidebar displays as "last deployed."

## Project Structure
```
src/
  app/                # Routes (App Router) + API route handlers
  components/          # UI components (Sidebar, Terminal, page-specific widgets)
  lib/                 # Shared navigation config + generated build info
information/            # Markdown knowledge base used by the Talos AI assistant
scripts/                # Build-time helper scripts
```

## Getting Started
```bash
npm install
npm run dev
```
Then open [http://localhost:3000](http://localhost:3000).

Required environment variables include `GITHUB_TOKEN`, `GROQ_API_KEY`, `SUDO_PASSWORD`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and Vercel KV credentials (`KV_REST_API_URL` / `KV_REST_API_TOKEN` or Upstash equivalents).
