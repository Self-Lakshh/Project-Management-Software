import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './jwt-payload.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'pms_core_jwt_secret_token_signature_key',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userModel.findById(payload.userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      activeWorkspaceId: user.activeWorkspaceId ? user.activeWorkspaceId.toString() : null,
    };
  }
}
