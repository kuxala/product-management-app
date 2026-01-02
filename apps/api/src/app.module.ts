import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { SpacesModule } from './spaces/spaces.module';
import { ProjectsModule } from './projects/projects.module';
import { TaskListsModule } from './task-lists/task-lists.module';
import { TasksModule } from './tasks/tasks.module';
import { FavoritesModule } from './favorites/favorites.module';
import { JwtAuthGuard } from './common/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    SpacesModule,
    ProjectsModule,
    TaskListsModule,
    TasksModule,
    FavoritesModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
