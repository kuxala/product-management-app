# Project Management System

A full-stack project management application built with NestJS, React, and Prisma in a monorepo setup.

## Tech Stack

### Backend
- **NestJS** - Progressive Node.js framework
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Relational database
- **JWT** - Authentication & authorization
- **bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Monorepo
- **Yarn** - Package manager
- **Yarn Workspaces** - Monorepo management

## Project Structure

```
project-management/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # React frontend
├── packages/
│   ├── db/           # Prisma schema and client
│   └── shared/       # Shared TypeScript types
└── infrastructure/
    └── docker/       # Docker compose for PostgreSQL
```

## Prerequisites

- Node.js (v18 or higher)
- Yarn (v1.22 or higher)
- Docker & Docker Compose

## Setup Instructions

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start PostgreSQL Database

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

### 3. Configure Environment Variables

Copy the example environment files and update them with your values:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
```

Update the `.env` files with your configuration.

### 4. Generate Prisma Client & Run Migrations

```bash
yarn db:generate
yarn db:migrate
```

### 5. Start Development Servers

Start both frontend and backend:

```bash
yarn dev
```

Or start them individually:

```bash
# Backend only
yarn dev:api

# Frontend only
yarn dev:web
```

## Available Scripts

### Root Level

- `yarn dev` - Start both API and web in parallel
- `yarn dev:api` - Start API server only
- `yarn dev:web` - Start web app only
- `yarn db:generate` - Generate Prisma client
- `yarn db:migrate` - Run database migrations
- `yarn db:studio` - Open Prisma Studio

### API (apps/api)

- `yarn dev` - Start NestJS in watch mode
- `yarn build` - Build for production

### Web (apps/web)

- `yarn dev` - Start Vite dev server
- `yarn build` - Build for production

## API Endpoints

| Method | Path | Auth Required |
|--------|------|---------------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Public |
| GET | /api/auth/me | Required |
| GET | /api/projects | Required |
| POST | /api/projects | Required |
| GET | /api/projects/:id | Member |
| PATCH | /api/projects/:id | Owner |
| DELETE | /api/projects/:id | Owner |
| POST | /api/projects/:id/members | Owner |
| DELETE | /api/projects/:id/members/:uid | Owner |
| GET | /api/projects/:pid/tasks | Member |
| POST | /api/projects/:pid/tasks | Member |
| PATCH | /api/projects/:pid/tasks/:tid | Member |
| DELETE | /api/projects/:pid/tasks/:tid | Owner |

### Roles
- **Owner**: Full control (edit, delete, manage members)
- **Member**: View project, create/update tasks
- **Public**: No authentication required
- **Required**: Any authenticated user

## Database Schema

### Models

- **User** - User accounts with authentication
- **Project** - Projects with owner and description
- **ProjectMember** - Many-to-many relationship between users and projects
- **Task** - Tasks within projects with status and priority

### Enums

- **ProjectRole**: `OWNER`, `MEMBER`
- **TaskStatus**: `TODO`, `IN_PROGRESS`, `DONE`
- **TaskPriority**: `LOW`, `MEDIUM`, `HIGH`

## Features

### Authentication & Authorization
- JWT-based authentication with refresh tokens
- Password hashing with bcrypt
- Protected routes and API endpoints
- Role-based access control

### Project Management
- Create and manage projects
- Add/remove team members
- Owner and member roles
- Project deletion (owner only)

### Task Management
- Create tasks within projects
- Update task status and priority
- Assign tasks to team members
- Task filtering by status, priority, assignee

### Frontend Features
- Responsive UI
- Protected routes
- Automatic token refresh
- Error handling
- Loading states

## URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api
- **Prisma Studio**: Run `yarn db:studio`

## Development Tips

1. **Prisma Studio**: Use `yarn db:studio` to view and edit database records
2. **Type Safety**: Shared types in `packages/shared` ensure consistency
3. **Hot Reload**: Both frontend and backend support hot reload during development
4. **Monorepo**: Changes to shared packages are automatically reflected in apps

## Troubleshooting

### Database Connection Issues

Ensure PostgreSQL is running:
```bash
docker compose -f infrastructure/docker/docker-compose.yml ps
```

### Port Already in Use

- Frontend (5173) or Backend (3000) ports might be in use
- Stop other processes or change ports in config files

### Prisma Client Not Found

Regenerate Prisma client:
```bash
yarn db:generate
```

## Additional Documentation

- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide with manual test checklists and permission verification scenarios
- **[SECURITY.md](./SECURITY.md)** - Security documentation including best practices, vulnerability testing, and production recommendations

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
