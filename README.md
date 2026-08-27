# VibraFlow

A personal planner for tasks, calendar, and goals — built to be genuinely nice to use every day. Part of the Vibranic suite.

> **Live demo:** _add your Vercel URL_ · **Companion app:** Vibradex (diagnostics dashboard)

<!-- Add a screenshot here: ![VibraFlow](docs/screenshot.png) -->

## Features

- **Tasks** — list view grouped by day/week, optimistic complete/favorite, priority levels, categories, recurring tasks.
- **Calendar** — month, week, 3-day, and day views with drag-to-move/resize events and a dynamic hour window that fits the screen.
- **Todos board** — a customizable Kanban board with your own columns.
- **Custom authentication** — email/password auth built from scratch (no third-party auth provider): bcrypt-hashed passwords, database-backed sessions, and an `httpOnly` cookie for persistent login.
- **Mobile-first polish** — drag-to-close drawers, swipe between tabs, no-scroll layouts.

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS v4, Framer Motion |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Auth | Custom cookie-based sessions (bcrypt + `httpOnly` tokens) |
| Hosting | Vercel |

## Custom auth (the interesting part)

Rather than reach for a managed provider, authentication is hand-rolled:

- **Passwords** are hashed with bcrypt — never stored in plain text.
- **Sessions** are random tokens stored server-side as SHA-256 hashes; the raw token lives in an `httpOnly`, `secure`, `sameSite=lax` cookie with a 30-day lifetime.
- **Middleware** (`proxy.ts`) gates every route on the session cookie; API routes verify the session via `readSession()`.

See `lib/auth/` for the implementation.

## Getting started

```bash
# 1. Install
npm install

# 2. Configure the database (see below), then apply migrations
npx prisma migrate deploy

# 3. Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), create an account, and start planning.

### Environment variables

Create a `.env` file:

```bash
DATABASE_URL="postgresql://…"   # pooled connection (runtime queries)
DIRECT_URL="postgresql://…"     # direct/unpooled connection (migrations)
```

Both come from your Neon dashboard. Use a **dev branch** for local work so migrations never touch production.

## Project structure

```
app/
  (orbit)/        # main app shell + views (tasks / calendar / todos)
  api/            # route handlers (auth, tasks, categories, todo-states)
  login, signup   # custom auth pages
  privacy, terms  # legal pages
lib/auth/         # password hashing + session helpers
prisma/           # schema + migrations
```

## License

Personal project — all rights reserved.
