# Step 5: Dashboards, Goals & Automation

## Overview

Add high-level insights through customizable dashboards, goal tracking for OKRs, workflow automation, project templates, and third-party integrations.

## Goals

- Build customizable dashboards with widgets
- Implement goals/OKRs with progress tracking
- Create automation engine with triggers and actions
- Support project and task templates
- Add reporting and export capabilities
- Enable third-party integrations (Slack, GitHub, etc.)

---

## Database Schema

### Dashboards

```prisma
// Dashboard configuration
model Dashboard {
  id          String            @id @default(uuid())
  name        String
  description String?
  workspaceId String
  projectId   String?           // Project-specific dashboard
  userId      String?           // Personal dashboard (null = shared)
  isDefault   Boolean           @default(false)
  layout      Json              // Widget positions and sizes
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project     Project?          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user        User?             @relation(fields: [userId], references: [id], onDelete: Cascade)
  widgets     DashboardWidget[]

  @@index([workspaceId])
  @@index([projectId])
  @@index([userId])
}

// Individual widget on dashboard
model DashboardWidget {
  id          String     @id @default(uuid())
  dashboardId String
  type        WidgetType
  title       String
  config      Json       // Widget-specific configuration
  position    Json       // { x, y, w, h } for grid layout
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  dashboard   Dashboard  @relation(fields: [dashboardId], references: [id], onDelete: Cascade)

  @@index([dashboardId])
}

enum WidgetType {
  // Task widgets
  TASK_COUNT           // Total tasks by status
  TASK_BY_STATUS       // Pie/bar chart
  TASK_BY_PRIORITY     // Pie/bar chart
  TASK_BY_ASSIGNEE     // Bar chart
  TASKS_DUE_SOON       // List of upcoming tasks
  OVERDUE_TASKS        // List of overdue tasks
  RECENTLY_COMPLETED   // List of completed tasks

  // Time widgets
  TIME_TRACKED         // Total time logged
  TIME_BY_PROJECT      // Time breakdown
  TIME_BY_USER         // Team time distribution

  // Progress widgets
  BURNDOWN_CHART       // Sprint burndown
  BURNUP_CHART         // Sprint burnup
  VELOCITY_CHART       // Sprint velocity over time
  CUMULATIVE_FLOW      // Cumulative flow diagram

  // Team widgets
  TEAM_WORKLOAD        // Tasks per member
  ACTIVITY_FEED        // Recent activity

  // Goals widgets
  GOAL_PROGRESS        // OKR progress
  KEY_RESULTS          // KR completion

  // Custom widgets
  MARKDOWN             // Custom text/notes
  EMBED                // External embed (iframe)
}
```

### Goals & OKRs

```prisma
// Goal (Objective)
model Goal {
  id          String       @id @default(uuid())
  title       String
  description String?
  workspaceId String
  ownerId     String       // Goal owner
  parentId    String?      // For nested goals
  status      GoalStatus   @default(ON_TRACK)
  progress    Int          @default(0) // 0-100
  startDate   DateTime?
  endDate     DateTime?
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  workspace   Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  owner       User         @relation(fields: [ownerId], references: [id])
  parent      Goal?        @relation("GoalHierarchy", fields: [parentId], references: [id])
  children    Goal[]       @relation("GoalHierarchy")
  keyResults  KeyResult[]

  @@index([workspaceId])
  @@index([ownerId])
  @@index([parentId])
}

enum GoalStatus {
  ON_TRACK
  AT_RISK
  BEHIND
  COMPLETED
  CANCELLED
}

// Key Result (measurable outcome)
model KeyResult {
  id           String         @id @default(uuid())
  title        String
  description  String?
  goalId       String
  ownerId      String?
  type         KeyResultType  @default(NUMBER)
  targetValue  Float
  currentValue Float          @default(0)
  startValue   Float          @default(0)
  unit         String?        // "%", "users", "$", etc.
  progress     Int            @default(0) // Calculated 0-100
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  goal         Goal           @relation(fields: [goalId], references: [id], onDelete: Cascade)
  owner        User?          @relation(fields: [ownerId], references: [id])
  linkedTasks  TaskKeyResult[]
  updates      KeyResultUpdate[]

  @@index([goalId])
}

enum KeyResultType {
  NUMBER       // Reach X number
  PERCENTAGE   // Reach X%
  CURRENCY     // Reach $X
  BOOLEAN      // Complete yes/no
}

// Key Result progress updates
model KeyResultUpdate {
  id          String    @id @default(uuid())
  keyResultId String
  value       Float
  note        String?
  updatedBy   String
  createdAt   DateTime  @default(now())

  keyResult   KeyResult @relation(fields: [keyResultId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [updatedBy], references: [id])

  @@index([keyResultId])
}

// Link tasks to key results
model TaskKeyResult {
  id          String    @id @default(uuid())
  taskId      String
  keyResultId String
  createdAt   DateTime  @default(now())

  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  keyResult   KeyResult @relation(fields: [keyResultId], references: [id], onDelete: Cascade)

  @@unique([taskId, keyResultId])
  @@index([keyResultId])
}
```

### Automations

```prisma
// Automation rule
model Automation {
  id          String            @id @default(uuid())
  name        String
  description String?
  workspaceId String
  projectId   String?           // Project-specific automation
  isActive    Boolean           @default(true)
  createdBy   String
  runCount    Int               @default(0)
  lastRunAt   DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  workspace   Workspace         @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  project     Project?          @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator     User              @relation(fields: [createdBy], references: [id])
  triggers    AutomationTrigger[]
  actions     AutomationAction[]
  logs        AutomationLog[]

  @@index([workspaceId])
  @@index([projectId])
}

// Trigger that starts automation
model AutomationTrigger {
  id           String        @id @default(uuid())
  automationId String
  type         TriggerType
  config       Json          // Trigger-specific configuration
  position     Int           @default(0)

  automation   Automation    @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@index([automationId])
}

enum TriggerType {
  // Task triggers
  TASK_CREATED
  TASK_UPDATED
  TASK_STATUS_CHANGED
  TASK_ASSIGNED
  TASK_PRIORITY_CHANGED
  TASK_DUE_DATE_APPROACHING
  TASK_OVERDUE
  TASK_COMPLETED
  TASK_MOVED

  // Comment triggers
  COMMENT_ADDED

  // Time triggers
  SCHEDULED               // Cron-based
  TIME_ELAPSED            // X time after event

  // External triggers
  WEBHOOK_RECEIVED
}

// Action to execute
model AutomationAction {
  id           String      @id @default(uuid())
  automationId String
  type         ActionType
  config       Json        // Action-specific configuration
  position     Int         @default(0)

  automation   Automation  @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@index([automationId])
}

enum ActionType {
  // Task actions
  UPDATE_TASK_STATUS
  UPDATE_TASK_PRIORITY
  ASSIGN_TASK
  UNASSIGN_TASK
  ADD_LABEL
  REMOVE_LABEL
  SET_DUE_DATE
  MOVE_TO_LIST
  CREATE_SUBTASK
  CREATE_TASK

  // Notification actions
  SEND_NOTIFICATION
  SEND_EMAIL
  SEND_SLACK_MESSAGE

  // Comment actions
  ADD_COMMENT

  // Webhook actions
  CALL_WEBHOOK

  // Custom
  RUN_SCRIPT            // Future: custom code execution
}

// Automation execution log
model AutomationLog {
  id           String          @id @default(uuid())
  automationId String
  status       AutomationLogStatus
  triggeredBy  Json?           // What triggered it
  actionsRun   Json?           // Actions executed
  error        String?
  duration     Int?            // Milliseconds
  createdAt    DateTime        @default(now())

  automation   Automation      @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@index([automationId, createdAt])
}

enum AutomationLogStatus {
  SUCCESS
  PARTIAL   // Some actions failed
  FAILED
  SKIPPED   // Conditions not met
}
```

### Templates

```prisma
// Project template
model ProjectTemplate {
  id          String                @id @default(uuid())
  name        String
  description String?
  workspaceId String
  isPublic    Boolean               @default(false) // Available to all workspaces
  thumbnail   String?
  config      Json                  // Full project structure
  createdBy   String
  useCount    Int                   @default(0)
  createdAt   DateTime              @default(now())
  updatedAt   DateTime              @updatedAt

  workspace   Workspace             @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User                  @relation(fields: [createdBy], references: [id])
  taskLists   TaskListTemplate[]

  @@index([workspaceId])
  @@index([isPublic])
}

// Task list within template
model TaskListTemplate {
  id                String              @id @default(uuid())
  projectTemplateId String
  name              String
  position          Int                 @default(0)

  projectTemplate   ProjectTemplate     @relation(fields: [projectTemplateId], references: [id], onDelete: Cascade)
  tasks             TaskTemplate[]

  @@index([projectTemplateId])
}

// Task within template
model TaskTemplate {
  id                 String            @id @default(uuid())
  taskListTemplateId String
  title              String
  description        String?
  priority           TaskPriority      @default(MEDIUM)
  position           Int               @default(0)
  relativeDueDate    Int?              // Days from project start
  parentId           String?           // For subtasks
  checklistItems     Json?             // Pre-defined checklist

  taskListTemplate   TaskListTemplate  @relation(fields: [taskListTemplateId], references: [id], onDelete: Cascade)
  parent             TaskTemplate?     @relation("SubtaskTemplate", fields: [parentId], references: [id])
  subtasks           TaskTemplate[]    @relation("SubtaskTemplate")

  @@index([taskListTemplateId])
}
```

### Integrations

```prisma
// External integration configuration
model Integration {
  id          String          @id @default(uuid())
  workspaceId String
  type        IntegrationType
  name        String          // User-friendly name
  config      Json            // Encrypted credentials/config
  isActive    Boolean         @default(true)
  lastSyncAt  DateTime?
  createdBy   String
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  workspace   Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  creator     User            @relation(fields: [createdBy], references: [id])
  webhooks    Webhook[]

  @@index([workspaceId])
  @@unique([workspaceId, type])
}

enum IntegrationType {
  SLACK
  GITHUB
  GITLAB
  JIRA
  GOOGLE_CALENDAR
  MICROSOFT_TEAMS
  ZAPIER
  CUSTOM_WEBHOOK
}

// Webhook configuration
model Webhook {
  id            String       @id @default(uuid())
  integrationId String?
  workspaceId   String
  name          String
  url           String
  secret        String?      // For signature verification
  events        String[]     // Events to send
  isActive      Boolean      @default(true)
  lastCalledAt  DateTime?
  failCount     Int          @default(0)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  integration   Integration? @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  workspace     Workspace    @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@index([workspaceId])
}
```

---

## API Endpoints

### Dashboards

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/dashboards` | Create dashboard | Admin |
| GET | `/api/workspaces/:workspaceId/dashboards` | List dashboards | Member |
| GET | `/api/dashboards/:id` | Get dashboard | Member |
| PATCH | `/api/dashboards/:id` | Update dashboard | Owner/Admin |
| DELETE | `/api/dashboards/:id` | Delete dashboard | Owner/Admin |
| POST | `/api/dashboards/:id/widgets` | Add widget | Owner/Admin |
| PATCH | `/api/widgets/:id` | Update widget | Owner/Admin |
| DELETE | `/api/widgets/:id` | Remove widget | Owner/Admin |
| GET | `/api/widgets/:id/data` | Get widget data | Member |

### Goals

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/goals` | Create goal | Member |
| GET | `/api/workspaces/:workspaceId/goals` | List goals | Member |
| GET | `/api/goals/:id` | Get goal with KRs | Member |
| PATCH | `/api/goals/:id` | Update goal | Owner |
| DELETE | `/api/goals/:id` | Delete goal | Owner/Admin |
| POST | `/api/goals/:id/key-results` | Add key result | Owner |
| PATCH | `/api/key-results/:id` | Update KR | Owner |
| DELETE | `/api/key-results/:id` | Delete KR | Owner |
| POST | `/api/key-results/:id/updates` | Log KR update | Owner |
| POST | `/api/key-results/:id/link-task` | Link task to KR | Member |

### Automations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/automations` | Create automation | Admin |
| GET | `/api/workspaces/:workspaceId/automations` | List automations | Member |
| GET | `/api/automations/:id` | Get automation | Member |
| PATCH | `/api/automations/:id` | Update automation | Admin |
| DELETE | `/api/automations/:id` | Delete automation | Admin |
| POST | `/api/automations/:id/toggle` | Enable/disable | Admin |
| POST | `/api/automations/:id/test` | Test run | Admin |
| GET | `/api/automations/:id/logs` | Get execution logs | Admin |

### Templates

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/templates` | Create template | Admin |
| GET | `/api/workspaces/:workspaceId/templates` | List templates | Member |
| GET | `/api/templates/public` | List public templates | Any |
| GET | `/api/templates/:id` | Get template | Member |
| PATCH | `/api/templates/:id` | Update template | Admin |
| DELETE | `/api/templates/:id` | Delete template | Admin |
| POST | `/api/templates/:id/apply` | Create project from template | Member |
| POST | `/api/projects/:id/save-as-template` | Save project as template | Admin |

### Integrations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/integrations` | Setup integration | Admin |
| GET | `/api/workspaces/:workspaceId/integrations` | List integrations | Admin |
| GET | `/api/integrations/:id` | Get integration | Admin |
| PATCH | `/api/integrations/:id` | Update integration | Admin |
| DELETE | `/api/integrations/:id` | Remove integration | Admin |
| POST | `/api/integrations/:id/test` | Test connection | Admin |
| POST | `/api/integrations/:id/sync` | Force sync | Admin |

### Webhooks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/workspaces/:workspaceId/webhooks` | Create webhook | Admin |
| GET | `/api/workspaces/:workspaceId/webhooks` | List webhooks | Admin |
| PATCH | `/api/webhooks/:id` | Update webhook | Admin |
| DELETE | `/api/webhooks/:id` | Delete webhook | Admin |
| POST | `/api/webhooks/incoming/:id` | Receive webhook | Public |

### Reports

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/reports/time` | Time tracking report | Member |
| GET | `/api/reports/tasks` | Task completion report | Member |
| GET | `/api/reports/team` | Team performance report | Admin |
| POST | `/api/reports/export` | Export report to CSV/PDF | Member |

---

## Widget Data Endpoints

### Widget Data Service

```typescript
// widget-data.service.ts
@Injectable()
export class WidgetDataService {
  constructor(private readonly prisma: PrismaService) {}

  async getWidgetData(widget: DashboardWidget): Promise<WidgetData> {
    switch (widget.type) {
      case 'TASK_COUNT':
        return this.getTaskCount(widget.config);
      case 'TASK_BY_STATUS':
        return this.getTaskByStatus(widget.config);
      case 'BURNDOWN_CHART':
        return this.getBurndownData(widget.config);
      case 'TIME_TRACKED':
        return this.getTimeTracked(widget.config);
      case 'GOAL_PROGRESS':
        return this.getGoalProgress(widget.config);
      // ... other widget types
    }
  }

  private async getTaskCount(config: TaskCountConfig): Promise<TaskCountData> {
    const { projectId, spaceId, dateRange } = config;

    const where: Prisma.TaskWhereInput = {};
    if (projectId) where.projectId = projectId;
    if (spaceId) where.project = { spaceId };
    if (dateRange) {
      where.createdAt = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end),
      };
    }

    const [total, todo, inProgress, done] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.count({ where: { ...where, status: 'TODO' } }),
      this.prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.task.count({ where: { ...where, status: 'DONE' } }),
    ]);

    return { total, todo, inProgress, done };
  }

  private async getBurndownData(config: BurndownConfig): Promise<BurndownData> {
    const { projectId, startDate, endDate } = config;

    // Get all tasks in date range
    const tasks = await this.prisma.task.findMany({
      where: { projectId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Calculate ideal burndown line
    const totalTasks = tasks.length;
    const days = differenceInDays(new Date(endDate), new Date(startDate));
    const idealPerDay = totalTasks / days;

    // Calculate actual burndown
    const dataPoints: BurndownPoint[] = [];
    let currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const remaining = tasks.filter(
        (t) =>
          t.status !== 'DONE' ||
          (t.updatedAt && t.updatedAt > currentDate)
      ).length;

      const ideal = Math.max(
        0,
        totalTasks - idealPerDay * differenceInDays(currentDate, new Date(startDate))
      );

      dataPoints.push({
        date: currentDate.toISOString(),
        remaining,
        ideal: Math.round(ideal),
      });

      currentDate = addDays(currentDate, 1);
    }

    return { dataPoints, totalTasks };
  }

  private async getTimeTracked(config: TimeTrackedConfig): Promise<TimeTrackedData> {
    const { projectId, userId, dateRange } = config;

    const where: Prisma.TimeEntryWhereInput = {};
    if (projectId) where.task = { projectId };
    if (userId) where.userId = userId;
    if (dateRange) {
      where.startTime = {
        gte: new Date(dateRange.start),
        lte: new Date(dateRange.end),
      };
    }

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
    });

    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableMinutes = entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    // Group by day
    const byDay = groupBy(entries, (e) =>
      format(e.startTime, 'yyyy-MM-dd')
    );

    return {
      totalMinutes,
      billableMinutes,
      byDay: Object.entries(byDay).map(([date, items]) => ({
        date,
        minutes: items.reduce((sum, e) => sum + (e.duration || 0), 0),
      })),
    };
  }
}
```

---

## Automation Engine

### Automation Service

```typescript
// automation.service.ts
@Injectable()
export class AutomationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly automationQueue: Queue,
  ) {}

  // Called by event emitters throughout the app
  async checkTriggers(event: AutomationEvent) {
    // Find matching automations
    const automations = await this.prisma.automation.findMany({
      where: {
        isActive: true,
        OR: [
          { workspaceId: event.workspaceId, projectId: null },
          { projectId: event.projectId },
        ],
        triggers: {
          some: {
            type: event.triggerType,
          },
        },
      },
      include: {
        triggers: true,
        actions: { orderBy: { position: 'asc' } },
      },
    });

    for (const automation of automations) {
      // Check if trigger conditions match
      const trigger = automation.triggers.find(
        (t) => t.type === event.triggerType
      );

      if (trigger && this.matchesTriggerConditions(trigger, event)) {
        // Queue automation execution
        await this.automationQueue.add('execute', {
          automationId: automation.id,
          event,
        });
      }
    }
  }

  private matchesTriggerConditions(
    trigger: AutomationTrigger,
    event: AutomationEvent,
  ): boolean {
    const config = trigger.config as TriggerConfig;

    switch (trigger.type) {
      case 'TASK_STATUS_CHANGED':
        return (
          (!config.fromStatus || config.fromStatus === event.data.fromStatus) &&
          (!config.toStatus || config.toStatus === event.data.toStatus)
        );

      case 'TASK_ASSIGNED':
        return !config.assigneeId || config.assigneeId === event.data.assigneeId;

      case 'TASK_PRIORITY_CHANGED':
        return !config.priority || config.priority === event.data.priority;

      default:
        return true;
    }
  }
}

// automation.processor.ts
@Processor('automation')
export class AutomationProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly taskService: TaskService,
    private readonly notificationService: NotificationService,
    private readonly slackService: SlackService,
    private readonly webhookService: WebhookService,
  ) {}

  @Process('execute')
  async executeAutomation(
    job: Job<{ automationId: string; event: AutomationEvent }>,
  ) {
    const { automationId, event } = job.data;
    const startTime = Date.now();
    const actionsRun: ActionResult[] = [];
    let status: AutomationLogStatus = 'SUCCESS';
    let error: string | undefined;

    try {
      const automation = await this.prisma.automation.findUnique({
        where: { id: automationId },
        include: { actions: { orderBy: { position: 'asc' } } },
      });

      if (!automation || !automation.isActive) {
        status = 'SKIPPED';
        return;
      }

      // Execute actions in order
      for (const action of automation.actions) {
        try {
          const result = await this.executeAction(action, event);
          actionsRun.push({ actionId: action.id, success: true, result });
        } catch (actionError) {
          actionsRun.push({
            actionId: action.id,
            success: false,
            error: actionError.message,
          });
          status = 'PARTIAL';
        }
      }

      // Update run count
      await this.prisma.automation.update({
        where: { id: automationId },
        data: {
          runCount: { increment: 1 },
          lastRunAt: new Date(),
        },
      });
    } catch (e) {
      status = 'FAILED';
      error = e.message;
    } finally {
      // Log execution
      await this.prisma.automationLog.create({
        data: {
          automationId,
          status,
          triggeredBy: event,
          actionsRun,
          error,
          duration: Date.now() - startTime,
        },
      });
    }
  }

  private async executeAction(
    action: AutomationAction,
    event: AutomationEvent,
  ): Promise<unknown> {
    const config = action.config as ActionConfig;

    switch (action.type) {
      case 'UPDATE_TASK_STATUS':
        return this.taskService.updateTask(event.data.taskId, {
          status: config.status,
        });

      case 'ASSIGN_TASK':
        return this.taskService.updateTask(event.data.taskId, {
          assigneeId: config.assigneeId,
        });

      case 'ADD_LABEL':
        return this.taskService.addLabel(event.data.taskId, config.labelId);

      case 'SEND_NOTIFICATION':
        return this.notificationService.createNotification({
          userId: this.resolveUserId(config.userId, event),
          type: 'SYSTEM_ANNOUNCEMENT',
          title: this.interpolate(config.title, event),
          body: this.interpolate(config.body, event),
        });

      case 'SEND_SLACK_MESSAGE':
        return this.slackService.sendMessage({
          channel: config.channel,
          text: this.interpolate(config.message, event),
        });

      case 'CALL_WEBHOOK':
        return this.webhookService.call({
          url: config.url,
          method: config.method || 'POST',
          body: this.interpolate(config.body, event),
        });

      case 'ADD_COMMENT':
        return this.prisma.comment.create({
          data: {
            taskId: event.data.taskId,
            authorId: 'system',
            content: this.interpolate(config.content, event),
          },
        });

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Replace {{variables}} in text
  private interpolate(template: string, event: AutomationEvent): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return event.data[key] ?? match;
    });
  }
}
```

### Automation Event Types

```typescript
// automation.types.ts
interface AutomationEvent {
  triggerType: TriggerType;
  workspaceId: string;
  projectId?: string;
  data: Record<string, unknown>;
}

interface TriggerConfig {
  // TASK_STATUS_CHANGED
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;

  // TASK_ASSIGNED
  assigneeId?: string;

  // TASK_PRIORITY_CHANGED
  priority?: TaskPriority;

  // SCHEDULED
  cron?: string; // "0 9 * * 1" = Every Monday 9am

  // TIME_ELAPSED
  delayMinutes?: number;
  afterEvent?: TriggerType;
}

interface ActionConfig {
  // UPDATE_TASK_STATUS
  status?: TaskStatus;

  // ASSIGN_TASK
  assigneeId?: string;

  // ADD_LABEL
  labelId?: string;

  // SEND_NOTIFICATION
  userId?: string; // or "{{assigneeId}}"
  title?: string;
  body?: string;

  // SEND_SLACK_MESSAGE
  channel?: string;
  message?: string;

  // CALL_WEBHOOK
  url?: string;
  method?: string;
  body?: string;

  // ADD_COMMENT
  content?: string;
}
```

---

## Frontend Components

### Dashboard Components

```
src/components/dashboard/
├── Dashboard.tsx             # Main dashboard container
├── DashboardHeader.tsx       # Title, actions, date range
├── DashboardGrid.tsx         # react-grid-layout container
├── WidgetContainer.tsx       # Draggable widget wrapper
├── WidgetSettings.tsx        # Widget config modal
├── AddWidgetModal.tsx        # Widget gallery
└── widgets/
    ├── TaskCountWidget.tsx
    ├── TaskByStatusWidget.tsx
    ├── BurndownWidget.tsx
    ├── TimeTrackedWidget.tsx
    ├── OverdueTasksWidget.tsx
    ├── ActivityFeedWidget.tsx
    ├── GoalProgressWidget.tsx
    └── MarkdownWidget.tsx
```

**Dashboard Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📊 Project Dashboard            [Date: This Sprint ▼] [+ Add Widget] [⚙️]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │ Tasks Overview      │  │ Tasks by Status     │  │ Team Workload       │  │
│  │                     │  │                     │  │                     │  │
│  │  Total:    47       │  │    ████ Done 60%    │  │ Alice    ████████   │  │
│  │  Done:     28       │  │    ██ In Prog 25%   │  │ Bob      ████       │  │
│  │  In Prog:  12       │  │    █ Todo 15%       │  │ Charlie  ██████     │  │
│  │  Todo:      7       │  │                     │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  └─────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────┐  ┌─────────────────────────┐ │
│  │ Sprint Burndown                           │  │ Overdue Tasks          │ │
│  │                                           │  │                        │ │
│  │  30│ ╲                                    │  │ 🔴 Fix login bug       │ │
│  │    │  ╲___                                │  │    Due: Jan 15         │ │
│  │  20│     ╲__  ← Ideal                     │  │                        │ │
│  │    │        ╲___                          │  │ 🔴 Update API docs     │ │
│  │  10│   ──────── ← Actual                  │  │    Due: Jan 14         │ │
│  │    │                                      │  │                        │ │
│  │   0└──────────────────────                │  │ [View all 3 →]         │ │
│  │    Jan 8    Jan 15    Jan 22              │  │                        │ │
│  └───────────────────────────────────────────┘  └─────────────────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Recent Activity                                                       │  │
│  │                                                                       │  │
│  │ 👤 Alice completed "Setup CI/CD"                           2 min ago  │  │
│  │ 💬 Bob commented on "Dark mode implementation"             15 min ago │  │
│  │ 📋 Charlie created task "API rate limiting"                1 hour ago │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Goals Components

```
src/components/goals/
├── GoalsList.tsx             # List of goals
├── GoalCard.tsx              # Goal with progress
├── GoalDetail.tsx            # Full goal view
├── KeyResultItem.tsx         # KR with progress bar
├── KeyResultUpdate.tsx       # Log progress modal
├── CreateGoalModal.tsx       # New goal form
├── LinkTaskModal.tsx         # Link tasks to KR
└── GoalTimeline.tsx          # Visual timeline
```

**Goals Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🎯 Goals & OKRs                         Q1 2024           [+ Create Goal]   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Improve Developer Experience                                    65%   │  │
│  │ Owner: Alice          Status: 🟢 On Track         Due: Mar 31, 2024  │  │
│  ├───────────────────────────────────────────────────────────────────────┤  │
│  │                                                                       │  │
│  │  KR1: Reduce build time from 5min to under 2min                      │  │
│  │       ████████████████░░░░░░░░░░░░░░░░  Current: 2.8min  Target: 2min│  │
│  │       Progress: 73%                                        [Update]  │  │
│  │                                                                       │  │
│  │  KR2: Achieve 90% test coverage                                      │  │
│  │       █████████████░░░░░░░░░░░░░░░░░░░  Current: 78%    Target: 90%  │  │
│  │       Progress: 65%                                        [Update]  │  │
│  │                                                                       │  │
│  │  KR3: Onboard 5 new team members successfully                        │  │
│  │       ████████░░░░░░░░░░░░░░░░░░░░░░░░  Current: 3       Target: 5   │  │
│  │       Progress: 60%      Linked tasks: 8                   [Update]  │  │
│  │                                                                       │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Launch Mobile App                                               40%   │  │
│  │ Owner: Bob            Status: 🟡 At Risk          Due: Feb 28, 2024  │  │
│  │                                                            [Expand]  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Automation Components

```
src/components/automation/
├── AutomationList.tsx        # List of automations
├── AutomationCard.tsx        # Automation summary
├── AutomationBuilder.tsx     # Visual builder
├── TriggerSelector.tsx       # Choose trigger type
├── TriggerConfig.tsx         # Configure trigger
├── ActionSelector.tsx        # Choose action type
├── ActionConfig.tsx          # Configure action
├── AutomationLogs.tsx        # Execution history
└── AutomationTest.tsx        # Test run UI
```

**Automation Builder Mockup:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ Create Automation                                                    [X] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Name: [Auto-assign QA tasks                                           ]   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ WHEN (Trigger)                                                      │   │
│  │                                                                     │   │
│  │  [Task status changes ▼]                                            │   │
│  │                                                                     │   │
│  │  From: [In Progress ▼]    To: [Done ▼]                             │   │
│  │                                                                     │   │
│  │  [+ Add condition]                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                            │                                                │
│                            ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ THEN (Actions)                                                      │   │
│  │                                                                     │   │
│  │  1. [Create subtask ▼]                                              │   │
│  │     Title: [QA Review: {{task.title}}                          ]    │   │
│  │     Assign to: [QA Team Lead ▼]                                     │   │
│  │                                                           [🗑️]      │   │
│  │                                                                     │   │
│  │  2. [Add label ▼]                                                   │   │
│  │     Label: [needs-qa ▼]                                             │   │
│  │                                                           [🗑️]      │   │
│  │                                                                     │   │
│  │  [+ Add action]                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│                              [Cancel]  [Test Run]  [Save Automation]        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Template Components

```
src/components/templates/
├── TemplateGallery.tsx       # Browse templates
├── TemplateCard.tsx          # Template preview
├── TemplatePreview.tsx       # Full preview modal
├── ApplyTemplateModal.tsx    # Configure and apply
├── SaveAsTemplateModal.tsx   # Save project as template
└── TemplateBuilder.tsx       # Create/edit template
```

### Integration Components

```
src/components/integrations/
├── IntegrationsList.tsx      # Available integrations
├── IntegrationCard.tsx       # Integration status
├── IntegrationSetup.tsx      # OAuth/config flow
├── SlackIntegration.tsx      # Slack-specific config
├── GitHubIntegration.tsx     # GitHub-specific config
├── WebhookManager.tsx        # Manage webhooks
└── IntegrationLogs.tsx       # Sync history
```

---

## Chart Library: Recharts

```typescript
// BurndownWidget.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

function BurndownWidget({ data }: { data: BurndownData }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.dataPoints}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => format(new Date(date), 'MMM d')}
        />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="ideal"
          stroke="#94a3b8"
          strokeDasharray="5 5"
          name="Ideal"
        />
        <Line
          type="monotone"
          dataKey="remaining"
          stroke="#6366f1"
          strokeWidth={2}
          name="Remaining"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

---

## Integration Examples

### Slack Integration

```typescript
// slack.service.ts
@Injectable()
export class SlackService {
  private client: WebClient;

  constructor(private readonly configService: ConfigService) {
    this.client = new WebClient(configService.get('SLACK_BOT_TOKEN'));
  }

  async sendMessage(options: SlackMessageOptions): Promise<void> {
    await this.client.chat.postMessage({
      channel: options.channel,
      text: options.text,
      blocks: options.blocks,
      attachments: options.attachments,
    });
  }

  async sendTaskNotification(
    channel: string,
    task: Task,
    action: string,
    actor: User,
  ): Promise<void> {
    await this.sendMessage({
      channel,
      text: `${actor.name} ${action} task: ${task.title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${actor.name}* ${action} task:\n<${APP_URL}/tasks/${task.id}|${task.title}>`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Status: ${task.status} | Priority: ${task.priority}`,
            },
          ],
        },
      ],
    });
  }
}
```

### GitHub Integration

```typescript
// github.service.ts
@Injectable()
export class GitHubService {
  async handleWebhook(event: string, payload: GitHubPayload): Promise<void> {
    switch (event) {
      case 'pull_request':
        await this.handlePullRequest(payload);
        break;
      case 'push':
        await this.handlePush(payload);
        break;
      case 'issues':
        await this.handleIssue(payload);
        break;
    }
  }

  private async handlePullRequest(payload: PRPayload): Promise<void> {
    // Find linked task by PR title or branch name
    // Pattern: "feat/PM-123-feature-name" or "[PM-123]"
    const taskMatch = payload.pull_request.head.ref.match(/PM-(\d+)/);

    if (taskMatch) {
      const taskId = taskMatch[1];

      if (payload.action === 'opened') {
        // Add comment to task
        await this.prisma.comment.create({
          data: {
            taskId,
            authorId: 'github-bot',
            content: `Pull request opened: [${payload.pull_request.title}](${payload.pull_request.html_url})`,
          },
        });
      }

      if (payload.action === 'closed' && payload.pull_request.merged) {
        // Update task status
        await this.taskService.updateTask(taskId, { status: 'DONE' });

        // Trigger automation
        await this.automationService.checkTriggers({
          triggerType: 'TASK_COMPLETED',
          data: { taskId },
        });
      }
    }
  }
}
```

---

## Testing Checklist

### Unit Tests

- [ ] Widget data calculations
- [ ] Goal progress aggregation
- [ ] Automation trigger matching
- [ ] Template application
- [ ] Report generation

### Integration Tests

- [ ] Dashboard CRUD with widgets
- [ ] Goal with key results flow
- [ ] Automation execution
- [ ] Template create and apply
- [ ] Webhook delivery

### E2E Tests

- [ ] Create dashboard and add widgets
- [ ] Create goal, add KRs, log updates
- [ ] Build and test automation
- [ ] Apply template to create project
- [ ] Configure Slack integration

---

## Success Metrics

- [ ] Dashboards render with live data
- [ ] Widgets update in real-time
- [ ] Goals show accurate progress
- [ ] Key results link to tasks
- [ ] Automations trigger correctly
- [ ] Actions execute in order
- [ ] Templates create complete projects
- [ ] Integrations sync data
- [ ] Webhooks deliver reliably
- [ ] Reports export correctly
