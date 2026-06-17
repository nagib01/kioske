# Kioske Digital Universal

Queue management system for driving schools. Customers take tickets at a kiosk, answer triage questions, and wait to be called. Receptionists manage the queue, instructors manage lessons, and students track their position in real-time.

## Architecture

```
backend/   Fastify (port 3001)   → PostgreSQL + WebSocket
frontend/  Next.js 14             → 4 apps via custom server

Port 3000  Kioske    → Service selection → triage → ticket
Port 3002  Staff     → Login → backoffice / admin / instructor
Port 3003  Monitor   → Live queue display (TV)
Port 3004  Student   → Login → account dashboard (BYOD)
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Setup

```bash
# 1. Install dependencies
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. Configure environment
cp .env.example .env
# Edit .env with your database credentials and JWT secret

# 3. Create database and apply schema
createdb kiosque
psql -U postgres -d kiosque -f backend/src/db/schema.sql

# 4. Seed test data
psql -U postgres -d kiosque -f backend/src/db/seed.sql
psql -U postgres -d kiosque -f backend/src/db/seed-triage.sql

# 5. Start development
npm run dev:all
```

This starts:
- Backend API at `http://localhost:3001`
- Kioske app at `http://localhost:3000`
- Staff app at `http://localhost:3002`
- Monitor app at `http://localhost:3003`
- Student app at `http://localhost:3004`

### Test Accounts (seed data)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@escola.pt | admin123 |
| Receptionist | rececionista@escola.pt | admin123 |
| Instructor | instrutor@escola.pt | admin123 |

## Ports Overview

| Port | App | Entry | Description |
|------|-----|-------|-------------|
| 3000 | Kioske | `/servicos` | Public kiosk terminal — select service, answer triage, get ticket |
| 3002 | Staff | `/login` | Backoffice — queue management, admin panels |
| 3003 | Monitor | `/chamadas` | TV display — shows called tickets in real-time |
| 3004 | Student | `/aluno/conta` | BYOD — track queue position, view lessons and notifications |

## Development

```bash
npm run dev:all       # Backend + all frontend apps
npm run dev:backend   # Backend only
npm run dev:frontend  # Frontend only (legacy single-port mode)
```

## Tech Stack

- **Backend**: Fastify, @fastify/postgres, @fastify/jwt, @fastify/websocket, Zod
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Database**: PostgreSQL
- **Real-time**: WebSocket
