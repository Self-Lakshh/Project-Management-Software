import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type WorkspaceDocument = Workspace & Document;

@Schema()
class WorkspaceMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['admin', 'member', 'viewer'], default: 'member' })
  role: string;
}

const WorkspaceMemberSchema = SchemaFactory.createForClass(WorkspaceMember);

@Schema({ timestamps: true })
export class Workspace {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @Prop({ type: [WorkspaceMemberSchema], default: [] })
  members: WorkspaceMember[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
