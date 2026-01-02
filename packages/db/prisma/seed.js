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

  // Create demo projects
  const project1 = await prisma.project.upsert({
    where: { id: 'demo-project-1' },
    update: {},
    create: {
      id: 'demo-project-1',
      name: 'Website Redesign',
      ownerId: createdUsers[0].id,
      members: {
        create: [
          { userId: createdUsers[0].id, role: 'OWNER' },
          { userId: createdUsers[1].id, role: 'MEMBER' },
        ],
      },
    },
  });
  console.log(`Created project: ${project1.name}`);

  const project2 = await prisma.project.upsert({
    where: { id: 'demo-project-2' },
    update: {},
    create: {
      id: 'demo-project-2',
      name: 'Mobile App Development',
      ownerId: createdUsers[1].id,
      members: {
        create: [
          { userId: createdUsers[1].id, role: 'OWNER' },
          { userId: createdUsers[0].id, role: 'MEMBER' },
          { userId: createdUsers[2].id, role: 'MEMBER' },
        ],
      },
    },
  });
  console.log(`Created project: ${project2.name}`);

  const project3 = await prisma.project.upsert({
    where: { id: 'demo-project-3' },
    update: {},
    create: {
      id: 'demo-project-3',
      name: 'API Integration',
      ownerId: createdUsers[0].id,
      members: {
        create: [
          { userId: createdUsers[0].id, role: 'OWNER' },
        ],
      },
    },
  });
  console.log(`Created project: ${project3.name}`);

  // Create demo tasks
  await prisma.task.createMany({
    data: [
      {
        title: 'Design homepage mockup',
        description: 'Create initial design concepts',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project1.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Setup authentication',
        description: 'Implement JWT authentication',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project1.id,
      },
      {
        title: 'Database schema design',
        description: 'Design the database structure',
        status: 'DONE',
        priority: 'MEDIUM',
        projectId: project1.id,
        assigneeId: createdUsers[0].id,
      },
      {
        title: 'Build login screen',
        description: 'Create mobile login UI',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        projectId: project2.id,
        assigneeId: createdUsers[2].id,
      },
      {
        title: 'Setup push notifications',
        description: 'Integrate Firebase messaging',
        status: 'TODO',
        priority: 'MEDIUM',
        projectId: project2.id,
      },
      {
        title: 'User profile page',
        description: 'Build user profile functionality',
        status: 'TODO',
        priority: 'LOW',
        projectId: project2.id,
        assigneeId: createdUsers[1].id,
      },
      {
        title: 'Connect to third-party API',
        description: 'Integrate external payment API',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project3.id,
        assigneeId: createdUsers[0].id,
      },
    ],
    skipDuplicates: true,
  });
  console.log('Created demo tasks');

  console.log('\nDemo data created successfully!');
  console.log('\nDemo Users:');
  console.log('- john@example.com / password123');
  console.log('- jane@example.com / password123');
  console.log('- bob@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
