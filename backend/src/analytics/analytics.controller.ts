import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../auth/workspace-roles.guard';

@ApiTags('Analytics')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('workspaces/:workspaceId/analytics/health')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'Get workspace health metrics' })
  async getHealth(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getWorkspaceHealth(workspaceId);
  }

  @Get('workspaces/:workspaceId/analytics/workload')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'Get team workload distribution' })
  async getWorkload(@Param('workspaceId') workspaceId: string) {
    return this.analyticsService.getWorkloadDistribution(workspaceId);
  }

  @Get('sprints/:sprintId/analytics/burndown')
  @ApiOperation({ summary: 'Get burndown data for a sprint' })
  async getBurndown(@Param('sprintId') sprintId: string) {
    return this.analyticsService.getSprintBurndown(sprintId);
  }

  @Get('projects/:projectId/analytics/velocity')
  @ApiOperation({ summary: 'Get project velocity over completed sprints' })
  async getVelocity(@Param('projectId') projectId: string) {
    return this.analyticsService.getProjectVelocity(projectId);
  }
}
