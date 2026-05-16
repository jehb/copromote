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

    // ⚡ Bolt: Execute location upserts concurrently to prevent N+1 query performance bottleneck
    await Promise.all(
        locations.map(name =>
            prisma.location.upsert({
                where: { name },
                update: {},
                create: { name }
            })
        )
    )

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
