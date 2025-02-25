import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgsService } from './orgs.service';
import { OrgsController } from './orgs.controller';
import { Organization, OrganizationSchema } from '../schemas/org.schema';
import { Workspace, WorkspaceSchema } from '../schemas/workspace.schema';
import { User, UserSchema } from '../schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [OrgsService],
  controllers: [OrgsController],
  exports: [OrgsService, MongooseModule],
})
export class OrgsModule {}
