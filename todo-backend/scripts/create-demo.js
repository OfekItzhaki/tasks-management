const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function createDemo() {
  const email = 'demo@horizon.com';
  const password = 'HorizonPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Checking for existing demo account: ${email}`);

  // Cleanup existing demo if any
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    console.log('Cleaning up existing demo data...');
    // Delete tasks, lists, and user
    await prisma.task.deleteMany({
      where: { todoList: { ownerId: existingUser.id } },
    });
    await prisma.toDoList.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
  }

  console.log('Creating fresh demo user...');
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: hashedPassword,
      name: 'Horizon Demo',
      emailVerified: true,
    },
  });

  console.log(`User created. Creating default lists...`);

  // Seeding logic (matching TodoListsService)
  const defaultLists = [
    { name: 'Daily', type: 'DAILY', behavior: 'RECURRING', policy: 'KEEP' },
    { name: 'Weekly', type: 'WEEKLY', behavior: 'RECURRING', policy: 'KEEP' },
    { name: 'Monthly', type: 'MONTHLY', behavior: 'RECURRING', policy: 'KEEP' },
    { name: 'Yearly', type: 'YEARLY', behavior: 'RECURRING', policy: 'KEEP' },
    {
      name: 'Hot Tasks',
      type: 'CUSTOM',
      behavior: 'ONE_OFF',
      policy: 'AUTO_DELETE',
    },
    {
      name: 'Trash',
      type: 'TRASH',
      behavior: 'ONE_OFF',
      policy: 'KEEP',
      isSystem: true,
    },
  ];

  for (const listData of defaultLists) {
    const list = await prisma.toDoList.create({
      data: {
        name: listData.name,
        type: listData.type,
        taskBehavior: listData.behavior,
        completionPolicy: listData.policy,
        isSystem: listData.isSystem || false,
        ownerId: user.id,
        order: 0,
      },
    });

    // Seed 4 tasks for non-Trash lists
    if (listData.type !== 'TRASH') {
      for (let i = 1; i <= 4; i++) {
        await prisma.task.create({
          data: {
            description: `Example: ${listData.name} item ${i}`,
            todoListId: list.id,
            order: i,
          },
        });
      }
    }
  }

  console.log('\n-----------------------------------');
  console.log('DEMO ACCOUNT READY');
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log('-----------------------------------');

  await prisma.$disconnect();
}

createDemo().catch((err) => {
  console.error(err);
  process.exit(1);
});
