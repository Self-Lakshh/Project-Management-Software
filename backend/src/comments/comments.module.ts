import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { Comment, CommentSchema } from '../schemas/comment.schema';
import { Notification, NotificationSchema } from '../schemas/notification.schema';
import { ActivityLog, ActivityLogSchema } from '../schemas/activity.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { Task, TaskSchema } from '../schemas/task.schema';
import { Workspace, WorkspaceSchema } from '../schemas/workspace.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Comment.name, schema: CommentSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [CommentsService],
  controllers: [CommentsController],
  exports: [CommentsService, MongooseModule],
})
export class CommentsModule {}
