import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { WorkspaceRolesGuard } from '../auth/workspace-roles.guard';
import { Roles } from '../auth/roles.decorator';

@ApiTags('Tasks, Dependencies, Attachments')
@Controller()
@UseGuards(JwtAuthGuard, WorkspaceRolesGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Post('workspaces/:workspaceId/tasks')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Create a new task' })
  async createTask(
    @Param('workspaceId') workspaceId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.tasksService.createTask(workspaceId, req.user.userId, body);
  }

  @Get('workspaces/:workspaceId/tasks')
  @ApiOperation({ summary: 'List tasks in workspace with filters' })
  async getTasks(
    @Param('workspaceId') workspaceId: string,
    @Query() query: any,
  ) {
    return this.tasksService.getTasks(workspaceId, query);
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get detailed task information' })
  async getTask(@Param('taskId') taskId: string) {
    return this.tasksService.getTask(taskId);
  }

  @Put('tasks/:taskId')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.tasksService.updateTask(taskId, req.user.userId, body);
  }

  @Delete('tasks/:taskId')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Delete a task' })
  async deleteTask(@Param('taskId') taskId: string, @Request() req: any) {
    return this.tasksService.deleteTask(taskId, req.user.userId);
  }

  // Dependencies
  @Post('tasks/:taskId/dependencies')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Create a task dependency' })
  async addDependency(
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.tasksService.addDependency(
      taskId,
      body.targetTaskId,
      body.type,
      req.user.userId,
    );
  }

  @Delete('tasks/:taskId/dependencies/:targetTaskId')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Remove a task dependency' })
  async removeDependency(
    @Param('taskId') taskId: string,
    @Param('targetTaskId') targetTaskId: string,
    @Request() req: any,
  ) {
    return this.tasksService.removeDependency(taskId, targetTaskId, req.user.userId);
  }

  // Attachments
  @Post('tasks/:taskId/attachments')
  @Roles('admin', 'member')
  @ApiOperation({ summary: 'Attach a file to a task' })
  async addAttachment(
    @Param('taskId') taskId: string,
    @Request() req: any,
    @Body() body: any,
  ) {
    return this.tasksService.addAttachment(
      taskId,
      body.name,
      body.url,
      body.fileType,
      body.size,
      req.user.userId,
    );
  }

  @Get('tasks/:taskId/attachments')
  @ApiOperation({ summary: 'List task attachments' })
  async getAttachments(@Param('taskId') taskId: string) {
    return this.tasksService.getAttachments(taskId);
  }
}
