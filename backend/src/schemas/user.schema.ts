import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ default: '' })
  avatar: string;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', default: null })
  activeWorkspaceId: Types.ObjectId | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
