import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { APP_GUARD } from '@nestjs/core';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SpacesModule } from './spaces/spaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskListsModule } from './task-lists/task-lists.module';
import { TasksModule } from './tasks/tasks.module';
import { FavoritesModule } from './favorites/favorites.module';
import { LabelsModule } from './labels/labels.module';
import { CommentsModule } from './comments/comments.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { DependenciesModule } from './dependencies/dependencies.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { CustomFieldsModule } from './custom-fields/custom-fields.module';
import { ViewsModule } from './views/views.module';
import { FiltersModule } from './filters/filters.module';
import { UsersModule } from './users/users.module';
import { InvitationsModule } from './invitations/invitations.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    SpacesModule,
    ProjectsModule,
    TaskListsModule,
    TasksModule,
    FavoritesModule,
    LabelsModule,
    CommentsModule,
    AttachmentsModule,
    TimeEntriesModule,
    DependenciesModule,
    ChecklistsModule,
    CustomFieldsModule,
    ViewsModule,
    FiltersModule,
    UsersModule,
    InvitationsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
