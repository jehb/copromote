const { PrismaClient } = require('@prisma/client')
require('dotenv').config()
const prisma = new PrismaClient()

async function main() {
    const events = await prisma.event.findMany({
        include: { location: true }
    })
    console.log(`Found ${events.length} events:`)
    events.forEach(e => console.log(`- ${e.title} at ${e.location.name} (${e.startTime})`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
