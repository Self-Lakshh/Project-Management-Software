import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument, TaskDependency } from '../schemas/task.schema';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity.schema';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { Attachment, AttachmentDocument } from '../schemas/attachment.schema';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(Attachment.name) private attachmentModel: Model<AttachmentDocument>,
  ) {}

  async createTask(
    workspaceId: string,
    creatorId: string,
    data: any,
  ): Promise<TaskDocument> {
    const projectId = data.projectId;
    const project = await this.projectModel.findById(projectId).exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Auto-generate key: prefix with project key, e.g. PMS-4
    const count = await this.taskModel.countDocuments({ projectId: project._id }).exec();
    const taskKey = `${project.key}-${count + 1}`;

    const task = new this.taskModel({
      title: data.title,
      description: data.description || '',
      key: taskKey,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      type: data.type || 'task',
      parentTaskId: data.parentTaskId ? new Types.ObjectId(data.parentTaskId) : null,
      projectId: project._id,
      sprintId: data.sprintId ? new Types.ObjectId(data.sprintId) : null,
      workspaceId: new Types.ObjectId(workspaceId),
      creatorId: new Types.ObjectId(creatorId),
      assignees: data.assignees ? data.assignees.map((id: string) => new Types.ObjectId(id)) : [],
      storyPoints: data.storyPoints || 0,
      labels: data.labels || [],
      dependencies: [],
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    });

    await task.save();

    // Log Activity
    const activity = new this.activityLogModel({
      workspaceId: new Types.ObjectId(workspaceId),
      userId: new Types.ObjectId(creatorId),
      entityType: 'task',
      entityId: task._id,
      action: 'create',
      metadata: { key: task.key, title: task.title },
    });
    await activity.save();

    // Notify assignees
    if (task.assignees && task.assignees.length > 0) {
      for (const assigneeId of task.assignees) {
        if (assigneeId.toString() !== creatorId) {
          const notification = new this.notificationModel({
            userId: assigneeId,
            senderId: new Types.ObjectId(creatorId),
            title: 'Task Assigned',
            content: `You have been assigned to task: ${task.key} - ${task.title}`,
            type: 'task_assigned',
            link: `/tasks/${task._id}`,
          });
          await notification.save();
        }
      }
    }

    return task;
  }

  async getTasks(workspaceId: string, filters: any): Promise<TaskDocument[]> {
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.type) query.type = filters.type;
    if (filters.projectId) query.projectId = new Types.ObjectId(filters.projectId);
    if (filters.sprintId) {
      if (filters.sprintId === 'backlog') {
        query.sprintId = null;
      } else {
        query.sprintId = new Types.ObjectId(filters.sprintId);
      }
    }
    if (filters.assigneeId) {
      query.assignees = new Types.ObjectId(filters.assigneeId);
    }
    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    return this.taskModel
      .find(query)
      .populate('assignees', 'name email avatar')
      .populate('creatorId', 'name email avatar')
      .populate('projectId', 'name key')
      .populate('sprintId', 'name')
      .exec();
  }

  async getTask(taskId: string): Promise<TaskDocument> {
    const task = await this.taskModel
      .findById(taskId)
      .populate('assignees', 'name email avatar')
      .populate('creatorId', 'name email avatar')
      .populate('projectId', 'name key')
      .populate('sprintId', 'name')
      .populate('parentTaskId', 'title key')
      .populate('dependencies.taskId', 'title key status priority')
      .exec();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async updateTask(taskId: string, userId: string, updateData: any): Promise<TaskDocument> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const changes: any = {};
    const oldStatus = task.status;
    const oldAssignees = task.assignees.map((id) => id.toString());

    // Update allowable fields
    if (updateData.title !== undefined) {
      changes.title = { from: task.title, to: updateData.title };
      task.title = updateData.title;
    }
    if (updateData.description !== undefined) {
      task.description = updateData.description;
    }
    if (updateData.status !== undefined) {
      changes.status = { from: task.status, to: updateData.status };
      task.status = updateData.status;
    }
    if (updateData.priority !== undefined) {
      changes.priority = { from: task.priority, to: updateData.priority };
      task.priority = updateData.priority;
    }
    if (updateData.type !== undefined) {
      changes.type = { from: task.type, to: updateData.type };
      task.type = updateData.type;
    }
    if (updateData.storyPoints !== undefined) {
      changes.storyPoints = { from: task.storyPoints, to: updateData.storyPoints };
      task.storyPoints = updateData.storyPoints;
    }
    if (updateData.sprintId !== undefined) {
      task.sprintId = updateData.sprintId ? new Types.ObjectId(updateData.sprintId) : null;
    }
    if (updateData.assignees !== undefined) {
      task.assignees = updateData.assignees.map((id: string) => new Types.ObjectId(id));
    }
    if (updateData.startDate !== undefined) {
      task.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
    }
    if (updateData.endDate !== undefined) {
      task.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
    }

    await task.save();

    // Log Activity if changes occurred
    if (Object.keys(changes).length > 0) {
      const activity = new this.activityLogModel({
        workspaceId: task.workspaceId,
        userId: new Types.ObjectId(userId),
        entityType: 'task',
        entityId: task._id,
        action: 'update',
        metadata: changes,
      });
      await activity.save();
    }

    // Trigger Notification for new assignees
    if (updateData.assignees) {
      const newAssignees = task.assignees.map((id) => id.toString());
      const added = newAssignees.filter((id) => !oldAssignees.includes(id));
      for (const id of added) {
        if (id !== userId) {
          const notification = new this.notificationModel({
            userId: new Types.ObjectId(id),
            senderId: new Types.ObjectId(userId),
            title: 'Task Assigned',
            content: `You have been assigned to task: ${task.key} - ${task.title}`,
            type: 'task_assigned',
            link: `/tasks/${task._id}`,
          });
          await notification.save();
        }
      }
    }

    // If status changed to done and there were dependencies, notify blocker tasks or successors
    if (updateData.status === 'done' && oldStatus !== 'done') {
      // Find tasks that are blocked by this task
      const dependentTasks = await this.taskModel.find({
        'dependencies.taskId': task._id,
        'dependencies.type': 'blocked-by',
      }).exec();

      for (const depTask of dependentTasks) {
        // notify creator or assignees of blocked task
        const notification = new this.notificationModel({
          userId: depTask.creatorId,
          senderId: new Types.ObjectId(userId),
          title: 'Dependency Resolved',
          content: `Blocker task ${task.key} is now completed. You can start working on ${depTask.key}.`,
          type: 'dependency_blocked',
          link: `/tasks/${depTask._id}`,
        });
        await notification.save();
      }
    }

    return task;
  }

  async addDependency(
    taskId: string,
    targetTaskId: string,
    type: 'blocks' | 'blocked-by' | 'relates-to',
    userId: string,
  ) {
    if (taskId === targetTaskId) {
      throw new BadRequestException('A task cannot depend on itself');
    }

    const task = await this.taskModel.findById(taskId).exec();
    const targetTask = await this.taskModel.findById(targetTaskId).exec();

    if (!task || !targetTask) {
      throw new NotFoundException('Task or target task not found');
    }

    // Check if dependency already exists
    const exists = task.dependencies.some(
      (dep) => dep.taskId.toString() === targetTaskId && dep.type === type,
    );

    if (exists) {
      return task;
    }

    // Add forward dependency
    task.dependencies.push({
      taskId: targetTask._id as Types.ObjectId,
      type,
    });
    await task.save();

    // Add reverse dependency to target task
    let reverseType: string;
    if (type === 'blocks') reverseType = 'blocked-by';
    else if (type === 'blocked-by') reverseType = 'blocks';
    else reverseType = 'relates-to';

    const targetExists = targetTask.dependencies.some(
      (dep) => dep.taskId.toString() === taskId && dep.type === reverseType,
    );

    if (!targetExists) {
      targetTask.dependencies.push({
        taskId: task._id as Types.ObjectId,
        type: reverseType,
      });
      await targetTask.save();
    }

    // Log Activity
    const activity = new this.activityLogModel({
      workspaceId: task.workspaceId,
      userId: new Types.ObjectId(userId),
      entityType: 'task',
      entityId: task._id,
      action: 'update',
      metadata: { dependency: `Linked to ${targetTask.key} as ${type}` },
    });
    await activity.save();

    return task;
  }

  async removeDependency(taskId: string, targetTaskId: string, userId: string) {
    const task = await this.taskModel.findById(taskId).exec();
    const targetTask = await this.taskModel.findById(targetTaskId).exec();

    if (!task || !targetTask) {
      throw new NotFoundException('Task or target task not found');
    }

    // Remove forward dependency
    task.dependencies = task.dependencies.filter(
      (dep) => dep.taskId.toString() !== targetTaskId,
    );
    await task.save();

    // Remove reverse dependency
    targetTask.dependencies = targetTask.dependencies.filter(
      (dep) => dep.taskId.toString() !== taskId,
    );
    await targetTask.save();

    // Log Activity
    const activity = new this.activityLogModel({
      workspaceId: task.workspaceId,
      userId: new Types.ObjectId(userId),
      entityType: 'task',
      entityId: task._id,
      action: 'update',
      metadata: { dependency: `Unlinked from ${targetTask.key}` },
    });
    await activity.save();

    return task;
  }

  async deleteTask(taskId: string, userId: string): Promise<any> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Remove dependency references in other tasks
    await this.taskModel.updateMany(
      { 'dependencies.taskId': task._id },
      { $pull: { dependencies: { taskId: task._id } } },
    );

    await this.taskModel.deleteOne({ _id: task._id });

    // Log Activity
    const activity = new this.activityLogModel({
      workspaceId: task.workspaceId,
      userId: new Types.ObjectId(userId),
      entityType: 'task',
      entityId: task._id,
      action: 'delete',
      metadata: { key: task.key, title: task.title },
    });
    await activity.save();

    return { success: true };
  }

  // Attachments
  async addAttachment(
    taskId: string,
    name: string,
    url: string,
    fileType: string,
    size: number,
    userId: string,
  ): Promise<AttachmentDocument> {
    const attachment = new this.attachmentModel({
      taskId: new Types.ObjectId(taskId),
      name,
      url,
      fileType,
      size,
      uploadedById: new Types.ObjectId(userId),
    });
    return attachment.save();
  }

  async getAttachments(taskId: string): Promise<AttachmentDocument[]> {
    return this.attachmentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('uploadedById', 'name email avatar')
      .exec();
  }
}
