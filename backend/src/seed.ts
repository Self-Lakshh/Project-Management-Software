import mongoose, { Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pms';

// Define mini inline schemas to connect directly without NestJS bootstrap
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  avatar: String,
  activeWorkspaceId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const OrgSchema = new mongoose.Schema({
  name: String,
  slug: String,
  ownerId: mongoose.Schema.Types.ObjectId,
  members: [{ userId: mongoose.Schema.Types.ObjectId, role: String }],
}, { timestamps: true });

const WorkspaceSchema = new mongoose.Schema({
  name: String,
  slug: String,
  organizationId: mongoose.Schema.Types.ObjectId,
  members: [{ userId: mongoose.Schema.Types.ObjectId, role: String }],
}, { timestamps: true });

const TeamSchema = new mongoose.Schema({
  name: String,
  workspaceId: mongoose.Schema.Types.ObjectId,
  members: [mongoose.Schema.Types.ObjectId],
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  name: String,
  key: String,
  description: String,
  status: String,
  workspaceId: mongoose.Schema.Types.ObjectId,
  teamId: mongoose.Schema.Types.ObjectId,
  ownerId: mongoose.Schema.Types.ObjectId,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

const SprintSchema = new mongoose.Schema({
  name: String,
  goal: String,
  status: String,
  startDate: Date,
  endDate: Date,
  projectId: mongoose.Schema.Types.ObjectId,
  workspaceId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  key: String,
  status: String,
  priority: String,
  type: String,
  parentTaskId: mongoose.Schema.Types.ObjectId,
  projectId: mongoose.Schema.Types.ObjectId,
  sprintId: mongoose.Schema.Types.ObjectId,
  workspaceId: mongoose.Schema.Types.ObjectId,
  assignees: [mongoose.Schema.Types.ObjectId],
  creatorId: mongoose.Schema.Types.ObjectId,
  watchers: [mongoose.Schema.Types.ObjectId],
  storyPoints: Number,
  labels: [String],
  dependencies: [{ taskId: mongoose.Schema.Types.ObjectId, type: { type: String } }],
  customFields: Map,
  startDate: Date,
  endDate: Date,
}, { timestamps: true });

const CommentSchema = new mongoose.Schema({
  taskId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  content: String,
  parentCommentId: mongoose.Schema.Types.ObjectId,
}, { timestamps: true });

const ActivitySchema = new mongoose.Schema({
  workspaceId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  entityType: String,
  entityId: mongoose.Schema.Types.ObjectId,
  action: String,
  metadata: Map,
}, { timestamps: true });

const NotificationSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  senderId: mongoose.Schema.Types.ObjectId,
  title: String,
  content: String,
  type: String,
  read: Boolean,
  link: String,
}, { timestamps: true });

async function run() {
  console.log(`Connecting to MongoDB at: ${MONGO_URI}...`);
  await mongoose.connect(MONGO_URI);
  console.log('Connected successfully!');

  const db = mongoose.connection;
  const User = db.model('User', UserSchema);
  const Org = db.model('Organization', OrgSchema);
  const Workspace = db.model('Workspace', WorkspaceSchema);
  const Team = db.model('Team', TeamSchema);
  const Project = db.model('Project', ProjectSchema);
  const Sprint = db.model('Sprint', SprintSchema);
  const Task = db.model('Task', TaskSchema);
  const Comment = db.model('Comment', CommentSchema);
  const Activity = db.model('ActivityLog', ActivitySchema);
  const Notification = db.model('Notification', NotificationSchema);

  // Clean databases
  console.log('Purging existing collections...');
  await User.deleteMany({});
  await Org.deleteMany({});
  await Workspace.deleteMany({});
  await Team.deleteMany({});
  await Project.deleteMany({});
  await Sprint.deleteMany({});
  await Task.deleteMany({});
  await Comment.deleteMany({});
  await Activity.deleteMany({});
  await Notification.deleteMany({});

  console.log('Seeding mock users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  
  const userAdmin = new User({
    name: 'Lakshya Chopra',
    email: 'lakshya@pms.io',
    passwordHash,
    avatar: '',
  });

  const userMember = new User({
    name: 'Sarah Connor',
    email: 'sarah@pms.io',
    passwordHash,
    avatar: '',
  });

  const userViewer = new User({
    name: 'John Doe',
    email: 'john@pms.io',
    passwordHash,
    avatar: '',
  });

  await userAdmin.save();
  await userMember.save();
  await userViewer.save();

  console.log('Seeding Organization & Workspaces...');
  const org = new Org({
    name: 'Acme Products Org',
    slug: 'acme-products-org',
    ownerId: userAdmin._id,
    members: [
      { userId: userAdmin._id, role: 'owner' },
      { userId: userMember._id, role: 'admin' },
      { userId: userViewer._id, role: 'viewer' },
    ],
  });
  await org.save();

  const workspace = new Workspace({
    name: 'Acme SaaS Core',
    slug: 'acme-saas-core',
    organizationId: org._id,
    members: [
      { userId: userAdmin._id, role: 'admin' },
      { userId: userMember._id, role: 'member' },
      { userId: userViewer._id, role: 'viewer' },
    ],
  });
  await workspace.save();

  // Link active workspace to users
  userAdmin.activeWorkspaceId = workspace._id as Types.ObjectId;
  userMember.activeWorkspaceId = workspace._id as Types.ObjectId;
  userViewer.activeWorkspaceId = workspace._id as Types.ObjectId;
  await userAdmin.save();
  await userMember.save();
  await userViewer.save();

  console.log('Seeding Teams...');
  const team = new Team({
    name: 'Product & Design Team',
    workspaceId: workspace._id,
    members: [userAdmin._id, userMember._id],
  });
  await team.save();

  console.log('Seeding Projects...');
  const projectPlatform = new Project({
    name: 'Core SaaS App',
    key: 'PMS',
    description: 'Main product operating system database and UI',
    status: 'active',
    workspaceId: workspace._id,
    teamId: team._id,
    ownerId: userAdmin._id,
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-08-31'),
  });
  await projectPlatform.save();

  console.log('Seeding Sprints...');
  const sprint1 = new Sprint({
    name: 'Sprint 1: Core Framework',
    goal: 'Build authentication schemas and socket connections',
    status: 'completed',
    startDate: new Date('2026-05-01'),
    endDate: new Date('2026-05-15'),
    projectId: projectPlatform._id,
    workspaceId: workspace._id,
  });
  await sprint1.save();

  const sprint2 = new Sprint({
    name: 'Sprint 2: Visual Flow',
    goal: 'Build React Flow canvas and live presence dashboards',
    status: 'active',
    startDate: new Date('2026-05-16'),
    endDate: new Date('2026-06-15'),
    projectId: projectPlatform._id,
    workspaceId: workspace._id,
  });
  await sprint2.save();

  console.log('Seeding Tasks...');
  // Task 1: Auth Module
  const task1 = new Task({
    title: 'Setup JWT authentication & refresh rotation',
    description: 'Implement passport guards, secure cookie verification, and User schemas.',
    key: 'PMS-1',
    status: 'done',
    priority: 'urgent',
    type: 'epic',
    projectId: projectPlatform._id,
    sprintId: sprint1._id,
    workspaceId: workspace._id,
    assignees: [userAdmin._id],
    creatorId: userAdmin._id,
    storyPoints: 5,
    labels: ['backend', 'security'],
    dependencies: [],
  });
  await task1.save();

  // Task 2: Realtime Gateway
  const task2 = new Task({
    title: 'Configure Socket.IO workspace rooms',
    description: 'Track online cursor movements, handle page rooms, and sync live changes.',
    key: 'PMS-2',
    status: 'done',
    priority: 'high',
    type: 'feature',
    projectId: projectPlatform._id,
    sprintId: sprint1._id,
    workspaceId: workspace._id,
    assignees: [userMember._id],
    creatorId: userAdmin._id,
    storyPoints: 3,
    labels: ['backend', 'sockets'],
    dependencies: [],
  });
  await task2.save();

  // Task 3: Dependency Graph Node Linking
  const task3 = new Task({
    title: 'Build React Flow visual linking canvas',
    description: 'Implement drag connect lines to save blocked-by relations in DB.',
    key: 'PMS-3',
    status: 'in_progress',
    priority: 'high',
    type: 'feature',
    projectId: projectPlatform._id,
    sprintId: sprint2._id,
    workspaceId: workspace._id,
    assignees: [userAdmin._id],
    creatorId: userAdmin._id,
    storyPoints: 8,
    labels: ['frontend', 'reactflow'],
    dependencies: [
      { taskId: task2._id, type: 'blocked-by' }, // Blocks by task 2
    ],
  });
  await task3.save();

  // Link reverse dependency
  (task2.dependencies as any).push({ taskId: task3._id as any, type: 'blocks' });
  await task2.save();

  // Task 4: Analytics Widgets
  const task4 = new Task({
    title: 'Create burndown area charts with Recharts',
    description: 'Calculate ideal linear points vs remaining points over active sprints.',
    key: 'PMS-4',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    projectId: projectPlatform._id,
    sprintId: sprint2._id,
    workspaceId: workspace._id,
    assignees: [userMember._id],
    creatorId: userAdmin._id,
    storyPoints: 3,
    labels: ['frontend', 'recharts'],
    dependencies: [
      { taskId: task3._id, type: 'blocked-by' },
    ],
  });
  await task4.save();

  // Task 5: Mobile sidebar
  const task5 = new Task({
    title: 'Fix responsive navigation sidebar for mobile',
    description: 'Use overlay drawer lists on small viewport breakpoints.',
    key: 'PMS-5',
    status: 'backlog',
    priority: 'low',
    type: 'bug',
    projectId: projectPlatform._id,
    workspaceId: workspace._id,
    assignees: [],
    creatorId: userMember._id,
    storyPoints: 1,
    labels: ['frontend', 'css'],
    dependencies: [],
  });
  await task5.save();

  console.log('Seeding Comments...');
  const comment1 = new Comment({
    taskId: task3._id,
    userId: userMember._id,
    content: 'Starting work on the React Flow wrapper now. The canvas is rendering.',
  });
  await comment1.save();

  const comment2 = new Comment({
    taskId: task3._id,
    userId: userAdmin._id,
    content: 'Excellent! Make sure to verify drag-lines link tasks database-side.',
  });
  await comment2.save();

  console.log('Seeding Activities...');
  const activity1 = new Activity({
    workspaceId: workspace._id,
    userId: userAdmin._id,
    entityType: 'task',
    entityId: task3._id,
    action: 'create',
    metadata: { key: 'PMS-3', title: 'Build React Flow visual linking canvas' },
  });
  await activity1.save();

  const activity2 = new Activity({
    workspaceId: workspace._id,
    userId: userAdmin._id,
    entityType: 'comment',
    entityId: comment2._id,
    action: 'comment',
    metadata: { key: 'PMS-3', commentId: comment2._id.toString() },
  });
  await activity2.save();

  console.log('Seeding Notifications...');
  const notif = new Notification({
    userId: userAdmin._id,
    senderId: userMember._id,
    title: 'Mentioned in Comment',
    content: 'Sarah Connor commented on task PMS-3',
    type: 'comment_mention',
    read: false,
    link: `/tasks/${task3._id}`,
  });
  await notif.save();

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error during seeding:', err);
  mongoose.disconnect();
});
