const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding users...')

    const users = [
        'sylwia.s',
        'brenda.c',
        'portia.h',
        'alli.j',
        'carolyn.t',
        'lisa.w',
        'peg.t',
        'julie.f'
    ]

    for (const name of users) {
        const email = `${name.toLowerCase()}@example.com`
        await prisma.user.upsert({
            where: { email },
            update: {
                avatar: null
            },
            create: {
                name,
                username: name,
                email
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
