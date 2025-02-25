import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Organization, OrganizationDocument } from '../schemas/org.schema';
import { Workspace, WorkspaceDocument } from '../schemas/workspace.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class OrgsService {
  constructor(
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createOrg(name: string, userId: string): Promise<OrganizationDocument> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const org = new this.orgModel({
      name,
      slug,
      ownerId: new Types.ObjectId(userId),
      members: [{ userId: new Types.ObjectId(userId), role: 'owner' }],
    });
    return org.save();
  }

  async createWorkspace(orgId: string, name: string, userId: string): Promise<WorkspaceDocument> {
    const org = await this.orgModel.findById(orgId).exec();
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString().slice(-4);
    const workspace = new this.workspaceModel({
      name,
      slug,
      organizationId: org._id,
      members: [{ userId: new Types.ObjectId(userId), role: 'admin' }],
    });
    return workspace.save();
  }

  async getWorkspacesForUser(userId: string) {
    return this.workspaceModel.find({
      'members.userId': new Types.ObjectId(userId),
    }).exec();
  }

  async getWorkspaceDetails(workspaceId: string, userId: string) {
    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }
    const isMember = workspace.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      throw new ForbiddenException('Not a member of this workspace');
    }
    return workspace;
  }

  async inviteUserToWorkspace(workspaceId: string, email: string, role: 'admin' | 'member' | 'viewer') {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new NotFoundException('User with this email not found');
    }

    const workspace = await this.workspaceModel.findById(workspaceId).exec();
    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    const alreadyMember = workspace.members.some((m) => m.userId.toString() === user._id.toString());
    if (alreadyMember) {
      throw new ConflictException('User is already a member of this workspace');
    }

    workspace.members.push({
      userId: user._id as Types.ObjectId,
      role,
    });
    await workspace.save();

    return { success: true, workspace };
  }

  async getWorkspaceMembers(workspaceId: string) {
    const workspace = await this.workspaceModel
      .findById(workspaceId)
      .populate('members.userId', 'name email avatar')
      .exec();

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    return workspace.members.map((m: any) => ({
      userId: m.userId._id.toString(),
      name: m.userId.name,
      email: m.userId.email,
      avatar: m.userId.avatar,
      role: m.role,
    }));
  }
}
