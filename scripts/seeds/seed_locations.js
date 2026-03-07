const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding locations...')

    const locations = [
        'Carrboro',
        'Chapel Hill',
        'Hillsborough',
        'Raleigh'
    ]

    for (const name of locations) {
        await prisma.location.upsert({
            where: { name },
            update: {},
            create: { name }
        })
    }

    console.log('Locations seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
