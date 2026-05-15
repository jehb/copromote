const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('Seeding Weaver Street Market events...')

    // 1. Fetch Locations
    const locCarrboro = await prisma.location.findUnique({ where: { name: 'Carrboro' } })
    const locHillsborough = await prisma.location.findUnique({ where: { name: 'Hillsborough' } })
    const locRaleigh = await prisma.location.findUnique({ where: { name: 'Raleigh' } })

    if (!locCarrboro || !locHillsborough || !locRaleigh) {
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
            title: 'Living History: From the Rock Wall',
            description: 'Celebration of Black History Month sharing stories of Chapel Hill and Carrboro\'s Black history. In collaboration with the Marian Cheek Jackson Center.',
            startTime: new Date('2026-02-22T13:00:00'),
            endTime: new Date('2026-02-22T15:30:00'),
            locationId: locCarrboro.id,
            primaryContactId: contactId
        },
        {
            title: 'A Recipe for Dignity in Ghana',
            description: 'Featuring Abena Antwi of Queen\'s Jollof Sauce. Tasting and stories about her childhood home.',
            startTime: new Date('2026-03-22T11:00:00'),
            endTime: new Date('2026-03-22T13:00:00'),
            locationId: locCarrboro.id,
            primaryContactId: contactId
        },
        {
            title: 'Hillsborough Lunch & Learn',
            description: 'Getting to the Heart of Cardiovascular Disease: A Natural Approach to Prevention and Solutions.',
            startTime: new Date('2026-02-26T11:00:00'),
            endTime: new Date('2026-02-26T12:30:00'),
            locationId: locHillsborough.id,
            primaryContactId: contactId
        },
        {
            title: 'Vege-Palooza!',
            description: 'A celebration of vegetables and healthy eating!',
            startTime: new Date('2026-02-28T11:00:00'),
            endTime: new Date('2026-02-28T13:00:00'),
            locationId: locRaleigh.id,
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
