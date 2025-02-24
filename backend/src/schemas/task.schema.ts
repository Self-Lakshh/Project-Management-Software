import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TaskDocument = Task & Document;

@Schema()
export class TaskDependency {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
  taskId: Types.ObjectId;

  @Prop({ required: true, enum: ['blocks', 'blocked-by', 'relates-to'] })
  type: string;
}

const TaskDependencySchema = SchemaFactory.createForClass(TaskDependency);

@Schema({ timestamps: true })
export class Task {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ required: true, uppercase: true, index: true, trim: true })
  key: string;

  @Prop({ required: true, enum: ['backlog', 'todo', 'in_progress', 'in_review', 'done'], default: 'todo' })
  status: string;

  @Prop({ required: true, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' })
  priority: string;

  @Prop({ required: true, enum: ['task', 'subtask', 'epic', 'feature', 'bug'], default: 'task' })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Task', default: null })
  parentTaskId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sprint', default: null })
  sprintId: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Workspace', required: true })
  workspaceId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  assignees: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  watchers: Types.ObjectId[];

  @Prop({ default: 0 })
  storyPoints: number;

  @Prop({ type: [String], default: [] })
  labels: string[];

  @Prop({ type: [TaskDependencySchema], default: [] })
  dependencies: TaskDependency[];

  @Prop({ type: Map, of: String, default: {} })
  customFields: Map<string, string>;

  @Prop({ type: Date, default: null })
  startDate: Date | null;

  @Prop({ type: Date, default: null })
  endDate: Date | null;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
// Create text index for search
TaskSchema.index({ title: 'text', description: 'text', key: 'text' });
// Ensure key is unique within a workspace
TaskSchema.index({ workspaceId: 1, key: 1 }, { unique: true });
