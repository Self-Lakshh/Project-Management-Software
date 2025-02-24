import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  senderId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['task_assigned', 'comment_mention', 'dependency_blocked', 'project_update'], default: 'task_assigned' })
  type: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: '' })
  link: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
