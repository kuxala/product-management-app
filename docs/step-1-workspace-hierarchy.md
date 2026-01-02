# Step 1: Workspace Hierarchy & Enhanced Structure

## Overview

Transform the flat project structure into a hierarchical organization system that scales with team needs.

**Current:** User → Projects → Tasks

**Target:** Workspaces → Spaces → Projects → Lists → Tasks (with subtasks)

## Goals

- Enable multi-tenant architecture with workspaces
- Organize projects into logical spaces
- Support task lists within projects
- Implement subtasks with unlimited nesting
- Add favorites and recent items for quick access

---

## Database Schema

### New Models

```prisma
// Workspace - Top level organization (like a company/team)
model Workspace {
  id          String   @id @default(uuid())
  name        String
  slug        String   @unique
  description String?
  logoUrl     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     WorkspaceMember[]
  spaces      Space[]

  @@index([slug])
}

// Workspace membership with roles
model WorkspaceMember {
  id          String        @id @default(uuid())
  userId      String
  workspaceId String
  role        WorkspaceRole @default(MEMBER)
  joinedAt    DateTime      @default(now())

  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  workspace   Workspace     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
  @@index([workspaceId])
  @@index([userId])
}

enum WorkspaceRole {
  OWNER
  ADMIN
  MEMBER
  GUEST
}

// Space - Groups related projects within a workspace
model Space {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String   @default("#6366f1") // Hex color for UI
  icon        String?  // Icon identifier
  workspaceId String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  projects    Project[]

  @@index([workspaceId])
}

// Task List - Groups tasks within a project
model TaskList {
  id        String   @id @default(uuid())
  name      String
  position  Int      @default(0) // For ordering
  projectId String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     Task[]

  @@index([projectId])
}

// Favorites - Quick access to any item
model Favorite {
  id         String       @id @default(uuid())
  userId     String
  targetType FavoriteType
  targetId   String
  position   Int          @default(0)
  createdAt  DateTime     @default(now())

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, targetType, targetId])
  @@index([userId])
}

enum FavoriteType {
  WORKSPACE
  SPACE
  PROJECT
  TASK_LIST
  TASK
}

// Recent items - Track user's recent activity
model RecentItem {
  id         String       @id @default(uuid())
  userId     String
  targetType FavoriteType
  targetId   String
  viewedAt   DateTime     @default(now())

  user       User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, targetType, targetId])
  @@index([userId, viewedAt])
}
```

### Modified Models

```prisma
// Update Project to belong to Space
model Project {
  id          String    @id @default(uuid())
  name        String
  description String?
  spaceId     String    // NEW: Replace direct workspace relation
  ownerId     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  space       Space     @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  owner       User      @relation("OwnedProjects", fields: [ownerId], references: [id])
  members     ProjectMember[]
  taskLists   TaskList[]  // NEW: Replace direct tasks relation
  tasks       Task[]      // Keep for backward compat during migration

  @@index([spaceId])
  @@index([ownerId])
}

// Update Task to support subtasks and task lists
model Task {
  id          String       @id @default(uuid())
  title       String
  description String?
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  position    Int          @default(0)    // NEW: For ordering
  projectId   String
  taskListId  String?                     // NEW: Optional list assignment
  assigneeId  String?
  parentId    String?                     // NEW: For subtasks
  dueDate     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskList    TaskList?    @relation(fields: [taskListId], references: [id], onDelete: SetNull)
  assignee    User?        @relation("AssignedTasks", fields: [assigneeId], references: [id], onDelete: SetNull)
  parent      Task?        @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks    Task[]       @relation("Subtasks")

  @@index([projectId])
  @@index([taskListId])
  @@index([assigneeId])
  @@index([parentId])
  @@index([status])
}

// Update User to include new relations
model User {
  id              String            @id @default(uuid())
  email           String            @unique
  password        String
  name            String
  avatarUrl       String?           // NEW: Profile picture
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  ownedProjects   Project[]         @relation("OwnedProjects")
  memberships     ProjectMember[]
  assignedTasks   Task[]            @relation("AssignedTasks")
  workspaces      WorkspaceMember[] // NEW
  favorites       Favorite[]        // NEW
  recentItems     RecentItem[]      // NEW
}
```

---

## API Endpoints

### Workspaces

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces` | Create workspace | User |
| GET | `/api/workspaces` | List user's workspaces | User |
| GET | `/api/workspaces/:id` | Get workspace details | Member |
| PATCH | `/api/workspaces/:id` | Update workspace | Admin |
| DELETE | `/api/workspaces/:id` | Delete workspace | Owner |
| POST | `/api/workspaces/:id/members` | Invite member | Admin |
| PATCH | `/api/workspaces/:id/members/:userId` | Update member role | Admin |
| DELETE | `/api/workspaces/:id/members/:userId` | Remove member | Admin |
| GET | `/api/workspaces/:id/members` | List members | Member |

### Spaces

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/spaces` | Create space | Admin |
| GET | `/api/workspaces/:workspaceId/spaces` | List spaces | Member |
| GET | `/api/spaces/:id` | Get space details | Member |
| PATCH | `/api/spaces/:id` | Update space | Admin |
| DELETE | `/api/spaces/:id` | Delete space | Admin |

### Projects (Updated)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/spaces/:spaceId/projects` | Create project in space | Member |
| GET | `/api/spaces/:spaceId/projects` | List projects in space | Member |
| GET | `/api/projects/:id` | Get project details | Member |
| PATCH | `/api/projects/:id` | Update project | Owner |
| DELETE | `/api/projects/:id` | Delete project | Owner |

### Task Lists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/projects/:projectId/lists` | Create task list | Member |
| GET | `/api/projects/:projectId/lists` | List task lists | Member |
| PATCH | `/api/lists/:id` | Update task list | Member |
| DELETE | `/api/lists/:id` | Delete task list | Owner |
| PATCH | `/api/lists/:id/reorder` | Reorder task list | Member |

### Tasks (Updated)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/lists/:listId/tasks` | Create task in list | Member |
| POST | `/api/tasks/:taskId/subtasks` | Create subtask | Member |
| GET | `/api/tasks/:id` | Get task with subtasks | Member |
| PATCH | `/api/tasks/:id` | Update task | Member |
| DELETE | `/api/tasks/:id` | Delete task | Owner |
| PATCH | `/api/tasks/:id/move` | Move task to different list | Member |
| PATCH | `/api/tasks/:id/reorder` | Reorder task position | Member |

### Favorites & Recent

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/favorites` | Add to favorites | User |
| GET | `/api/favorites` | List favorites | User |
| DELETE | `/api/favorites/:id` | Remove from favorites | User |
| PATCH | `/api/favorites/reorder` | Reorder favorites | User |
| GET | `/api/recent` | Get recent items | User |

---

## DTOs

### Workspace DTOs

```typescript
// Create Workspace
interface CreateWorkspaceDto {
  name: string;
  slug: string;
  description?: string;
}

// Update Workspace
interface UpdateWorkspaceDto {
  name?: string;
  description?: string;
  logoUrl?: string;
}

// Invite Member
interface InviteWorkspaceMemberDto {
  email: string;
  role: WorkspaceRole;
}

// Update Member Role
interface UpdateWorkspaceMemberDto {
  role: WorkspaceRole;
}

// Workspace Response
interface WorkspaceResponseDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  memberCount: number;
  role: WorkspaceRole; // Current user's role
  createdAt: Date;
}
```

### Space DTOs

```typescript
// Create Space
interface CreateSpaceDto {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}

// Update Space
interface UpdateSpaceDto {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
}

// Space Response
interface SpaceResponseDto {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  projectCount: number;
  createdAt: Date;
}
```

### Task List DTOs

```typescript
// Create Task List
interface CreateTaskListDto {
  name: string;
  position?: number;
}

// Update Task List
interface UpdateTaskListDto {
  name?: string;
}

// Reorder Task List
interface ReorderTaskListDto {
  position: number;
}

// Task List Response
interface TaskListResponseDto {
  id: string;
  name: string;
  position: number;
  taskCount: number;
  tasks?: TaskResponseDto[];
}
```

### Updated Task DTOs

```typescript
// Create Task
interface CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueDate?: Date;
  position?: number;
}

// Create Subtask
interface CreateSubtaskDto {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
}

// Move Task
interface MoveTaskDto {
  taskListId: string;
  position?: number;
}

// Task Response with subtasks
interface TaskResponseDto {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assignee: UserSummaryDto | null;
  dueDate: Date | null;
  parentId: string | null;
  subtasks: TaskResponseDto[];
  subtaskCount: number;
  completedSubtaskCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Frontend Components

### New Pages

```
src/pages/
├── WorkspacesPage.tsx       # List/select workspaces
├── WorkspaceSettingsPage.tsx # Workspace settings & members
├── SpacePage.tsx            # Space with projects grid
└── ProjectPage.tsx          # Updated with task lists
```

### New Components

```
src/components/
├── layout/
│   ├── Sidebar.tsx          # Main navigation sidebar
│   ├── WorkspaceSwitcher.tsx # Dropdown to switch workspaces
│   └── Breadcrumb.tsx       # Navigation breadcrumb
├── workspace/
│   ├── WorkspaceCard.tsx    # Workspace preview card
│   ├── CreateWorkspaceModal.tsx
│   ├── InviteMemberModal.tsx
│   └── MemberList.tsx
├── space/
│   ├── SpaceCard.tsx        # Space preview card
│   ├── CreateSpaceModal.tsx
│   └── SpaceHeader.tsx
├── project/
│   ├── TaskListColumn.tsx   # Column for task list
│   ├── CreateTaskListModal.tsx
│   └── ProjectHeader.tsx
├── task/
│   ├── TaskCard.tsx         # Task in list/board
│   ├── TaskDetailPanel.tsx  # Slide-out task details
│   ├── SubtaskList.tsx      # Nested subtasks
│   ├── CreateTaskModal.tsx
│   └── TaskQuickAdd.tsx     # Inline task creation
└── common/
    ├── FavoriteButton.tsx   # Star/unstar items
    ├── RecentItems.tsx      # Recent items dropdown
    └── ColorPicker.tsx      # For space colors
```

### Sidebar Structure

```
┌─────────────────────────────────┐
│ [Logo] Workspace Name      [▼] │  <- WorkspaceSwitcher
├─────────────────────────────────┤
│ 🔍 Search                       │
├─────────────────────────────────┤
│ ⭐ Favorites                    │
│   └─ Project Alpha              │
│   └─ Task: Fix login bug        │
├─────────────────────────────────┤
│ 🕐 Recent                       │
│   └─ Sprint Planning            │
│   └─ API Design                 │
├─────────────────────────────────┤
│ 📁 Spaces                       │
│ ▼ Engineering          [+ ⚙️]  │
│   └─ Web App                    │
│   └─ Mobile App                 │
│   └─ Infrastructure             │
│ ▶ Marketing                     │
│ ▶ Design                        │
│ [+ Add Space]                   │
├─────────────────────────────────┤
│ ⚙️ Settings                     │
│ 👥 Members                      │
└─────────────────────────────────┘
```

---

## State Management

### Context Structure

```typescript
// WorkspaceContext - Current workspace state
interface WorkspaceContextValue {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  switchWorkspace: (workspaceId: string) => void;
  refreshWorkspaces: () => void;
}

// NavigationContext - Sidebar state
interface NavigationContextValue {
  expandedSpaces: Set<string>;
  toggleSpace: (spaceId: string) => void;
  favorites: Favorite[];
  recentItems: RecentItem[];
  addFavorite: (type: FavoriteType, id: string) => void;
  removeFavorite: (id: string) => void;
}
```

### URL Structure

```
/workspaces                     # Workspace selection
/w/:workspaceSlug               # Workspace home/dashboard
/w/:workspaceSlug/settings      # Workspace settings
/w/:workspaceSlug/members       # Member management
/w/:workspaceSlug/s/:spaceId    # Space view
/w/:workspaceSlug/p/:projectId  # Project view
/w/:workspaceSlug/t/:taskId     # Task detail (modal or page)
```

---

## Migration Strategy

### Phase 1: Database Migration

1. Add new tables (Workspace, Space, TaskList, etc.)
2. Create default workspace for existing users
3. Create default space for existing projects
4. Migrate projects to belong to spaces
5. Create default task list for each project
6. Migrate tasks to belong to task lists

### Phase 2: API Migration

1. Add new endpoints alongside existing ones
2. Update existing endpoints to work with hierarchy
3. Deprecate old endpoints with warnings
4. Remove deprecated endpoints after frontend migration

### Phase 3: Frontend Migration

1. Add workspace selection flow
2. Update sidebar with new navigation
3. Update project page with task lists
4. Add subtask support to task components

### Data Migration Script

```typescript
async function migrateToWorkspaces() {
  // 1. Get all unique project owners
  const owners = await prisma.user.findMany({
    where: { ownedProjects: { some: {} } },
    include: { ownedProjects: true }
  });

  for (const owner of owners) {
    // 2. Create workspace for each owner
    const workspace = await prisma.workspace.create({
      data: {
        name: `${owner.name}'s Workspace`,
        slug: generateSlug(owner.name),
        members: {
          create: { userId: owner.id, role: 'OWNER' }
        }
      }
    });

    // 3. Create default space
    const space = await prisma.space.create({
      data: {
        name: 'Projects',
        workspaceId: workspace.id
      }
    });

    // 4. Migrate projects to space
    for (const project of owner.ownedProjects) {
      // Create default task list
      const taskList = await prisma.taskList.create({
        data: {
          name: 'Tasks',
          projectId: project.id
        }
      });

      // Update project with space
      await prisma.project.update({
        where: { id: project.id },
        data: { spaceId: space.id }
      });

      // Assign tasks to task list
      await prisma.task.updateMany({
        where: { projectId: project.id },
        data: { taskListId: taskList.id }
      });

      // Add project members to workspace
      const members = await prisma.projectMember.findMany({
        where: { projectId: project.id }
      });

      for (const member of members) {
        await prisma.workspaceMember.upsert({
          where: {
            userId_workspaceId: {
              userId: member.userId,
              workspaceId: workspace.id
            }
          },
          create: {
            userId: member.userId,
            workspaceId: workspace.id,
            role: 'MEMBER'
          },
          update: {}
        });
      }
    }
  }
}
```

---

## Guards & Authorization

### New Guards

```typescript
// Workspace Member Guard
@Injectable()
export class WorkspaceMemberGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user.id;
    const workspaceId = request.params.workspaceId || request.params.id;

    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } }
    });

    if (!member) return false;

    request.workspaceMember = member;
    return true;
  }
}

// Workspace Admin Guard
@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const member = request.workspaceMember;

    return member && ['OWNER', 'ADMIN'].includes(member.role);
  }
}

// Workspace Owner Guard
@Injectable()
export class WorkspaceOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const member = request.workspaceMember;

    return member && member.role === 'OWNER';
  }
}
```

---

## Testing Checklist

### Unit Tests

- [ ] Workspace CRUD operations
- [ ] Space CRUD operations
- [ ] Task List CRUD operations
- [ ] Subtask creation and nesting
- [ ] Favorites add/remove/reorder
- [ ] Recent items tracking
- [ ] Authorization guards

### Integration Tests

- [ ] Create workspace flow
- [ ] Invite member to workspace
- [ ] Create space in workspace
- [ ] Create project in space
- [ ] Create task list in project
- [ ] Create task in list
- [ ] Create subtask
- [ ] Move task between lists
- [ ] Reorder tasks

### E2E Tests

- [ ] New user creates workspace
- [ ] User invites team member
- [ ] Full hierarchy navigation
- [ ] Task drag-and-drop between lists
- [ ] Subtask completion updates parent

---

## Success Metrics

- [ ] Users can create and switch between workspaces
- [ ] Spaces group related projects logically
- [ ] Task lists organize tasks within projects
- [ ] Subtasks can be nested to any depth
- [ ] Favorites provide quick access
- [ ] Recent items show user's activity
- [ ] Navigation is intuitive and fast
- [ ] Existing data migrated without loss
