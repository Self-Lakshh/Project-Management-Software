import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from '../schemas/project.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Sprint, SprintSchema } from '../schemas/sprint.schema';
import { Workspace, WorkspaceSchema } from '../schemas/workspace.schema';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Sprint.name, schema: SprintSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
    ]),
    forwardRef(() => AuthModule),
  ],
  providers: [ProjectsService],
  controllers: [ProjectsController],
  exports: [ProjectsService, MongooseModule],
})
export class ProjectsModule {}
