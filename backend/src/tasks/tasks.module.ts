import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from '../schemas/task.schema';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { Workspace, WorkspaceSchema } from '../schemas/workspace.schema';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { Attachment, AttachmentSchema } from '../schemas/attachment.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Attachment.name, schema: AttachmentSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [TasksService],
  controllers: [TasksController],
  exports: [TasksService, MongooseModule],
})
export class TasksModule {}
