const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding sample events...')

    // 1. Fetch Locations
    const locWestEnd = await prisma.location.findUnique({ where: { name: 'West End' } })
    const locDowntown = await prisma.location.findUnique({ where: { name: 'Downtown' } })
    const locNorthside = await prisma.location.findUnique({ where: { name: 'Northside' } })

    if (!locWestEnd || !locDowntown || !locNorthside) {
        console.error('Locations not found. Please run seed_locations.js first.')
        return
    }

    // 2. Fetch a User (Primary Contact) - just get the first one
    const contact = await prisma.user.findFirst()

    if (!contact) {
        console.log('No users found. Creating events without a primary contact.')
    } else {
        console.log(`Assigning events to contact: ${contact.name}`)
    }

    const contactId = contact ? contact.id : null

    const events = [
        {
            title: 'Living History: Local Stories & Legacy',
            description: 'Celebration of local history sharing stories and narratives from the community.',
            startTime: new Date('2026-02-22T13:00:00'),
            endTime: new Date('2026-02-22T15:30:00'),
            locationId: locWestEnd.id,
            primaryContactId: contactId
        },
        {
            title: 'Sourcing Sustainably Discussion',
            description: 'Featuring local food producers and tasting and stories about seasonal harvesting.',
            startTime: new Date('2026-03-22T11:00:00'),
            endTime: new Date('2026-03-22T13:00:00'),
            locationId: locWestEnd.id,
            primaryContactId: contactId
        },
        {
            title: 'Downtown Lunch & Learn',
            description: 'Healthy cooking and wellness: A natural approach to nutrition and solutions.',
            startTime: new Date('2026-02-26T11:00:00'),
            endTime: new Date('2026-02-26T12:30:00'),
            locationId: locDowntown.id,
            primaryContactId: contactId
        },
        {
            title: 'Fresh Seasonal Produce Expo',
            description: 'A celebration of locally harvested vegetables and healthy eating!',
            startTime: new Date('2026-02-28T11:00:00'),
            endTime: new Date('2026-02-28T13:00:00'),
            locationId: locNorthside.id,
            primaryContactId: contactId
        }
    ]

    await Promise.all(events.map(async (event) => {
        // Use a simple check to avoid duplicates if re-running
        const existing = await prisma.event.findFirst({
            where: {
                title: event.title,
                startTime: event.startTime
            }
        })

        if (!existing) {
            await prisma.event.create({ data: event })
            console.log(`Created event: ${event.title}`)
        } else {
            console.log(`Skipped existing event: ${event.title}`)
        }
    }))

    console.log('Events seeded successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
