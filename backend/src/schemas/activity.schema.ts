import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ActivityLogDocument = ActivityLog & Document;

@Schema({ timestamps: true })
export class ActivityLog {
  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  entityType: string; // 'task' | 'project' | 'sprint' | 'comment' | 'workspace'

  @Prop({ type: Types.ObjectId, required: true })
  entityId: Types.ObjectId;

  @Prop({ required: true })
  action: string; // 'create' | 'update' | 'delete' | 'comment' | 'assign'

  @Prop({ type: Map, of: SchemaFactory.createForClass(Object), default: {} })
  metadata: Map<string, any>;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
