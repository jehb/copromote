const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding default roles...')

    const defaultRoles = [
        { name: 'ADMIN', description: 'System Administrator with full access to all features.', isSystem: true },
        { name: 'MANAGER', description: 'Management role with elevated access.', isSystem: true },
        { name: 'EDITOR', description: 'Editor role with ability to modify content.', isSystem: true },
        { name: 'USER', description: 'Standard user with basic access.', isSystem: true },
    ]

    await Promise.all(
        defaultRoles.map(async (role) => {
            await prisma.role.upsert({
                where: { name: role.name },
                update: {},
                create: role,
            })
            console.log(`Ensured role: ${role.name}`)
        })
    )

    console.log('Seeding completed successfully.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
