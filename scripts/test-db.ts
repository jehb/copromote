import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Testing ActivityLog access...')
    try {
        const count = await prisma.activityLog.count()
        console.log(`ActivityLog count: ${count}`)

        const logs = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 5
        })
        console.log('Recent logs:', JSON.stringify(logs, null, 2))
    } catch (error) {
        console.error('Error accessing ActivityLog:', error)
    } finally {
        await prisma.$disconnect()
    }
}

main()
