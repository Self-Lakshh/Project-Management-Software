import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../auth/workspace-roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Comments, Notifications, Activity Stream')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  // Comments
  @Post('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Create a comment on a task' })
  async createComment(
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.commentsService.createComment(
      taskId,
      req.user.userId,
      body.content,
      body.parentCommentId,
    );
  }

  @Get('tasks/:taskId/comments')
  @ApiOperation({ summary: 'Get all comments for a task' })
  async getComments(@Param('taskId') taskId: string) {
    return this.commentsService.getComments(taskId);
  }

  // Notifications
  @Get('notifications')
  @ApiOperation({ summary: 'Get current user notifications' })
  async getNotifications(@Request() req: any) {
    return this.commentsService.getNotifications(req.user.userId);
  }

  @Post('notifications/:notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  async readNotification(
    @Param('notificationId') notificationId: string,
    @Request() req: any,
  ) {
    return this.commentsService.markNotificationRead(notificationId, req.user.userId);
  }

  @Post('notifications/read-all')
  @ApiOperation({ summary: 'Mark all user notifications as read' })
  async readAllNotifications(@Request() req: any) {
    return this.commentsService.markAllNotificationsRead(req.user.userId);
  }

  // Activity Feed
  @Get('workspaces/:workspaceId/activity')
  @UseGuards(WorkspaceRolesGuard)
  @ApiOperation({ summary: 'Get workspace recent activity stream' })
  async getActivity(@Param('workspaceId') workspaceId: string) {
    return this.commentsService.getWorkspaceActivity(workspaceId);
  }
}
