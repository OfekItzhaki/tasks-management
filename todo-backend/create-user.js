const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createUser() {
    const email = 'test@example.com';
    const password = 'password';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log(`Creating user: ${email}`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            emailVerificationOtp: null,
            emailVerified: true,
            passwordResetOtp: null,
            passwordResetExpiresAt: null,
        },
        create: {
            email,
            passwordHash: hashedPassword,
            name: 'Test User',
            emailVerified: true,
            passwordResetOtp: null,
            passwordResetExpiresAt: null,
            emailVerificationOtp: null,
        },
    });

    console.log('User created/updated successfully:', user.email);
}

createUser()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
