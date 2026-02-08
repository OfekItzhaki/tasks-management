const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    const email = 'test@example.com'; // Adjust if user is using a different email, but this is the likely test one
    console.log(`Checking for user: ${email}`);
    const user = await prisma.user.findFirst({
        where: { email },
    });

    if (user) {
        console.log('User found:', {
            id: user.id,
            email: user.email,
            hasPasswordHash: !!user.passwordHash,
            emailVerified: !!user.emailVerifiedAt,
        });
    } else {
        console.log('User NOT found.');
    }
}

checkUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
