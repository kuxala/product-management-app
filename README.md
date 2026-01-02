# Project Management System

A full-stack project management application with workspaces, spaces, projects, and task management.

## Quick Start

### Prerequisites
- Node.js v18+
- Yarn v1.22+
- Docker

### Setup

```bash
# Install dependencies
yarn install

# Start PostgreSQL
docker compose -f infrastructure/docker/docker-compose.yml up -d

# Configure environment
cp .env.example .env
cp apps/api/.env.example apps/api/.env

# Setup database
yarn db:generate
yarn db:migrate

# Start development servers
yarn start-all
```

**URLs:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Prisma Studio: `yarn db:studio`

## Architecture

### Monorepo Structure

```
├── apps/
│   ├── api/           # NestJS backend
│   └── web/           # React + Vite frontend
├── packages/
│   ├── db/            # Prisma schema & client
│   └── shared/        # Shared TypeScript types
└── infrastructure/
    └── docker/        # PostgreSQL container
```

### Tech Stack

**Backend:** NestJS, Prisma, PostgreSQL, JWT auth
**Frontend:** React 18, TypeScript, Vite, Tailwind CSS, @dnd-kit
**Shared:** TypeScript types via `@pm/shared`, Prisma client via `@pm/db`

### Key Patterns

- **Backend:** Module-based (Controller → Service → Prisma)
- **Frontend:** Context-based state (AuthContext, WorkspaceContext, ViewContext, FilterContext)
- **Views:** Multiple task views (List, Board, Calendar) with filtering and grouping
- **Components:** Shared UI in `components/shared/`, page-specific in `pages/components/`

### Data Model

```
Workspace → Space → Project → TaskList → Task
     ↓         ↓        ↓                  ↓
  Members   Filters  Views/Filters    Comments/Reactions
```

## Common Commands

```bash
yarn start-all       # Start both API and web
yarn dev:api         # Start API only
yarn dev:web         # Start web only
yarn db:migrate      # Run migrations
yarn db:studio       # Database GUI
```
