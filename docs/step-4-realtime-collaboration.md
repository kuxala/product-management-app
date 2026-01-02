# Step 4: Real-time Collaboration & Notifications

## Overview

Enable real-time updates and robust notification system for seamless team collaboration.

## Goals

- Implement WebSocket-based real-time updates
- Create comprehensive notification system
- Add @mentions in comments and descriptions
- Build activity feed for projects
- Show presence indicators (who's online/viewing)
- Support email notifications with preferences

---

## Architecture

### Real-time Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Socket.io Client  ←→  Zustand Store  ←→  React Query    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ WebSocket
┌─────────────────────────────────────────────────────────────────┐
│                          Backend                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   NestJS    │───▶│   Redis     │───▶│  Socket.io Gateway  │  │
│  │   Services  │    │   Pub/Sub   │    │                     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Bull Queue (Redis)                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐              │    │
│  │  │Notification│ │  Email   │  │ Activity │              │    │
│  │  │  Queue    │  │  Queue   │  │  Queue   │              │    │
│  │  └──────────┘  └──────────┘  └──────────┘              │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Notifications

```prisma
// User notification
model Notification {
  id          String           @id @default(uuid())
  userId      String           // Recipient
  type        NotificationType
  title       String
  body        String?
  data        Json?            // Additional context
  isRead      Boolean          @default(false)
  readAt      DateTime?
  actorId     String?          // User who triggered
  targetType  String?          // task, project, comment
  targetId    String?
  createdAt   DateTime         @default(now())

  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  actor       User?            @relation("NotificationActor", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([userId, isRead])
  @@index([userId, createdAt])
  @@index([targetType, targetId])
}

enum NotificationType {
  // Task notifications
  TASK_ASSIGNED
  TASK_UNASSIGNED
  TASK_UPDATED
  TASK_COMPLETED
  TASK_DUE_SOON
  TASK_OVERDUE
  TASK_COMMENT
  TASK_MENTION

  // Project notifications
  PROJECT_INVITE
  PROJECT_REMOVED
  PROJECT_UPDATED

  // Workspace notifications
  WORKSPACE_INVITE
  WORKSPACE_ROLE_CHANGED

  // System
  SYSTEM_ANNOUNCEMENT
}
```

### User Preferences

```prisma
// User notification preferences
model UserPreferences {
  id                    String   @id @default(uuid())
  userId                String   @unique

  // Email preferences
  emailEnabled          Boolean  @default(true)
  emailFrequency        EmailFrequency @default(INSTANT)
  emailTaskAssigned     Boolean  @default(true)
  emailTaskUpdated      Boolean  @default(false)
  emailTaskComment      Boolean  @default(true)
  emailTaskMention      Boolean  @default(true)
  emailTaskDueSoon      Boolean  @default(true)
  emailProjectInvite    Boolean  @default(true)
  emailDigestTime       String?  // HH:MM for daily digest

  // In-app preferences
  desktopNotifications  Boolean  @default(true)
  soundEnabled          Boolean  @default(false)

  // UI preferences
  theme                 String   @default("system")
  language              String   @default("en")
  timezone              String   @default("UTC")

  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  user                  User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum EmailFrequency {
  INSTANT   // Send immediately
  HOURLY    // Batch hourly
  DAILY     // Daily digest
  WEEKLY    // Weekly summary
  NONE      // No emails
}
```

### Watchers

```prisma
// Task watchers (subscribed for updates)
model Watcher {
  id        String   @id @default(uuid())
  userId    String
  taskId    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@unique([userId, taskId])
  @@index([taskId])
}
```

### Activity Log

```prisma
// Activity log for audit trail
model Activity {
  id          String       @id @default(uuid())
  type        ActivityType
  actorId     String
  targetType  String       // task, project, comment, etc.
  targetId    String
  targetTitle String?      // Cached title for display
  projectId   String?      // For filtering
  workspaceId String?
  metadata    Json?        // Additional context
  createdAt   DateTime     @default(now())

  actor       User         @relation(fields: [actorId], references: [id], onDelete: Cascade)
  project     Project?     @relation(fields: [projectId], references: [id], onDelete: SetNull)
  workspace   Workspace?   @relation(fields: [workspaceId], references: [id], onDelete: SetNull)

  @@index([projectId, createdAt])
  @@index([workspaceId, createdAt])
  @@index([actorId, createdAt])
  @@index([targetType, targetId])
}

enum ActivityType {
  // Tasks
  TASK_CREATED
  TASK_UPDATED
  TASK_DELETED
  TASK_MOVED
  TASK_ASSIGNED
  TASK_UNASSIGNED
  TASK_STATUS_CHANGED
  TASK_PRIORITY_CHANGED
  TASK_DUE_DATE_CHANGED

  // Comments
  COMMENT_ADDED
  COMMENT_EDITED
  COMMENT_DELETED

  // Attachments
  ATTACHMENT_ADDED
  ATTACHMENT_DELETED

  // Checklists
  CHECKLIST_ITEM_COMPLETED
  CHECKLIST_ITEM_UNCOMPLETED

  // Time
  TIME_LOGGED

  // Project
  PROJECT_CREATED
  PROJECT_UPDATED
  PROJECT_DELETED
  MEMBER_ADDED
  MEMBER_REMOVED

  // Space
  SPACE_CREATED
  SPACE_UPDATED
}
```

### Mentions

```prisma
// Track mentions for notifications
model Mention {
  id          String   @id @default(uuid())
  userId      String   // Mentioned user
  mentionedBy String   // Who mentioned
  sourceType  String   // comment, task_description
  sourceId    String
  createdAt   DateTime @default(now())

  user        User     @relation("MentionedUser", fields: [userId], references: [id], onDelete: Cascade)
  mentioner   User     @relation("Mentioner", fields: [mentionedBy], references: [id], onDelete: Cascade)

  @@unique([userId, sourceType, sourceId])
  @@index([userId])
}
```

---

## API Endpoints

### Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/notifications` | List notifications | User |
| GET | `/api/notifications/unread-count` | Get unread count | User |
| PATCH | `/api/notifications/:id/read` | Mark as read | User |
| POST | `/api/notifications/mark-all-read` | Mark all read | User |
| DELETE | `/api/notifications/:id` | Delete notification | User |
| DELETE | `/api/notifications` | Clear all | User |

### Preferences

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/preferences` | Get preferences | User |
| PATCH | `/api/users/preferences` | Update preferences | User |

### Watchers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/watch` | Watch task | Member |
| DELETE | `/api/tasks/:taskId/watch` | Unwatch task | Member |
| GET | `/api/tasks/:taskId/watchers` | List watchers | Member |

### Activity

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/projects/:projectId/activity` | Project activity | Member |
| GET | `/api/tasks/:taskId/activity` | Task activity | Member |
| GET | `/api/workspaces/:workspaceId/activity` | Workspace activity | Member |
| GET | `/api/users/activity` | User's activity | User |

---

## WebSocket Implementation

### Gateway Setup (NestJS)

```typescript
// events.gateway.ts
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  },
  namespace: '/ws',
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly authService: AuthService,
    private readonly presenceService: PresenceService,
    private readonly redisService: RedisService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Authenticate connection
      const token = client.handshake.auth.token;
      const user = await this.authService.verifyToken(token);

      client.data.user = user;

      // Track online status
      await this.presenceService.setOnline(user.id);

      // Join user's personal room
      client.join(`user:${user.id}`);

      // Join workspace rooms
      const workspaces = await this.getUservWorkspaces(user.id);
      for (const ws of workspaces) {
        client.join(`workspace:${ws.id}`);
      }

      this.logger.log(`Client connected: ${user.id}`);
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (user) {
      await this.presenceService.setOffline(user.id);
      this.logger.log(`Client disconnected: ${user.id}`);
    }
  }

  // Join project room when viewing
  @SubscribeMessage('join:project')
  async handleJoinProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const user = client.data.user;

    // Verify membership
    const isMember = await this.verifyProjectMember(user.id, data.projectId);
    if (!isMember) return;

    client.join(`project:${data.projectId}`);

    // Track presence in project
    await this.presenceService.joinProject(user.id, data.projectId);

    // Notify others
    this.server.to(`project:${data.projectId}`).emit('presence:joined', {
      userId: user.id,
      projectId: data.projectId,
    });
  }

  @SubscribeMessage('leave:project')
  async handleLeaveProject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string },
  ) {
    const user = client.data.user;

    client.leave(`project:${data.projectId}`);
    await this.presenceService.leaveProject(user.id, data.projectId);

    this.server.to(`project:${data.projectId}`).emit('presence:left', {
      userId: user.id,
      projectId: data.projectId,
    });
  }

  // Join task room when viewing task detail
  @SubscribeMessage('join:task')
  async handleJoinTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = client.data.user;
    client.join(`task:${data.taskId}`);

    await this.presenceService.viewingTask(user.id, data.taskId);

    this.server.to(`task:${data.taskId}`).emit('presence:viewing', {
      userId: user.id,
      taskId: data.taskId,
    });
  }

  @SubscribeMessage('leave:task')
  async handleLeaveTask(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string },
  ) {
    const user = client.data.user;
    client.leave(`task:${data.taskId}`);

    await this.presenceService.leftTask(user.id, data.taskId);

    this.server.to(`task:${data.taskId}`).emit('presence:left-task', {
      userId: user.id,
      taskId: data.taskId,
    });
  }
}
```

### Event Emitter Service

```typescript
// realtime.service.ts
@Injectable()
export class RealtimeService {
  constructor(
    private readonly eventsGateway: EventsGateway,
    private readonly redisService: RedisService,
  ) {}

  // Emit task update to project room
  emitTaskUpdate(projectId: string, task: Task, action: string) {
    this.eventsGateway.server
      .to(`project:${projectId}`)
      .emit('task:updated', { task, action });
  }

  // Emit to specific task room
  emitTaskDetailUpdate(taskId: string, data: unknown) {
    this.eventsGateway.server
      .to(`task:${taskId}`)
      .emit('task:detail-updated', data);
  }

  // Emit comment to task room
  emitNewComment(taskId: string, comment: Comment) {
    this.eventsGateway.server
      .to(`task:${taskId}`)
      .emit('comment:added', comment);
  }

  // Emit notification to user
  emitNotification(userId: string, notification: Notification) {
    this.eventsGateway.server
      .to(`user:${userId}`)
      .emit('notification', notification);
  }

  // Emit to workspace
  emitWorkspaceEvent(workspaceId: string, event: string, data: unknown) {
    this.eventsGateway.server
      .to(`workspace:${workspaceId}`)
      .emit(event, data);
  }
}
```

### Client Socket Hook

```typescript
// useSocket.ts
import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addNotification, incrementUnread } = useNotificationStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io(`${API_URL}/ws`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    // Handle task updates
    socket.on('task:updated', ({ task, action }) => {
      // Invalidate task queries to refetch
      queryClient.invalidateQueries(['tasks', task.projectId]);

      // Or optimistically update cache
      queryClient.setQueryData(['task', task.id], task);
    });

    // Handle new comments
    socket.on('comment:added', (comment) => {
      queryClient.invalidateQueries(['comments', comment.taskId]);
    });

    // Handle notifications
    socket.on('notification', (notification) => {
      addNotification(notification);
      incrementUnread();

      // Show browser notification if enabled
      if (Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.body,
          icon: '/notification-icon.png',
        });
      }
    });

    // Handle presence updates
    socket.on('presence:joined', ({ userId, projectId }) => {
      queryClient.setQueryData(
        ['presence', projectId],
        (old: string[] = []) => [...new Set([...old, userId])]
      );
    });

    socket.on('presence:left', ({ userId, projectId }) => {
      queryClient.setQueryData(
        ['presence', projectId],
        (old: string[] = []) => old.filter((id) => id !== userId)
      );
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token]);

  const joinProject = useCallback((projectId: string) => {
    socketRef.current?.emit('join:project', { projectId });
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    socketRef.current?.emit('leave:project', { projectId });
  }, []);

  const joinTask = useCallback((taskId: string) => {
    socketRef.current?.emit('join:task', { taskId });
  }, []);

  const leaveTask = useCallback((taskId: string) => {
    socketRef.current?.emit('leave:task', { taskId });
  }, []);

  return {
    socket: socketRef.current,
    joinProject,
    leaveProject,
    joinTask,
    leaveTask,
  };
}
```

---

## Notification Service

### Backend Service

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
    private readonly emailQueue: Queue,
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        body: data.body,
        data: data.data,
        actorId: data.actorId,
        targetType: data.targetType,
        targetId: data.targetId,
      },
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Send real-time notification
    this.realtimeService.emitNotification(data.userId, notification);

    // Queue email notification if enabled
    const prefs = await this.getUserPreferences(data.userId);
    if (this.shouldSendEmail(prefs, data.type)) {
      await this.queueEmailNotification(notification, prefs);
    }

    return notification;
  }

  async notifyTaskAssigned(task: Task, assigneeId: string, actorId: string) {
    await this.createNotification({
      userId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title: 'Task Assigned',
      body: `You were assigned to "${task.title}"`,
      actorId,
      targetType: 'task',
      targetId: task.id,
      data: { projectId: task.projectId },
    });
  }

  async notifyTaskComment(
    task: Task,
    comment: Comment,
    excludeUserId: string,
  ) {
    // Notify task assignee
    if (task.assigneeId && task.assigneeId !== excludeUserId) {
      await this.createNotification({
        userId: task.assigneeId,
        type: NotificationType.TASK_COMMENT,
        title: 'New Comment',
        body: `${comment.author.name} commented on "${task.title}"`,
        actorId: comment.authorId,
        targetType: 'task',
        targetId: task.id,
      });
    }

    // Notify watchers
    const watchers = await this.prisma.watcher.findMany({
      where: { taskId: task.id, userId: { not: excludeUserId } },
    });

    for (const watcher of watchers) {
      await this.createNotification({
        userId: watcher.userId,
        type: NotificationType.TASK_COMMENT,
        title: 'New Comment',
        body: `${comment.author.name} commented on "${task.title}"`,
        actorId: comment.authorId,
        targetType: 'task',
        targetId: task.id,
      });
    }
  }

  async notifyMentions(
    mentions: string[],
    sourceType: string,
    sourceId: string,
    content: string,
    actor: User,
    task: Task,
  ) {
    for (const userId of mentions) {
      // Save mention record
      await this.prisma.mention.upsert({
        where: {
          userId_sourceType_sourceId: {
            userId,
            sourceType,
            sourceId,
          },
        },
        create: {
          userId,
          mentionedBy: actor.id,
          sourceType,
          sourceId,
        },
        update: {},
      });

      // Create notification
      await this.createNotification({
        userId,
        type: NotificationType.TASK_MENTION,
        title: 'You were mentioned',
        body: `${actor.name} mentioned you in "${task.title}"`,
        actorId: actor.id,
        targetType: 'task',
        targetId: task.id,
        data: { preview: content.substring(0, 100) },
      });
    }
  }

  private async queueEmailNotification(
    notification: Notification,
    prefs: UserPreferences,
  ) {
    if (prefs.emailFrequency === 'INSTANT') {
      await this.emailQueue.add('send-notification-email', {
        notificationId: notification.id,
      });
    }
    // For HOURLY/DAILY, will be batched by scheduled job
  }
}
```

### Email Queue Processor

```typescript
// email.processor.ts
@Processor('email')
export class EmailProcessor {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  @Process('send-notification-email')
  async handleNotificationEmail(job: Job<{ notificationId: string }>) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: job.data.notificationId },
      include: {
        user: true,
        actor: true,
      },
    });

    if (!notification) return;

    await this.mailService.sendNotificationEmail({
      to: notification.user.email,
      subject: notification.title,
      template: 'notification',
      context: {
        userName: notification.user.name,
        actorName: notification.actor?.name,
        title: notification.title,
        body: notification.body,
        actionUrl: this.getActionUrl(notification),
      },
    });
  }

  @Process('send-daily-digest')
  async handleDailyDigest(job: Job<{ userId: string }>) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: job.data.userId,
        createdAt: { gte: subDays(new Date(), 1) },
      },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    });

    if (notifications.length === 0) return;

    const user = await this.prisma.user.findUnique({
      where: { id: job.data.userId },
    });

    await this.mailService.sendDigestEmail({
      to: user.email,
      subject: `Daily Digest: ${notifications.length} updates`,
      template: 'daily-digest',
      context: {
        userName: user.name,
        notifications: notifications.map((n) => ({
          title: n.title,
          body: n.body,
          actor: n.actor?.name,
          time: formatDistanceToNow(n.createdAt),
        })),
      },
    });
  }
}
```

---

## Activity Tracking

### Activity Service

```typescript
// activity.service.ts
@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeService: RealtimeService,
  ) {}

  async logActivity(data: CreateActivityDto): Promise<Activity> {
    const activity = await this.prisma.activity.create({
      data: {
        type: data.type,
        actorId: data.actorId,
        targetType: data.targetType,
        targetId: data.targetId,
        targetTitle: data.targetTitle,
        projectId: data.projectId,
        workspaceId: data.workspaceId,
        metadata: data.metadata,
      },
      include: {
        actor: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Emit to project room
    if (data.projectId) {
      this.realtimeService.emitWorkspaceEvent(
        data.workspaceId,
        'activity:new',
        activity
      );
    }

    return activity;
  }

  async logTaskUpdate(
    task: Task,
    changes: Partial<Task>,
    actorId: string,
  ) {
    const changedFields = Object.keys(changes);

    // Log specific activity types based on what changed
    if (changes.status !== undefined) {
      await this.logActivity({
        type: ActivityType.TASK_STATUS_CHANGED,
        actorId,
        targetType: 'task',
        targetId: task.id,
        targetTitle: task.title,
        projectId: task.projectId,
        metadata: {
          from: task.status,
          to: changes.status,
        },
      });
    }

    if (changes.assigneeId !== undefined) {
      await this.logActivity({
        type: changes.assigneeId
          ? ActivityType.TASK_ASSIGNED
          : ActivityType.TASK_UNASSIGNED,
        actorId,
        targetType: 'task',
        targetId: task.id,
        targetTitle: task.title,
        projectId: task.projectId,
        metadata: {
          assigneeId: changes.assigneeId,
        },
      });
    }

    // Generic update for other fields
    const otherChanges = changedFields.filter(
      (f) => !['status', 'assigneeId'].includes(f)
    );
    if (otherChanges.length > 0) {
      await this.logActivity({
        type: ActivityType.TASK_UPDATED,
        actorId,
        targetType: 'task',
        targetId: task.id,
        targetTitle: task.title,
        projectId: task.projectId,
        metadata: { fields: otherChanges },
      });
    }
  }
}
```

---

## Mention Parsing

### Mention Utility

```typescript
// mention.utils.ts

// Parse @mentions from text
export function parseMentions(content: string): string[] {
  // Match @[User Name](user-id) format (from rich text editor)
  const richMentionRegex = /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g;
  const mentions: string[] = [];

  let match;
  while ((match = richMentionRegex.exec(content)) !== null) {
    mentions.push(match[2]); // User ID
  }

  return [...new Set(mentions)]; // Dedupe
}

// Replace mention markers with HTML for display
export function renderMentions(
  content: string,
  users: Map<string, User>
): string {
  return content.replace(
    /@\[([^\]]+)\]\(([a-f0-9-]+)\)/g,
    (match, name, userId) => {
      const user = users.get(userId);
      return `<span class="mention" data-user-id="${userId}">@${user?.name || name}</span>`;
    }
  );
}
```

### Mention Autocomplete Component

```typescript
// MentionAutocomplete.tsx
import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';

export const mentionSuggestion = {
  items: async ({ query }: { query: string }) => {
    // Fetch team members
    const members = await api.getProjectMembers(projectId);

    return members
      .filter((m) =>
        m.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  },

  render: () => {
    let component: ReactRenderer;
    let popup: ReturnType<typeof tippy>;

    return {
      onStart: (props: SuggestionProps) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        });

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start',
        });
      },

      onUpdate(props: SuggestionProps) {
        component.updateProps(props);
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: SuggestionKeyDownProps) {
        if (props.event.key === 'Escape') {
          popup[0].hide();
          return true;
        }
        return component.ref?.onKeyDown(props);
      },

      onExit() {
        popup[0].destroy();
        component.destroy();
      },
    };
  },
};

// MentionList component
function MentionList({ items, command }: MentionListProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="mention-list">
      {items.map((item, index) => (
        <button
          key={item.id}
          className={index === selectedIndex ? 'is-selected' : ''}
          onClick={() => command({ id: item.id, label: item.name })}
        >
          <Avatar src={item.avatarUrl} size="sm" />
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Frontend Components

### Notification Components

```
src/components/notifications/
├── NotificationCenter.tsx    # Bell icon + dropdown
├── NotificationList.tsx      # List of notifications
├── NotificationItem.tsx      # Single notification
├── NotificationBadge.tsx     # Unread count badge
└── NotificationPreferences.tsx # Settings UI
```

### Notification Center Mockup

```
┌─────────────────────────────────────────┐
│ 🔔 Notifications                    [⚙️]│
├─────────────────────────────────────────┤
│ ○ New                                   │
├─────────────────────────────────────────┤
│ 👤 Alice assigned you to "Fix login"   │
│    2 minutes ago                        │
├─────────────────────────────────────────┤
│ 💬 Bob commented on "Dark mode"         │
│    "I think we should use CSS vars..."  │
│    15 minutes ago                       │
├─────────────────────────────────────────┤
│ ● Earlier                               │
├─────────────────────────────────────────┤
│ ✅ Charlie completed "Setup CI/CD"      │
│    2 hours ago                          │
├─────────────────────────────────────────┤
│ 📋 You were mentioned in "API Design"  │
│    "@you what do you think about..."   │
│    5 hours ago                          │
├─────────────────────────────────────────┤
│           [Mark all as read]            │
└─────────────────────────────────────────┘
```

### Activity Components

```
src/components/activity/
├── ActivityFeed.tsx          # List of activities
├── ActivityItem.tsx          # Single activity
├── ActivityFilters.tsx       # Filter by type/user
└── ActivityTimeline.tsx      # Timeline view
```

### Presence Components

```
src/components/presence/
├── PresenceIndicator.tsx     # Online/offline dot
├── PresenceAvatars.tsx       # Stack of online users
├── ViewingIndicator.tsx      # "X is viewing"
└── TypingIndicator.tsx       # "X is typing..."
```

### Presence Avatars Mockup

```
┌─────────────────────────────────────────┐
│ Project: Web App                        │
│ [🟢👤 Alice] [🟢👤 Bob] [🟡👤 +3]      │
│                                         │
│ Currently viewing:                      │
│ Alice is viewing "Fix login bug"        │
│ Bob is viewing "Add dark mode"          │
└─────────────────────────────────────────┘
```

---

## Infrastructure Setup

### Redis Configuration

```yaml
# docker-compose.yml additions
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

### Environment Variables

```env
# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (using Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@yourapp.com

# Socket.io
SOCKET_IO_CORS_ORIGIN=http://localhost:5173
```

### Bull Queue Setup

```typescript
// queue.module.ts
@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'email' },
      { name: 'activity' },
    ),
  ],
})
export class QueueModule {}
```

---

## Testing Checklist

### Unit Tests

- [ ] Notification creation
- [ ] Mention parsing
- [ ] Activity logging
- [ ] Email frequency filtering
- [ ] Preference validation

### Integration Tests

- [ ] WebSocket connection/auth
- [ ] Room joining/leaving
- [ ] Real-time event emission
- [ ] Notification delivery
- [ ] Email queue processing

### E2E Tests

- [ ] User receives real-time task update
- [ ] @mention triggers notification
- [ ] Email digest generation
- [ ] Presence indicator updates
- [ ] Watch/unwatch task

---

## Success Metrics

- [ ] WebSocket connects reliably
- [ ] Real-time updates appear instantly
- [ ] Notifications deliver within 1 second
- [ ] @mentions work in comments and descriptions
- [ ] Activity feed shows recent changes
- [ ] Presence shows who's online
- [ ] Email notifications respect preferences
- [ ] Unread count updates in real-time
- [ ] Users can watch/unwatch tasks
- [ ] System handles reconnection gracefully
