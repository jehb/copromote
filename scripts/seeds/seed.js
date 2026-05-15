const { PrismaClient } = require('@prisma/client')
require('dotenv').config()

const prisma = new PrismaClient()

async function main() {
    const periods = [
        {
            name: 'Promotion Period 1',
            startDate: new Date('2026-02-04'),
            endDate: new Date('2026-02-18'), // 2 weeks later
        },
        {
            name: 'Promotion Period 2',
            startDate: new Date('2026-02-18'),
            endDate: new Date('2026-03-04'), // 2 weeks later
        },
        {
            name: 'Promotion Period 3',
            startDate: new Date('2026-03-04'),
            endDate: new Date('2026-03-18'), // 2 weeks later
        },
    ]

    console.log('Seeding promotion periods...')

    await prisma.promotionPeriod.createMany({
        data: periods,
    })

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
