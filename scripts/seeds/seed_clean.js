const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up old promotion periods...')
    await prisma.promotionPeriod.deleteMany({})

    const periods = [
        {
            name: 'Promotion Period 1',
            // Start Wednesday Feb 4, 2026 (Noon UTC to avoid timezone shift)
            startDate: new Date('2026-02-04T12:00:00Z'),
            // End Tuesday Feb 17, 2026 (inclusive)
            endDate: new Date('2026-02-17T12:00:00Z'),
        },
        {
            name: 'Promotion Period 2',
            // Start Wednesday Feb 18, 2026
            startDate: new Date('2026-02-18T12:00:00Z'),
            endDate: new Date('2026-03-03T12:00:00Z'),
        },
        {
            name: 'Promotion Period 3',
            // Start Wednesday Mar 4, 2026
            startDate: new Date('2026-03-04T12:00:00Z'),
            endDate: new Date('2026-03-17T12:00:00Z'),
        },
    ]

    console.log('Seeding new promotion periods...')

    for (const period of periods) {
        const created = await prisma.promotionPeriod.create({
            data: period,
        })
        console.log(`Created period: ${created.name} (${created.startDate.toISOString()} - ${created.endDate.toISOString()})`)
    }

    const count = await prisma.promotionPeriod.count()
    console.log(`Total Promotion Periods: ${count}`)
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
