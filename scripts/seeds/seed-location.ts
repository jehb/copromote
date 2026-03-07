
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const location = await prisma.location.upsert({
        where: { name: 'Main Hall' },
        update: {},
        create: {
            name: 'Main Hall',
        },
    })
    console.log('Created location:', location)
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
