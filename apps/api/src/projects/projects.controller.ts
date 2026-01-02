import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '@pm/shared';

interface AuthUser {
  sub: string;
}

@Controller()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // List all user's projects (across all workspaces)
  @Get('projects')
  findAll(@CurrentUser() user: AuthUser) {
    return this.projectsService.findAll(user.sub);
  }

  // List projects in a space
  @Get('spaces/:spaceId/projects')
  findAllInSpace(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.projectsService.findAllInSpace(spaceId, user.sub);
  }

  // Create project in a space
  @Post('spaces/:spaceId/projects')
  create(
    @Param('spaceId') spaceId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user.sub, spaceId, dto);
  }

  // Get single project
  @Get('projects/:id')
  @UseGuards(ProjectMemberGuard)
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  // Update project
  @Patch('projects/:id')
  @UseGuards(ProjectOwnerGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  // Delete project
  @Delete('projects/:id')
  @UseGuards(ProjectOwnerGuard)
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  // Get project members
  @Get('projects/:id/members')
  @UseGuards(ProjectMemberGuard)
  getMembers(@Param('id') id: string) {
    return this.projectsService.getMembers(id);
  }

  // Add member to project
  @Post('projects/:id/members')
  @UseGuards(ProjectOwnerGuard)
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.projectsService.addMember(id, dto.email);
  }

  // Remove member from project
  @Delete('projects/:id/members/:userId')
  @UseGuards(ProjectOwnerGuard)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}
