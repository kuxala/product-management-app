const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create demo users
  const users = [
    {
      email: 'john@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
    },
    {
      email: 'jane@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Jane Smith',
    },
    {
      email: 'bob@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Bob Johnson',
    },
  ];

  const createdUsers = [];
  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData,
    });
    createdUsers.push(user);
    console.log(`Created user: ${user.email}`);
  }

  // Create workspace for John (main user)
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'Main workspace for Acme Corp projects',
      members: {
        create: [
          { userId: createdUsers[0].id, role: 'OWNER' },
          { userId: createdUsers[1].id, role: 'ADMIN' },
          { userId: createdUsers[2].id, role: 'MEMBER' },
        ],
      },
    },
  });
  console.log(`Created workspace: ${workspace.name}`);

  // Create spaces
  const engineeringSpace = await prisma.space.create({
    data: {
      name: 'Engineering',
      description: 'Engineering team projects',
      color: '#6366f1',
      icon: 'code',
      workspaceId: workspace.id,
    },
  });
  console.log(`Created space: ${engineeringSpace.name}`);

  const marketingSpace = await prisma.space.create({
    data: {
      name: 'Marketing',
      description: 'Marketing campaigns and initiatives',
      color: '#ec4899',
      icon: 'megaphone',
      workspaceId: workspace.id,
    },
  });
  console.log(`Created space: ${marketingSpace.name}`);

  const designSpace = await prisma.space.create({
    data: {
      name: 'Design',
      description: 'Design projects and assets',
      color: '#f59e0b',
      icon: 'palette',
      workspaceId: workspace.id,
    },
  });
  console.log(`Created space: ${designSpace.name}`);

  // Create projects in Engineering space
  const webAppProject = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Complete redesign of the company website',
      spaceId: engineeringSpace.id,
      ownerId: createdUsers[0].id,
      members: {
        create: [
          { userId: createdUsers[0].id, role: 'OWNER' },
          { userId: createdUsers[1].id, role: 'MEMBER' },
        ],
      },
      taskLists: {
        create: [
          { name: 'Backlog', position: 0 },
          { name: 'To Do', position: 1 },
          { name: 'In Progress', position: 2 },
          { name: 'Done', position: 3 },
        ],
      },
    },
    include: { taskLists: true },
  });
  console.log(`Created project: ${webAppProject.name}`);

  const mobileAppProject = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'iOS and Android mobile application',
      spaceId: engineeringSpace.id,
      ownerId: createdUsers[1].id,
      members: {
        create: [
          { userId: createdUsers[1].id, role: 'OWNER' },
          { userId: createdUsers[0].id, role: 'MEMBER' },
          { userId: createdUsers[2].id, role: 'MEMBER' },
        ],
      },
      taskLists: {
        create: [
          { name: 'Sprint Backlog', position: 0 },
          { name: 'In Development', position: 1 },
          { name: 'Code Review', position: 2 },
          { name: 'Testing', position: 3 },
          { name: 'Deployed', position: 4 },
        ],
      },
    },
    include: { taskLists: true },
  });
  console.log(`Created project: ${mobileAppProject.name}`);

  // Create project in Marketing space
  const marketingProject = await prisma.project.create({
    data: {
      name: 'Q1 Campaign',
      description: 'First quarter marketing campaign',
      spaceId: marketingSpace.id,
      ownerId: createdUsers[0].id,
      members: {
        create: [
          { userId: createdUsers[0].id, role: 'OWNER' },
        ],
      },
      taskLists: {
        create: [
          { name: 'Planning', position: 0 },
          { name: 'Execution', position: 1 },
          { name: 'Completed', position: 2 },
        ],
      },
    },
    include: { taskLists: true },
  });
  console.log(`Created project: ${marketingProject.name}`);

  // Get task list references
  const webAppTodo = webAppProject.taskLists.find(l => l.name === 'To Do');
  const webAppInProgress = webAppProject.taskLists.find(l => l.name === 'In Progress');
  const webAppDone = webAppProject.taskLists.find(l => l.name === 'Done');

  const mobileBacklog = mobileAppProject.taskLists.find(l => l.name === 'Sprint Backlog');
  const mobileDev = mobileAppProject.taskLists.find(l => l.name === 'In Development');

  // Create tasks for Website Redesign
  const task1 = await prisma.task.create({
    data: {
      title: 'Design homepage mockup',
      description: 'Create initial design concepts for the new homepage',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      position: 0,
      projectId: webAppProject.id,
      taskListId: webAppInProgress.id,
      assigneeId: createdUsers[1].id,
    },
  });

  // Create subtasks for task1
  await prisma.task.createMany({
    data: [
      {
        title: 'Create wireframes',
        status: 'DONE',
        priority: 'MEDIUM',
        position: 0,
        projectId: webAppProject.id,
        taskListId: webAppInProgress.id,
        parentId: task1.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Design hero section',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        position: 1,
        projectId: webAppProject.id,
        taskListId: webAppInProgress.id,
        parentId: task1.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Design footer',
        status: 'TODO',
        priority: 'LOW',
        position: 2,
        projectId: webAppProject.id,
        taskListId: webAppInProgress.id,
        parentId: task1.id,
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        title: 'Setup authentication',
        description: 'Implement JWT authentication with refresh tokens',
        status: 'TODO',
        priority: 'HIGH',
        position: 0,
        projectId: webAppProject.id,
        taskListId: webAppTodo.id,
      },
      {
        title: 'Create API documentation',
        description: 'Document all REST API endpoints',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 1,
        projectId: webAppProject.id,
        taskListId: webAppTodo.id,
        assigneeId: createdUsers[0].id,
      },
      {
        title: 'Database schema design',
        description: 'Design the database structure',
        status: 'DONE',
        priority: 'HIGH',
        position: 0,
        projectId: webAppProject.id,
        taskListId: webAppDone.id,
        assigneeId: createdUsers[0].id,
      },
    ],
  });
  console.log('Created tasks for Website Redesign');

  // Create tasks for Mobile App
  await prisma.task.createMany({
    data: [
      {
        title: 'Build login screen',
        description: 'Create mobile login UI with social login options',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        position: 0,
        projectId: mobileAppProject.id,
        taskListId: mobileDev.id,
        assigneeId: createdUsers[2].id,
      },
      {
        title: 'Setup push notifications',
        description: 'Integrate Firebase Cloud Messaging',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 0,
        projectId: mobileAppProject.id,
        taskListId: mobileBacklog.id,
      },
      {
        title: 'User profile page',
        description: 'Build user profile functionality with avatar upload',
        status: 'TODO',
        priority: 'LOW',
        position: 1,
        projectId: mobileAppProject.id,
        taskListId: mobileBacklog.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Offline mode support',
        description: 'Add offline caching and sync functionality',
        status: 'TODO',
        priority: 'MEDIUM',
        position: 2,
        projectId: mobileAppProject.id,
        taskListId: mobileBacklog.id,
      },
    ],
  });
  console.log('Created tasks for Mobile App');

  // Create a second workspace for Jane
  const janeWorkspace = await prisma.workspace.create({
    data: {
      name: "Jane's Personal",
      slug: 'janes-personal',
      description: 'Personal projects and notes',
      members: {
        create: [
          { userId: createdUsers[1].id, role: 'OWNER' },
        ],
      },
    },
  });
  console.log(`Created workspace: ${janeWorkspace.name}`);

  const personalSpace = await prisma.space.create({
    data: {
      name: 'Personal',
      description: 'Personal projects',
      color: '#10b981',
      workspaceId: janeWorkspace.id,
    },
  });

  await prisma.project.create({
    data: {
      name: 'Side Project Ideas',
      description: 'Collection of side project ideas to explore',
      spaceId: personalSpace.id,
      ownerId: createdUsers[1].id,
      members: {
        create: [
          { userId: createdUsers[1].id, role: 'OWNER' },
        ],
      },
      taskLists: {
        create: [
          { name: 'Ideas', position: 0 },
          { name: 'Researching', position: 1 },
          { name: 'Building', position: 2 },
        ],
      },
    },
  });
  console.log('Created personal project for Jane');

  console.log('\n✅ Demo data created successfully!');
  console.log('\n📧 Demo Users:');
  console.log('- john@example.com / password123 (Owner of Acme Corp)');
  console.log('- jane@example.com / password123 (Admin of Acme Corp, Owner of Personal)');
  console.log('- bob@example.com / password123 (Member of Acme Corp)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
