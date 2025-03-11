import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Task, TaskSchema } from '../schemas/task.schema';
import { Sprint, SprintSchema } from '../schemas/sprint.schema';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { Workspace, WorkspaceSchema } from '../schemas/workspace.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Sprint.name, schema: SprintSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService, MongooseModule],
})
export class AnalyticsModule {}
