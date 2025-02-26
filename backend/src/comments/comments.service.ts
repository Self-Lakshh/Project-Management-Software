import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { Notification, NotificationDocument } from '../schemas/notification.schema';
import { ActivityLog, ActivityLogDocument } from '../schemas/activity.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Task, TaskDocument } from '../schemas/task.schema';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    @InjectModel(ActivityLog.name) private activityLogModel: Model<ActivityLogDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  ) {}

  // Comments
  async createComment(
    taskId: string,
    userId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<CommentDocument> {
    const task = await this.taskModel.findById(taskId).exec();
    if (!task) {
      throw new NotFoundException('Task not found');
    }

    const comment = new this.commentModel({
      taskId: new Types.ObjectId(taskId),
      userId: new Types.ObjectId(userId),
      content,
      parentCommentId: parentCommentId ? new Types.ObjectId(parentCommentId) : null,
    });
    await comment.save();

    // Log Activity
    const activity = new this.activityLogModel({
      workspaceId: task.workspaceId,
      userId: new Types.ObjectId(userId),
      entityType: 'comment',
      entityId: comment._id,
      action: 'comment',
      metadata: { key: task.key, commentId: comment._id.toString() },
    });
    await activity.save();

    // Parse Mentions (Format: @[email] or @email)
    const mentionRegex = /@([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
    let match;
    const mentionedEmails: string[] = [];
    while ((match = mentionRegex.exec(content)) !== null) {
      mentionedEmails.push(match[1].toLowerCase());
    }

    // Also look for simple name mentions (e.g. @Name) if name is single word
    const simpleMentionRegex = /@([a-zA-Z0-9]+)/g;
    const mentionedNames: string[] = [];
    while ((match = simpleMentionRegex.exec(content)) !== null) {
      // Avoid parsing emails as names
      if (!match[1].includes('@')) {
        mentionedNames.push(match[1]);
      }
    }

    const uniqueEmails = Array.from(new Set(mentionedEmails));
    const uniqueNames = Array.from(new Set(mentionedNames));

    const notifyUsers = new Set<string>();

    if (uniqueEmails.length > 0) {
      const users = await this.userModel.find({ email: { $in: uniqueEmails } }).exec();
      users.forEach((u) => notifyUsers.add(u._id.toString()));
    }
    if (uniqueNames.length > 0) {
      const users = await this.userModel.find({ name: { $in: uniqueNames } }).exec();
      users.forEach((u) => notifyUsers.add(u._id.toString()));
    }

    // Notify mentioned users (excluding self)
    for (const notifyUserId of notifyUsers) {
      if (notifyUserId !== userId) {
        const notification = new this.notificationModel({
          userId: new Types.ObjectId(notifyUserId),
          senderId: new Types.ObjectId(userId),
          title: 'Mentioned in Comment',
          content: `You were mentioned in a comment on task ${task.key}`,
          type: 'comment_mention',
          link: `/tasks/${task._id}`,
        });
        await notification.save();
      }
    }

    // Also notify watchers & assignees who are not the commenter
    const otherNotified = new Set<string>([userId, ...Array.from(notifyUsers)]);
    const notifyGroup = [...task.assignees, ...task.watchers, task.creatorId];
    for (const memberId of notifyGroup) {
      const idStr = memberId.toString();
      if (!otherNotified.has(idStr)) {
        otherNotified.add(idStr);
        const notification = new this.notificationModel({
          userId: memberId,
          senderId: new Types.ObjectId(userId),
          title: 'New Comment',
          content: `New comment on task ${task.key} - ${task.title}`,
          type: 'comment_mention',
          link: `/tasks/${task._id}`,
        });
        await notification.save();
      }
    }

    return comment;
  }

  async getComments(taskId: string): Promise<CommentDocument[]> {
    return this.commentModel
      .find({ taskId: new Types.ObjectId(taskId) })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: 1 })
      .exec();
  }

  // Notifications
  async getNotifications(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('senderId', 'name email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async markNotificationRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.notificationModel.findOne({
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.read = true;
    return notification.save();
  }

  async markAllNotificationsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { read: true },
    ).exec();
    return { success: true };
  }

  // Activity Feed
  async getWorkspaceActivity(workspaceId: string): Promise<ActivityLogDocument[]> {
    return this.activityLogModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
  }
}
