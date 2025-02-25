import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { OrgsService } from './orgs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../auth/workspace-roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Workspaces & Orgs')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrgsController {
  constructor(private orgsService: OrgsService) {}

  @Post('orgs')
  @ApiOperation({ summary: 'Create a new organization' })
  async createOrg(@Request() req: any, @Body() body: any) {
    return this.orgsService.createOrg(body.name, req.user.userId);
  }

  @Post('orgs/:orgId/workspaces')
  @ApiOperation({ summary: 'Create a new workspace inside an organization' })
  async createWorkspace(
    @Request() req: any,
    @Param('orgId') orgId: string,
    @Body() body: any,
  ) {
    return this.orgsService.createWorkspace(orgId, body.name, req.user.userId);
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'List all workspaces the authenticated user belongs to' })
  async getWorkspaces(@Request() req: any) {
    return this.orgsService.getWorkspacesForUser(req.user.userId);
  }

  @Get('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Get workspace configurations' })
  async getWorkspaceDetails(@Request() req: any, @Param('workspaceId') workspaceId: string) {
    return this.orgsService.getWorkspaceDetails(workspaceId, req.user.userId);
  }

  @Get('workspaces/:workspaceId/members')
  @ApiOperation({ summary: 'List workspace team members' })
  async getWorkspaceMembers(@Param('workspaceId') workspaceId: string) {
    return this.orgsService.getWorkspaceMembers(workspaceId);
  }

  @Post('workspaces/:workspaceId/invite')
  @UseGuards(WorkspaceRolesGuard)
  @Roles('admin', 'owner')
  @ApiOperation({ summary: 'Invite a user by email to the workspace' })
  async inviteUser(
    @Param('workspaceId') workspaceId: string,
    @Body() body: any,
  ) {
    return this.orgsService.inviteUserToWorkspace(workspaceId, body.email, body.role || 'member');
  }
}
