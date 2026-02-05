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

    for (const period of periods) {
        const created = await prisma.promotionPeriod.create({
            data: period,
        })
        console.log(`Created period: ${created.name} (${created.id})`)
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
