import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrganizationDocument = Organization & Document;

@Schema()
class OrganizationMember {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: ['owner', 'admin', 'member', 'viewer'], default: 'member' })
  role: string;
}

const OrganizationMemberSchema = SchemaFactory.createForClass(OrganizationMember);

@Schema({ timestamps: true })
export class Organization {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, index: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;

  @Prop({ type: [OrganizationMemberSchema], default: [] })
  members: OrganizationMember[];
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
