const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding users...')

    const users = [
        'Sylwia',
        'Jason',
        'Brenda',
        'Portia',
        'Linda',
        'Alli',
        'Carolyn',
        'Lisa',
        'Peg',
        'Julie'
    ]

    for (const name of users) {
        const email = `${name.toLowerCase()}@example.com`
        await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name,
                email,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
            }
        })
    }

    console.log('Users seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
