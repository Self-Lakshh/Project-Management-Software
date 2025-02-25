import { Controller, Post, Body, Get, UseGuards, Request, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created, default org/workspace generated' })
  async signUp(@Body() body: any) {
    return this.authService.signUp(body.name, body.email, body.password);
  }

  @Post('signin')
  @ApiOperation({ summary: 'Sign in to obtain tokens' })
  @ApiResponse({ status: 200, description: 'Successful login' })
  async signIn(@Body() body: any) {
    return this.authService.signIn(body.email, body.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access tokens' })
  @ApiResponse({ status: 200, description: 'Token successfully rotated' })
  async refresh(@Body() body: any) {
    return this.authService.refreshTokens(body.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile fetched' })
  async getMe(@Request() req: any) {
    // Return fresh details
    const user = await this.userModel.findById(req.user.userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return {
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      activeWorkspaceId: user.activeWorkspaceId ? user.activeWorkspaceId.toString() : null,
    };
  }

  @Post('workspace/:workspaceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Switch current active workspace' })
  async switchWorkspace(@Request() req: any, @Param('workspaceId') workspaceId: string) {
    const user = await this.userModel.findById(req.user.userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    user.activeWorkspaceId = new Types.ObjectId(workspaceId);
    await user.save();
    return { success: true, activeWorkspaceId: workspaceId };
  }
}
