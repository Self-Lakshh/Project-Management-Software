import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../auth/workspace-roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Projects, Sprints, Teams')
@Controller()
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // Projects
  @Post('workspaces/:workspaceId/projects')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Create a new project in the workspace' })
  async createProject(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.projectsService.createProject(
      workspaceId,
      req.user.userId,
      body.name,
      body.key,
      body.teamId,
      body.startDate,
      body.endDate,
    );
  }

  @Get('workspaces/:workspaceId/projects')
  @ApiOperation({ summary: 'List all projects in the workspace' })
  async getProjects(@Param('workspaceId') workspaceId: string) {
    return this.projectsService.getProjects(workspaceId);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get details of a specific project' })
  async getProject(@Param('projectId') projectId: string) {
    return this.projectsService.getProject(projectId);
  }

  // Teams
  @Post('workspaces/:workspaceId/teams')
  @Roles('admin')
  @ApiOperation({ summary: 'Create a team in the workspace' })
  async createTeam(
    @Param('workspaceId') workspaceId: string,
    @Body() body: any,
  ) {
    return this.projectsService.createTeam(workspaceId, body.name, body.members);
  }

  @Get('workspaces/:workspaceId/teams')
  @ApiOperation({ summary: 'Get workspace teams' })
  async getTeams(@Param('workspaceId') workspaceId: string) {
    return this.projectsService.getTeams(workspaceId);
  }

  // Sprints
  @Post('workspaces/:workspaceId/projects/:projectId/sprints')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Create a sprint for a project' })
  async createSprint(
    @Param('workspaceId') workspaceId: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.createSprint(
      workspaceId,
      projectId,
      body.name,
      body.goal,
      new Date(body.startDate),
      new Date(body.endDate),
    );
  }

  @Get('projects/:projectId/sprints')
  @ApiOperation({ summary: 'List project sprints' })
  async getSprints(@Param('projectId') projectId: string) {
    return this.projectsService.getSprints(projectId);
  }

  @Post('sprints/:sprintId/start')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Start a sprint' })
  async startSprint(@Param('sprintId') sprintId: string) {
    return this.projectsService.startSprint(sprintId);
  }

  @Post('sprints/:sprintId/complete')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Complete a sprint' })
  async completeSprint(@Param('sprintId') sprintId: string) {
    return this.projectsService.completeSprint(sprintId);
  }
}
