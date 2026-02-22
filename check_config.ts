import { prisma } from './lib/db'

async function checkConfig() {
    const configs = await prisma.config.findMany()
    console.log(JSON.stringify(configs, null, 2))
    await prisma.$disconnect()
}

checkConfig()
