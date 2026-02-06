import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Create admin user
    const adminPassword = await hashPassword('admin')
    const admin = await prisma.user.upsert({
        where: { email: 'admin@promoty.local' },
        update: {},
        create: {
            email: 'admin@promoty.local',
            name: 'Admin User',
            username: 'admin',
            password: adminPassword,
            mustChangePassword: true,
        },
    })
    console.log('Created admin user: admin / admin')

    // Create a config entry
    await prisma.config.create({
        data: {
            key: 'system_initialized',
            value: new Date().toISOString(),
        },
    })

    console.log('✅ Seed complete')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
