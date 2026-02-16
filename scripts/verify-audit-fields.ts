
import { prisma } from '../lib/db'

async function main() {
    console.log('Verifying audit fields...')

    // 1. Create a dummy user if needed (or use existing)
    const user = await prisma.user.findFirst()
    if (!user) {
        console.error('No user found to test with')
        return
    }
    console.log(`Using user: ${user.username}`)

    // 2. Create a project
    const project = await prisma.project.create({
        data: {
            name: 'Audit Test Project ' + Date.now(),
            startDate: new Date(),
            createdById: user.id,
            updatedById: user.id
        }
    })
    console.log(`Created project: ${project.id}`)

    // 3. Fetch the project using the action-like query (with include)
    const fetchedProject = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
            createdBy: {
                select: { id: true, username: true }
            },
            updatedBy: {
                select: { id: true, username: true }
            }
        }
    })

    if (!fetchedProject) {
        console.error('Failed to fetch project')
        return
    }

    console.log('Fetched Project Audit Info:')
    console.log('Created By:', fetchedProject.createdBy)
    console.log('Updated By:', fetchedProject.updatedBy)

    if (fetchedProject.createdBy?.id === user.id && fetchedProject.updatedBy?.id === user.id) {
        console.log('SUCCESS: Project audit fields are correctly populated.')
    } else {
        console.error('FAILURE: Project audit fields are missing or incorrect.')
    }

    // Cleanup Project
    await prisma.project.delete({ where: { id: project.id } })

    // 4. Test Contact
    console.log('Testing Contact...')
    const contact = await prisma.contact.create({
        data: {
            firstName: 'Audit',
            lastName: 'Test',
            type: 'Client',
            createdById: user.id,
            updatedById: user.id
        }
    })

    const fetchedContact = await prisma.contact.findUnique({
        where: { id: contact.id },
        include: {
            createdBy: { select: { id: true, username: true } },
            updatedBy: { select: { id: true, username: true } }
        }
    })

    if (fetchedContact?.createdBy?.id === user.id) {
        console.log('SUCCESS: Contact audit fields are correctly populated.')
    } else {
        console.error('FAILURE: Contact audit fields are missing.')
    }
    await prisma.contact.delete({ where: { id: contact.id } })

    // 5. Test Organization
    console.log('Testing Organization...')
    const org = await prisma.organization.create({
        data: {
            name: 'Audit Test Org',
            category: 'Vendor',
            createdById: user.id,
            updatedById: user.id
        }
    })

    const fetchedOrg = await prisma.organization.findUnique({
        where: { id: org.id },
        include: {
            createdBy: { select: { id: true, username: true } },
            updatedBy: { select: { id: true, username: true } }
        }
    })

    if (fetchedOrg?.createdBy?.id === user.id) {
        console.log('SUCCESS: Organization audit fields are correctly populated.')
    } else {
        console.error('FAILURE: Organization audit fields are missing.')
    }
    await prisma.organization.delete({ where: { id: org.id } })
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
