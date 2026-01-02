import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CurrentUser } from '../common/decorators';
import { ProjectMemberGuard } from '../common/guards/project-member.guard';
import { ProjectOwnerGuard } from '../common/guards/project-owner.guard';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from '@pm/shared';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: { sub: string }) {
    return this.projectsService.findAll(user.sub);
  }

  @Post()
  create(@CurrentUser() user: { sub: string }, @Body() dto: CreateProjectDto) {
    return this.projectsService.create(user.sub, dto);
  }

  @Get(':id')
  @UseGuards(ProjectMemberGuard)
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(ProjectOwnerGuard)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(ProjectOwnerGuard)
  delete(@Param('id') id: string) {
    return this.projectsService.delete(id);
  }

  @Post(':id/members')
  @UseGuards(ProjectOwnerGuard)
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.projectsService.addMember(id, dto.email);
  }

  @Delete(':id/members/:userId')
  @UseGuards(ProjectOwnerGuard)
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectsService.removeMember(id, userId);
  }
}
