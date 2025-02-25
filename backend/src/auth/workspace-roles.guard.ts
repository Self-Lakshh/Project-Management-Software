import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ROLES_KEY } from './roles.decorator';
import { Workspace, WorkspaceDocument } from '../schemas/workspace.schema';

@Injectable()
export class WorkspaceRolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by JwtAuthGuard
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Try to find workspace ID from params, headers, query, or active workspace
    const workspaceId =
      request.params.workspaceId ||
      request.headers['x-workspace-id'] ||
      request.query.workspaceId ||
      user.activeWorkspaceId;

    if (!workspaceId) {
      throw new ForbiddenException('Workspace ID not provided');
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new ForbiddenException('Workspace not found');
    }

    // Check if user is a member of the workspace
    const member = workspace.members.find(
      (m) => m.userId.toString() === user.userId,
    );

    if (!member) {
      throw new ForbiddenException('You are not a member of this workspace');
    }

    // If roles are specified, check role permission
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.includes(member.role);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient workspace permissions');
      }
    }

    // Attach workspace and role to request for controllers to use
    request.workspace = workspace;
    request.workspaceRole = member.role;

    return true;
  }
}
