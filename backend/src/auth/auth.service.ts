import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { Organization, OrganizationDocument } from '../schemas/org.schema';
import { Workspace, WorkspaceDocument } from '../schemas/workspace.schema';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Organization.name) private orgModel: Model<OrganizationDocument>,
    @InjectModel(Workspace.name) private workspaceModel: Model<WorkspaceDocument>,
    private jwtService: JwtService,
  ) {}

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async signUp(name: string, email: string, password: string) {
    const existing = await this.userModel.findOne({ email }).exec();
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.hashPassword(password);
    const user = new this.userModel({
      name,
      email,
      passwordHash,
    });
    await user.save();

    // Create a default organization for the user
    const slugName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const org = new this.orgModel({
      name: `${name}'s Org`,
      slug: `${slugName}-org-${Date.now().toString().slice(-4)}`,
      ownerId: user._id,
      members: [{ userId: user._id, role: 'owner' }],
    });
    await org.save();

    // Create a default workspace inside that organization
    const workspace = new this.workspaceModel({
      name: `${name}'s Workspace`,
      slug: `${slugName}-workspace-${Date.now().toString().slice(-4)}`,
      organizationId: org._id,
      members: [{ userId: user._id, role: 'admin' }],
    });
    await workspace.save();

    // Update active workspace for user
    user.activeWorkspaceId = workspace._id as Types.ObjectId;
    await user.save();

    const tokens = await this.generateTokens(user);
    return {
      user: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        activeWorkspaceId: workspace._id.toString(),
      },
      ...tokens,
    };
  }

  async signIn(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await this.comparePasswords(password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // If user has no active workspace but is in some workspace, assign one
    if (!user.activeWorkspaceId) {
      const workspace = await this.workspaceModel.findOne({ 'members.userId': user._id }).exec();
      if (workspace) {
        user.activeWorkspaceId = workspace._id as Types.ObjectId;
        await user.save();
      }
    }

    const tokens = await this.generateTokens(user);
    return {
      user: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        activeWorkspaceId: user.activeWorkspaceId ? user.activeWorkspaceId.toString() : null,
      },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'pms_core_jwt_refresh_token_signature_key',
      }) as JwtPayload;

      const user = await this.userModel.findById(payload.userId).exec();
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user);
      return {
        user: {
          userId: user._id.toString(),
          name: user.name,
          email: user.email,
          activeWorkspaceId: user.activeWorkspaceId ? user.activeWorkspaceId.toString() : null,
        },
        ...tokens,
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async generateTokens(user: UserDocument) {
    const payload: JwtPayload = { userId: user._id.toString(), email: user.email };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'pms_core_jwt_secret_token_signature_key',
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'pms_core_jwt_refresh_token_signature_key',
      expiresIn: '7d',
    });
    return { accessToken, refreshToken };
  }
}
