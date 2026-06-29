# SimLight 2.0 — Full-Stack Simulation Platform

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173 → **Register** your organization, then create simulations.

## Phase 5 Features

| Feature | Description |
|---------|-------------|
| **JWT Authentication** | Register, login, protected faculty routes |
| **Organization Tenancy** | Each org has isolated simulations & users |
| **Role-based Access** | Faculty/admin for creator; learners play without login |
| **PostgreSQL** | Optional via `DATABASE_URL` (SQLite default) |
| **Docker Postgres** | `docker compose up -d` for production-like DB |

## Auth Flow

1. **Register** at `/register` — creates organization + faculty account
2. **Login** at `/login` — JWT stored in browser
3. Faculty routes require authentication
4. **Play routes** (`/play/:id`) remain public for learners

## PostgreSQL Setup

```bash
docker compose up -d
```

Add to `.env`:

```env
DATABASE_URL=postgresql://simlight:simlight@localhost:5432/simlight
JWT_SECRET=your-secret-here
```

Restart the server — schema auto-initializes on startup.

## API

```
POST /api/auth/register   { orgName, name, email, password }
POST /api/auth/login      { email, password }
GET  /api/auth/me         Authorization: Bearer <token>
```

All `/api/simulations/*` faculty endpoints require `Authorization: Bearer <token>`.

## Tech Stack

React 19 · TypeScript · Vite · Tailwind · Express · JWT · bcrypt · SQLite/PostgreSQL · OpenAI/Anthropic
