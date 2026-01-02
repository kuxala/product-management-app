# Step 2: Rich Task System & Custom Fields

## Overview

Transform basic tasks into powerful, flexible work items with custom fields, comments, attachments, time tracking, and dependencies.

## Goals

- Enable custom fields for flexible task metadata
- Add threaded comments for collaboration
- Support file attachments with previews
- Implement time tracking with estimates
- Create task dependencies for workflow management
- Add checklists for task breakdown
- Support labels/tags for categorization

---

## Database Schema

### Custom Fields

```prisma
// Custom field definition (per space or project)
model CustomField {
  id          String          @id @default(uuid())
  name        String
  type        CustomFieldType
  description String?
  required    Boolean         @default(false)
  options     Json?           // For SELECT/MULTI_SELECT types
  spaceId     String?         // Space-level field
  projectId   String?         // Project-level field
  position    Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  space       Space?          @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  project     Project?        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  values      CustomFieldValue[]

  @@index([spaceId])
  @@index([projectId])
}

enum CustomFieldType {
  TEXT          // Single line text
  TEXTAREA      // Multi-line text
  NUMBER        // Numeric value
  DATE          // Date picker
  DATETIME      // Date and time
  SELECT        // Single select dropdown
  MULTI_SELECT  // Multi select
  CHECKBOX      // Boolean
  PEOPLE        // User reference
  URL           // URL with validation
  EMAIL         // Email with validation
  CURRENCY      // Number with currency format
  RATING        // 1-5 star rating
  PROGRESS      // 0-100 percentage
  FORMULA       // Calculated field (future)
}

// Custom field value for a task
model CustomFieldValue {
  id            String      @id @default(uuid())
  taskId        String
  customFieldId String
  value         Json        // Flexible storage for any type
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  task          Task        @relation(fields: [taskId], references: [id], onDelete: Cascade)
  customField   CustomField @relation(fields: [customFieldId], references: [id], onDelete: Cascade)

  @@unique([taskId, customFieldId])
  @@index([customFieldId])
}
```

### Comments

```prisma
// Threaded comments on tasks
model Comment {
  id        String    @id @default(uuid())
  content   String    @db.Text
  taskId    String
  authorId  String
  parentId  String?   // For replies
  isEdited  Boolean   @default(false)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  task      Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[] @relation("CommentReplies")
  reactions Reaction[]

  @@index([taskId])
  @@index([authorId])
  @@index([parentId])
}

// Reactions on comments
model Reaction {
  id        String   @id @default(uuid())
  emoji     String   // Unicode emoji
  commentId String
  userId    String
  createdAt DateTime @default(now())

  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId, emoji])
  @@index([commentId])
}
```

### Attachments

```prisma
// File attachments on tasks
model Attachment {
  id           String   @id @default(uuid())
  filename     String
  originalName String
  mimeType     String
  size         Int      // Bytes
  url          String   // Storage URL (S3, etc.)
  thumbnailUrl String?  // For images
  taskId       String
  uploaderId   String
  createdAt    DateTime @default(now())

  task         Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  uploader     User     @relation(fields: [uploaderId], references: [id], onDelete: SetNull)

  @@index([taskId])
}
```

### Time Tracking

```prisma
// Time entries for tasks
model TimeEntry {
  id          String    @id @default(uuid())
  taskId      String
  userId      String
  description String?
  startTime   DateTime
  endTime     DateTime?
  duration    Int?      // Minutes (calculated or manual)
  billable    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  task        Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([userId])
  @@index([startTime])
}
```

### Dependencies

```prisma
// Task dependencies
model TaskDependency {
  id              String         @id @default(uuid())
  dependentTaskId String         // Task that depends on another
  dependsOnTaskId String         // Task that must be completed first
  type            DependencyType @default(FINISH_TO_START)
  createdAt       DateTime       @default(now())

  dependentTask   Task           @relation("DependentOn", fields: [dependentTaskId], references: [id], onDelete: Cascade)
  dependsOnTask   Task           @relation("DependencyOf", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([dependentTaskId, dependsOnTaskId])
  @@index([dependsOnTaskId])
}

enum DependencyType {
  FINISH_TO_START  // B can't start until A finishes
  START_TO_START   // B can't start until A starts
  FINISH_TO_FINISH // B can't finish until A finishes
  START_TO_FINISH  // B can't finish until A starts
}
```

### Checklists

```prisma
// Checklist on a task
model Checklist {
  id        String          @id @default(uuid())
  name      String
  taskId    String
  position  Int             @default(0)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt

  task      Task            @relation(fields: [taskId], references: [id], onDelete: Cascade)
  items     ChecklistItem[]

  @@index([taskId])
}

// Individual checklist item
model ChecklistItem {
  id          String    @id @default(uuid())
  content     String
  isCompleted Boolean   @default(false)
  checklistId String
  assigneeId  String?
  dueDate     DateTime?
  position    Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  checklist   Checklist @relation(fields: [checklistId], references: [id], onDelete: Cascade)
  assignee    User?     @relation(fields: [assigneeId], references: [id], onDelete: SetNull)

  @@index([checklistId])
}
```

### Labels

```prisma
// Labels (project or space level)
model Label {
  id        String      @id @default(uuid())
  name      String
  color     String      // Hex color
  spaceId   String?
  projectId String?
  createdAt DateTime    @default(now())

  space     Space?      @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  project   Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tasks     TaskLabel[]

  @@index([spaceId])
  @@index([projectId])
}

// Many-to-many relation between tasks and labels
model TaskLabel {
  id        String   @id @default(uuid())
  taskId    String
  labelId   String
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  label     Label    @relation(fields: [labelId], references: [id], onDelete: Cascade)

  @@unique([taskId, labelId])
  @@index([labelId])
}
```

### Updated Task Model

```prisma
model Task {
  id          String       @id @default(uuid())
  title       String
  description String?      @db.Text  // Rich text support
  status      TaskStatus   @default(TODO)
  priority    TaskPriority @default(MEDIUM)
  position    Int          @default(0)
  projectId   String
  taskListId  String?
  assigneeId  String?
  parentId    String?
  dueDate     DateTime?
  startDate   DateTime?              // NEW: For date ranges
  estimate    Int?                   // NEW: Estimated minutes
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  project       Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  taskList      TaskList?         @relation(fields: [taskListId], references: [id], onDelete: SetNull)
  assignee      User?             @relation("AssignedTasks", fields: [assigneeId], references: [id], onDelete: SetNull)
  parent        Task?             @relation("Subtasks", fields: [parentId], references: [id], onDelete: Cascade)
  subtasks      Task[]            @relation("Subtasks")

  // NEW relations
  customFieldValues CustomFieldValue[]
  comments          Comment[]
  attachments       Attachment[]
  timeEntries       TimeEntry[]
  checklists        Checklist[]
  labels            TaskLabel[]
  dependentOn       TaskDependency[]  @relation("DependentOn")
  dependencyOf      TaskDependency[]  @relation("DependencyOf")

  @@index([projectId])
  @@index([taskListId])
  @@index([assigneeId])
  @@index([parentId])
  @@index([status])
  @@index([dueDate])
}
```

---

## API Endpoints

### Custom Fields

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/spaces/:spaceId/custom-fields` | Create space-level field | Admin |
| POST | `/api/projects/:projectId/custom-fields` | Create project-level field | Owner |
| GET | `/api/spaces/:spaceId/custom-fields` | List space fields | Member |
| GET | `/api/projects/:projectId/custom-fields` | List project fields | Member |
| PATCH | `/api/custom-fields/:id` | Update field definition | Admin/Owner |
| DELETE | `/api/custom-fields/:id` | Delete field | Admin/Owner |
| PUT | `/api/tasks/:taskId/custom-fields/:fieldId` | Set field value | Member |
| DELETE | `/api/tasks/:taskId/custom-fields/:fieldId` | Clear field value | Member |

### Comments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/comments` | Add comment | Member |
| GET | `/api/tasks/:taskId/comments` | List comments | Member |
| PATCH | `/api/comments/:id` | Edit comment | Author |
| DELETE | `/api/comments/:id` | Delete comment | Author/Admin |
| POST | `/api/comments/:id/reactions` | Add reaction | Member |
| DELETE | `/api/comments/:id/reactions/:emoji` | Remove reaction | Self |

### Attachments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/attachments` | Upload file | Member |
| GET | `/api/tasks/:taskId/attachments` | List attachments | Member |
| GET | `/api/attachments/:id` | Get attachment URL | Member |
| DELETE | `/api/attachments/:id` | Delete attachment | Uploader/Admin |

### Time Tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/time-entries` | Log time | Member |
| GET | `/api/tasks/:taskId/time-entries` | List entries for task | Member |
| GET | `/api/projects/:projectId/time-entries` | List entries for project | Member |
| PATCH | `/api/time-entries/:id` | Update entry | Owner of entry |
| DELETE | `/api/time-entries/:id` | Delete entry | Owner of entry |
| POST | `/api/time-entries/start` | Start timer | Member |
| POST | `/api/time-entries/:id/stop` | Stop timer | Owner of entry |
| GET | `/api/users/:userId/time-entries` | User's time entries | Self/Admin |

### Dependencies

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/dependencies` | Add dependency | Member |
| GET | `/api/tasks/:taskId/dependencies` | List dependencies | Member |
| DELETE | `/api/dependencies/:id` | Remove dependency | Member |

### Checklists

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks/:taskId/checklists` | Create checklist | Member |
| GET | `/api/tasks/:taskId/checklists` | List checklists | Member |
| PATCH | `/api/checklists/:id` | Update checklist | Member |
| DELETE | `/api/checklists/:id` | Delete checklist | Member |
| POST | `/api/checklists/:id/items` | Add item | Member |
| PATCH | `/api/checklist-items/:id` | Update item | Member |
| DELETE | `/api/checklist-items/:id` | Delete item | Member |
| PATCH | `/api/checklists/:id/reorder` | Reorder items | Member |

### Labels

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/spaces/:spaceId/labels` | Create space label | Admin |
| POST | `/api/projects/:projectId/labels` | Create project label | Owner |
| GET | `/api/spaces/:spaceId/labels` | List space labels | Member |
| GET | `/api/projects/:projectId/labels` | List project labels | Member |
| PATCH | `/api/labels/:id` | Update label | Admin/Owner |
| DELETE | `/api/labels/:id` | Delete label | Admin/Owner |
| POST | `/api/tasks/:taskId/labels/:labelId` | Add label to task | Member |
| DELETE | `/api/tasks/:taskId/labels/:labelId` | Remove label | Member |

---

## DTOs

### Custom Field DTOs

```typescript
interface CreateCustomFieldDto {
  name: string;
  type: CustomFieldType;
  description?: string;
  required?: boolean;
  options?: CustomFieldOption[]; // For SELECT types
}

interface CustomFieldOption {
  id: string;
  label: string;
  color?: string;
}

interface SetCustomFieldValueDto {
  value: unknown; // Type depends on field type
}

interface CustomFieldResponseDto {
  id: string;
  name: string;
  type: CustomFieldType;
  description: string | null;
  required: boolean;
  options: CustomFieldOption[] | null;
  position: number;
}
```

### Comment DTOs

```typescript
interface CreateCommentDto {
  content: string;
  parentId?: string; // For replies
  mentions?: string[]; // User IDs to mention
}

interface UpdateCommentDto {
  content: string;
}

interface CommentResponseDto {
  id: string;
  content: string;
  author: UserSummaryDto;
  parentId: string | null;
  replies: CommentResponseDto[];
  replyCount: number;
  reactions: ReactionSummary[];
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  users: UserSummaryDto[];
  hasReacted: boolean; // Current user
}
```

### Attachment DTOs

```typescript
interface AttachmentResponseDto {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  thumbnailUrl: string | null;
  uploader: UserSummaryDto;
  createdAt: Date;
}

// File upload is multipart/form-data, no DTO needed
```

### Time Entry DTOs

```typescript
interface CreateTimeEntryDto {
  taskId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // Minutes, if manual entry
  billable?: boolean;
}

interface UpdateTimeEntryDto {
  description?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  billable?: boolean;
}

interface TimeEntryResponseDto {
  id: string;
  task: TaskSummaryDto;
  user: UserSummaryDto;
  description: string | null;
  startTime: Date;
  endTime: Date | null;
  duration: number; // Minutes
  billable: boolean;
  createdAt: Date;
}

interface StartTimerDto {
  taskId: string;
  description?: string;
}

interface TimeReportDto {
  totalMinutes: number;
  billableMinutes: number;
  entriesByDay: {
    date: string;
    minutes: number;
    entries: TimeEntryResponseDto[];
  }[];
  entriesByTask: {
    task: TaskSummaryDto;
    minutes: number;
  }[];
  entriesByUser: {
    user: UserSummaryDto;
    minutes: number;
  }[];
}
```

### Dependency DTOs

```typescript
interface CreateDependencyDto {
  dependsOnTaskId: string;
  type?: DependencyType;
}

interface DependencyResponseDto {
  id: string;
  dependentTask: TaskSummaryDto;
  dependsOnTask: TaskSummaryDto;
  type: DependencyType;
  isBlocked: boolean; // dependsOnTask not completed
  createdAt: Date;
}
```

### Checklist DTOs

```typescript
interface CreateChecklistDto {
  name: string;
  items?: CreateChecklistItemDto[];
}

interface CreateChecklistItemDto {
  content: string;
  assigneeId?: string;
  dueDate?: Date;
}

interface UpdateChecklistItemDto {
  content?: string;
  isCompleted?: boolean;
  assigneeId?: string;
  dueDate?: Date;
}

interface ChecklistResponseDto {
  id: string;
  name: string;
  position: number;
  items: ChecklistItemResponseDto[];
  progress: number; // Percentage complete
}

interface ChecklistItemResponseDto {
  id: string;
  content: string;
  isCompleted: boolean;
  assignee: UserSummaryDto | null;
  dueDate: Date | null;
  position: number;
}
```

### Label DTOs

```typescript
interface CreateLabelDto {
  name: string;
  color: string;
}

interface UpdateLabelDto {
  name?: string;
  color?: string;
}

interface LabelResponseDto {
  id: string;
  name: string;
  color: string;
  taskCount: number;
}
```

---

## Frontend Components

### Custom Fields

```
src/components/custom-fields/
├── CustomFieldManager.tsx     # Admin UI to manage fields
├── CustomFieldForm.tsx        # Create/edit field form
├── CustomFieldInput.tsx       # Renders input based on type
├── CustomFieldValue.tsx       # Displays field value
├── FieldTypeIcon.tsx          # Icon for each field type
└── fields/
    ├── TextField.tsx
    ├── NumberField.tsx
    ├── DateField.tsx
    ├── SelectField.tsx
    ├── MultiSelectField.tsx
    ├── CheckboxField.tsx
    ├── PeopleField.tsx
    ├── RatingField.tsx
    └── ProgressField.tsx
```

### Comments

```
src/components/comments/
├── CommentSection.tsx         # Full comment thread
├── CommentItem.tsx            # Single comment with replies
├── CommentInput.tsx           # New comment form
├── CommentEditor.tsx          # Rich text editor for comments
├── MentionAutocomplete.tsx    # @mention dropdown
└── ReactionPicker.tsx         # Emoji reaction selector
```

### Attachments

```
src/components/attachments/
├── AttachmentList.tsx         # List of attachments
├── AttachmentItem.tsx         # Single attachment with preview
├── AttachmentUpload.tsx       # Drag-and-drop upload zone
├── ImagePreview.tsx           # Image lightbox
└── FileIcon.tsx               # Icon based on mime type
```

### Time Tracking

```
src/components/time-tracking/
├── TimeTracker.tsx            # Start/stop timer widget
├── TimeEntryList.tsx          # List of time entries
├── TimeEntryForm.tsx          # Manual time entry
├── TimeEntryItem.tsx          # Single entry row
├── TimerDisplay.tsx           # Running timer display
└── TimeReport.tsx             # Time summary/charts
```

### Dependencies

```
src/components/dependencies/
├── DependencyList.tsx         # List of dependencies
├── DependencyPicker.tsx       # Add dependency modal
├── DependencyBadge.tsx        # Shows blocked status
└── DependencyGraph.tsx        # Visual dependency view (future)
```

### Checklists

```
src/components/checklists/
├── ChecklistSection.tsx       # All checklists for a task
├── Checklist.tsx              # Single checklist
├── ChecklistItem.tsx          # Checkbox item
├── ChecklistProgress.tsx      # Progress bar
└── AddChecklistItem.tsx       # Inline add item
```

### Labels

```
src/components/labels/
├── LabelManager.tsx           # Admin UI for labels
├── LabelPicker.tsx            # Select labels for task
├── LabelBadge.tsx             # Colored label chip
└── LabelFilter.tsx            # Filter by labels
```

### Enhanced Task Detail

```
src/components/task/
├── TaskDetailPanel.tsx        # Main task detail view
├── TaskHeader.tsx             # Title, status, priority
├── TaskDescription.tsx        # Rich text description
├── TaskSidebar.tsx            # Assignee, dates, custom fields
├── TaskActivity.tsx           # Activity feed + comments
└── TaskTabs.tsx               # Tabs: Details, Comments, Activity
```

---

## File Upload Service

### Backend Service

```typescript
@Injectable()
export class FileUploadService {
  constructor(
    private readonly s3Client: S3Client,
    private readonly configService: ConfigService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    const key = `${folder}/${uuid()}-${file.originalname}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }));

    const url = `${this.configService.get('S3_URL')}/${key}`;

    // Generate thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.mimetype.startsWith('image/')) {
      thumbnailUrl = await this.generateThumbnail(file, folder);
    }

    return { url, thumbnailUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: key,
    }));
  }

  private async generateThumbnail(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    const thumbnail = await sharp(file.buffer)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    const key = `${folder}/thumbnails/${uuid()}.jpg`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.configService.get('S3_BUCKET'),
      Key: key,
      Body: thumbnail,
      ContentType: 'image/jpeg',
    }));

    return `${this.configService.get('S3_URL')}/${key}`;
  }
}
```

### Environment Variables

```env
# S3 Configuration (or MinIO for local dev)
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=pm-attachments
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_URL=http://localhost:9000/pm-attachments
```

---

## Rich Text Editor

### Recommended: TipTap

```typescript
// Example TipTap configuration for task descriptions
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import Link from '@tiptap/extension-link';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';

const editor = useEditor({
  extensions: [
    StarterKit,
    Link.configure({ openOnClick: false }),
    Mention.configure({
      HTMLAttributes: { class: 'mention' },
      suggestion: mentionSuggestion,
    }),
    TaskList,
    TaskItem.configure({ nested: true }),
  ],
  content: initialContent,
  onUpdate: ({ editor }) => {
    onChange(editor.getHTML());
  },
});
```

---

## Time Tracking Features

### Timer Widget (Header Bar)

```
┌─────────────────────────────────────────────────────┐
│ ⏱️ 01:23:45  Working on: Fix login bug  [⏹️ Stop]   │
└─────────────────────────────────────────────────────┘
```

### Time Entry Modal

```
┌─────────────────────────────────────────────────────┐
│ Log Time                                        [X] │
├─────────────────────────────────────────────────────┤
│ Task: [Fix login bug                          ▼]   │
│                                                     │
│ Date:     [Jan 15, 2024    📅]                     │
│ Start:    [09:00 AM]  End: [11:30 AM]              │
│ Duration: [2h 30m    ]                              │
│                                                     │
│ Description:                                        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Investigated auth token refresh issue...        │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ [x] Billable                                        │
│                                                     │
│              [Cancel]  [Save Time Entry]            │
└─────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### Unit Tests

- [ ] Custom field CRUD operations
- [ ] Custom field value validation by type
- [ ] Comment CRUD with threading
- [ ] Attachment upload/delete
- [ ] Time entry calculations
- [ ] Dependency cycle detection
- [ ] Checklist progress calculation
- [ ] Label assignment

### Integration Tests

- [ ] Create custom field and set values
- [ ] Upload attachment with thumbnail generation
- [ ] Start/stop timer workflow
- [ ] Add dependency and check blocked status
- [ ] Create checklist from template
- [ ] Filter tasks by labels

### E2E Tests

- [ ] Add comment with @mention
- [ ] Drag-drop file upload
- [ ] Time tracking full workflow
- [ ] Checklist completion updates task

---

## Success Metrics

- [ ] Custom fields can be created at space/project level
- [ ] All field types render and save correctly
- [ ] Comments support threading and reactions
- [ ] Files upload with progress indication
- [ ] Images show thumbnails and previews
- [ ] Timer can run in background
- [ ] Time entries show in reports
- [ ] Dependencies block task completion when appropriate
- [ ] Checklists show progress percentage
- [ ] Labels filter tasks effectively
