import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from '../schemas/project.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Sprint, SprintDocument } from '../schemas/sprint.schema';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<ProjectDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Sprint.name) private sprintModel: Model<SprintDocument>,
  ) {}

  // Project APIs
  async createProject(
    workspaceId: string,
    ownerId: string,
    name: string,
    key: string,
    teamId?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<ProjectDocument> {
    const project = new this.projectModel({
      name,
      key: key.toUpperCase(),
      workspaceId: new Types.ObjectId(workspaceId),
      ownerId: new Types.ObjectId(ownerId),
      teamId: teamId ? new Types.ObjectId(teamId) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'planning',
    });
    return project.save();
  }

  async getProjects(workspaceId: string): Promise<ProjectDocument[]> {
    return this.projectModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('teamId', 'name')
      .populate('ownerId', 'name email avatar')
      .exec();
  }

  async getProject(projectId: string): Promise<ProjectDocument> {
    const project = await this.projectModel
      .findById(projectId)
      .populate('teamId', 'name')
      .populate('ownerId', 'name email avatar')
      .exec();
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  // Team APIs
  async createTeam(workspaceId: string, name: string, members: string[]): Promise<TeamDocument> {
    const team = new this.teamModel({
      name,
      workspaceId: new Types.ObjectId(workspaceId),
      members: members.map((id) => new Types.ObjectId(id)),
    });
    return team.save();
  }

  async getTeams(workspaceId: string): Promise<TeamDocument[]> {
    return this.teamModel
      .find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate('members', 'name email avatar')
      .exec();
  }

  // Sprint APIs
  async createSprint(
    workspaceId: string,
    projectId: string,
    name: string,
    goal: string,
    startDate: Date,
    endDate: Date,
  ): Promise<SprintDocument> {
    const sprint = new this.sprintModel({
      name,
      goal,
      startDate,
      endDate,
      projectId: new Types.ObjectId(projectId),
      workspaceId: new Types.ObjectId(workspaceId),
      status: 'planning',
    });
    return sprint.save();
  }

  async getSprints(projectId: string): Promise<SprintDocument[]> {
    return this.sprintModel
      .find({ projectId: new Types.ObjectId(projectId) })
      .exec();
  }

  async startSprint(sprintId: string): Promise<SprintDocument> {
    const sprint = await this.sprintModel.findById(sprintId).exec();
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Complete all other active sprints for the project
    await this.sprintModel.updateMany(
      { projectId: sprint.projectId, status: 'active' },
      { status: 'completed' },
    );

    sprint.status = 'active';
    return sprint.save();
  }

  async completeSprint(sprintId: string): Promise<SprintDocument> {
    const sprint = await this.sprintModel.findById(sprintId).exec();
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    sprint.status = 'completed';
    return sprint.save();
  }
}
