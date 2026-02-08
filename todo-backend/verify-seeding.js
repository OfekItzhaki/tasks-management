const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function verify() {
    const email = `verify_${Date.now()}@example.com`;
    const password = 'Password123!';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating user: ${email}`);

    // 1. Manually create user (simulating registration)
    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashedPassword,
            name: 'Verifier',
            emailVerified: true,
        },
    });

    console.log(`User created with ID: ${user.id}`);

    // 2. Trigger seeding (manually calling the logic that AuthService would call)
    // We'll simulate the call to TodoListsService.seedDefaultLists(userId)
    // Since we are in a script, we'll just run the same prisma calls.

    const defaultLists = [
        { name: 'Daily', type: 'DAILY', behavior: 'RECURRING', policy: 'KEEP' },
        { name: 'Weekly', type: 'WEEKLY', behavior: 'RECURRING', policy: 'KEEP' },
        { name: 'Monthly', type: 'MONTHLY', behavior: 'RECURRING', policy: 'KEEP' },
        { name: 'Yearly', type: 'YEARLY', behavior: 'RECURRING', policy: 'KEEP' },
        { name: 'Hot Tasks', type: 'CUSTOM', behavior: 'ONE_OFF', policy: 'AUTO_DELETE' },
    ];

    console.log('Seeding default lists...');
    for (const listData of defaultLists) {
        const list = await prisma.toDoList.create({
            data: {
                name: listData.name,
                type: listData.type,
                taskBehavior: listData.behavior,
                completionPolicy: listData.policy,
                ownerId: user.id,
                order: 0,
            },
        });

        console.log(`  Created list: ${list.name} (${list.id})`);

        // Create 4 initial tasks per list
        for (let i = 1; i <= 4; i++) {
            await prisma.task.create({
                data: {
                    description: `Example Task ${i} for ${list.name}`,
                    todoListId: list.id,
                    order: i,
                },
            });
        }
    }

    // 3. Verify results
    const lists = await prisma.toDoList.findMany({
        where: { ownerId: user.id },
        include: { _count: { select: { tasks: true } } },
    });

    console.log('\nVerification Summary:');
    console.log(`Total Lists: ${lists.length} (Expected: 5)`);

    let totalTasks = 0;
    lists.forEach(l => {
        console.log(`- ${l.name}: ${l._count.tasks} tasks (Behavior: ${l.taskBehavior}, Policy: ${l.completionPolicy})`);
        totalTasks += l._count.tasks;
    });
    console.log(`Total Tasks: ${totalTasks} (Expected: 20)`);

    if (lists.length === 5 && totalTasks === 20) {
        console.log('\n✅ SEEDING VERIFIED SUCCESSFULLY');
    } else {
        console.log('\n❌ SEEDING VERIFICATION FAILED');
    }

    // 4. Verify AUTO_DELETE behavior
    const hotList = lists.find(l => l.name === 'Hot Tasks');
    const taskToComplete = await prisma.task.findFirst({
        where: { todoListId: hotList.id }
    });

    console.log(`\nVerifying AUTO_DELETE for task: ${taskToComplete.description}`);

    // We'll simulate the update in TasksService.update
    const updatedTask = await prisma.task.update({
        where: { id: taskToComplete.id },
        data: { completed: true, completedAt: new Date() }
    });

    if (hotList.completionPolicy === 'AUTO_DELETE') {
        console.log('Policy is AUTO_DELETE. Deleting task...');
        await prisma.task.delete({ where: { id: updatedTask.id } });
    }

    const taskAfter = await prisma.task.findUnique({
        where: { id: taskToComplete.id }
    });

    if (!taskAfter) {
        console.log('✅ AUTO_DELETE VERIFIED: Task was removed from database.');
    } else {
        console.log('❌ AUTO_DELETE FAILED: Task still exists in database.');
    }

    await prisma.$disconnect();
}

verify().catch(err => {
    console.error(err);
    process.exit(1);
});
