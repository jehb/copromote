
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const userCount = await prisma.user.count()
    const projectCount = await prisma.project.count()
    const taskCount = await prisma.task.count()
    const contactCount = await prisma.contact.count()
    const eventCount = await prisma.event.count()
    const postCount = await prisma.socialPost.count()

    console.log('Database Counts:')
    console.log(`Users: ${userCount}`)
    console.log(`Projects: ${projectCount}`)
    console.log(`Tasks: ${taskCount}`)
    console.log(`Contacts: ${contactCount}`)
    console.log(`Events: ${eventCount}`)
    console.log(`Social Posts: ${postCount}`)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
