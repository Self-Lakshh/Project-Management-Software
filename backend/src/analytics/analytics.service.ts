import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from '../schemas/task.schema';
import { Sprint, SprintDocument } from '../schemas/sprint.schema';
import { Project, ProjectDocument } from '../schemas/project.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    @InjectModel(Sprint.name) private sprintModel: Model<SprintDocument>,
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
  ) {}

  async getWorkspaceHealth(workspaceId: string) {
    const wId = new Types.ObjectId(workspaceId);
    
    // Status distribution
    const statusCounts = await this.taskModel.aggregate([
      { $match: { workspaceId: wId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const statusMap: Record<string, number> = { backlog: 0, todo: 0, in_progress: 0, in_review: 0, done: 0 };
    statusCounts.forEach((s) => {
      if (s._id in statusMap) {
        statusMap[s._id] = s.count;
      }
    });

    const statusDist = Object.keys(statusMap).map((key) => ({
      status: key,
      count: statusMap[key],
    }));

    // Type distribution (bugs vs features vs tasks)
    const typeCounts = await this.taskModel.aggregate([
      { $match: { workspaceId: wId } },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const typeDist = typeCounts.map((t) => ({
      type: t._id,
      count: t.count,
    }));

    // Priority distribution
    const priorityCounts = await this.taskModel.aggregate([
      { $match: { workspaceId: wId } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    const priorityDist = priorityCounts.map((p) => ({
      priority: p._id,
      count: p.count,
    }));

    // Calculate Completion Rate
    const totalTasks = await this.taskModel.countDocuments({ workspaceId: wId }).exec();
    const completedTasks = await this.taskModel.countDocuments({ workspaceId: wId, status: 'done' }).exec();
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      statusDistribution: statusDist,
      typeDistribution: typeDist,
      priorityDistribution: priorityDist,
    };
  }

  async getWorkloadDistribution(workspaceId: string) {
    const wId = new Types.ObjectId(workspaceId);

    // Group tasks by assignee
    const workload = await this.taskModel.aggregate([
      { $match: { workspaceId: wId } },
      { $unwind: '$assignees' },
      {
        $group: {
          _id: '$assignees',
          taskCount: { $sum: 1 },
          storyPoints: { $sum: '$storyPoints' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      { $unwind: '$userDetails' },
      {
        $project: {
          userId: '$_id',
          name: '$userDetails.name',
          email: '$userDetails.email',
          avatar: '$userDetails.avatar',
          taskCount: 1,
          storyPoints: 1,
        },
      },
    ]);

    return workload;
  }

  async getSprintBurndown(sprintId: string) {
    const sprint = await this.sprintModel.findById(sprintId).exec();
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const tasks = await this.taskModel.find({ sprintId: sprint._id }).exec();
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    // Generate list of dates in the sprint
    const dates: string[] = [];
    const curr = new Date(start);
    while (curr <= end) {
      dates.push(curr.toISOString().split('T')[0]);
      curr.setDate(curr.getDate() + 1);
    }

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const burndownData: any[] = [];
    
    // Calculate burndown details
    let remainingPoints = totalPoints;

    dates.forEach((dateStr, index) => {
      const date = new Date(dateStr);
      
      // Calculate how many points were completed ON or BEFORE this date
      const completedOnOrBefore = tasks
        .filter((t) => t.status === 'done' && t.updatedAt && new Date(t.updatedAt) <= date)
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const actualRemaining = totalPoints - completedOnOrBefore;

      // Ideal linear line: from totalPoints down to 0
      const idealPoints = dates.length > 1 
        ? Math.max(0, totalPoints - (totalPoints / (dates.length - 1)) * index)
        : 0;

      burndownData.push({
        date: dateStr,
        ideal: Math.round(idealPoints * 10) / 10,
        actual: actualRemaining,
      });
    });

    return {
      sprintName: sprint.name,
      totalPoints,
      data: burndownData,
    };
  }

  async getProjectVelocity(projectId: string) {
    const pId = new Types.ObjectId(projectId);
    const sprints = await this.sprintModel.find({ projectId: pId, status: 'completed' }).sort({ endDate: 1 }).exec();

    const velocityData = [];

    for (const sprint of sprints) {
      const tasks = await this.taskModel.find({ sprintId: sprint._id }).exec();
      
      const targetPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completedPoints = tasks
        .filter((t) => t.status === 'done')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      velocityData.push({
        sprintName: sprint.name,
        target: targetPoints,
        completed: completedPoints,
      });
    }

    return velocityData;
  }
}
