import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import * as fs from 'fs'

const prisma = new PrismaClient()

function log(msg: string) {
    fs.appendFileSync('seed-debug.log', msg + '\n')
    console.log(msg)
}

async function main() {
    log('🌱 Starting seed (FINAL ATTEMPT)...')

    try {
        // Cleanup
        log('Cleaning up...')
        await prisma.calendarEvent.deleteMany().catch(e => log('Safe delete calendarEvent failed: ' + e.message))
        await prisma.task.deleteMany().catch(e => log('Safe delete task failed: ' + e.message))
        await prisma.socialPost.deleteMany().catch(e => log('Safe delete socialPost failed: ' + e.message))
        await prisma.asset.deleteMany().catch(e => log('Safe delete asset failed: ' + e.message))

        // Cleanup Tags/Photos omitted as models removed

        await prisma.event.deleteMany().catch(e => log('Safe delete event failed: ' + e.message))
        await prisma.contact.deleteMany().catch(e => log('Safe delete contact failed: ' + e.message))
        await prisma.organization.deleteMany().catch(e => log('Safe delete organization failed: ' + e.message))
        await prisma.project.deleteMany().catch(e => log('Safe delete project failed: ' + e.message))
        await prisma.location.deleteMany().catch(e => log('Safe delete location failed: ' + e.message))
        await prisma.user.deleteMany().catch(e => log('Safe delete user failed: ' + e.message))
        log('Cleanup done.')

        // 1. Locations
        log('Creating Locations...')
        const locCarrboro = await prisma.location.create({ data: { name: 'Carrboro Lawn' } })
        const locSouthernVillage = await prisma.location.create({ data: { name: 'Southern Village Patio' } })
        const locHillsborough = await prisma.location.create({ data: { name: 'Hillsborough Store' } })
        const locRaleigh = await prisma.location.create({ data: { name: 'Raleigh Store' } })
        log('Locations done.')

        // 2. Organizations
        log('Creating Organizations...')
        const orgTown = await prisma.organization.create({
            data: { name: 'Town of Carrboro', category: 'Community Partner', description: 'Local municipal government partner.', website: 'townofcarrboro.org' }
        })
        const orgFarm = await prisma.organization.create({
            data: { name: 'Eco-Farm Collective', category: 'Vendor', description: 'Local organic produce supplier.', website: 'eco-farm.org' }
        })
        const orgCoomer = await prisma.organization.create({
            data: { name: 'Coomer Band', category: 'Performer', description: 'Local bluegrass band.', website: 'coomerband.com' }
        })
        const orgFoodBank = await prisma.organization.create({
            data: { name: 'Orange County Food Bank', category: 'Non-Profit', description: 'Food distribution.', website: 'foodbank.org' }
        })
        log('Organizations done.')

        // 3. Contacts
        log('Creating Contacts...')
        const contactBrenda = await prisma.contact.create({
            data: { firstName: 'Brenda', lastName: 'Camp', company: 'Weaver Street Market', jobTitle: 'Community Outreach', email: 'brenda.c@weaverstreet.coop', notes: 'Key contact.', type: 'Internal' }
        })
        const contactRuffin = await prisma.contact.create({
            data: { firstName: 'Ruffin', lastName: 'Slater', company: 'Weaver Street Market', jobTitle: 'General Manager', email: 'ruffin@weaverstreet.coop', type: 'Internal' }
        })
        const contactMayor = await prisma.contact.create({
            data: { firstName: 'Damon', lastName: 'Seils', company: 'Town of Carrboro', jobTitle: 'Mayor', email: 'mayor@carrboro.org', type: 'Partner', organizationId: orgTown.id }
        })
        log('Contacts done.')

        // 4. Projects
        log('Creating Projects...')
        const projFallFair = await prisma.project.create({
            data: { name: 'Fall Food Fair 2026', description: 'Annual tasting event.', status: 'active', startDate: new Date('2026-09-15'), endDate: new Date('2026-10-15') }
        })
        const projJazz = await prisma.project.create({
            data: { name: 'Sunday Jazz Series', description: 'Weekly lawn concerts.', status: 'active', startDate: new Date('2026-05-01'), endDate: new Date('2026-08-31') }
        })
        const projOwners = await prisma.project.create({
            data: { name: 'Owner Drive Spring', description: 'Campaign to increase ownership.', status: 'completed', startDate: new Date('2026-03-01'), endDate: new Date('2026-03-31') }
        })
        log('Projects done.')

        // 5. Events
        log('Creating Events...')
        const eventFairLaunch = await prisma.event.create({
            data: {
                title: 'Fall Food Fair Launch Party',
                description: 'Kickoff event.',
                startTime: new Date('2026-10-01T17:00:00Z'),
                endTime: new Date('2026-10-01T20:00:00Z'),
                locationId: locCarrboro.id,
                // primaryContactId skipped
            }
        })

        log('Connecting Event 1...')
        await prisma.event.update({
            where: { id: eventFairLaunch.id },
            data: {
                organizations: { connect: [{ id: orgFoodBank.id }, { id: orgFarm.id }] },
                contacts: { connect: [{ id: contactBrenda.id }] }
            }
        })

        const eventJazz1 = await prisma.event.create({
            data: {
                title: 'Jazz on the Lawn: Coomer Band',
                description: 'Live music on the lawn.',
                startTime: new Date('2026-06-07T11:00:00Z'),
                endTime: new Date('2026-06-07T13:00:00Z'),
                locationId: locCarrboro.id,
            }
        })
        await prisma.event.update({
            where: { id: eventJazz1.id },
            data: {
                organizations: { connect: [{ id: orgCoomer.id }] }
            }
        })
        log('Events done.')

        // 6. Social Posts
        log('Creating Social Posts...')
        await prisma.socialPost.create({
            data: {
                content: 'Come taste the best apples! 🍎',
                platform: 'Instagram',
                status: 'scheduled',
                scheduledDate: new Date('2026-09-28T10:00:00Z'),
                eventId: eventFairLaunch.id
            }
        })
        await prisma.socialPost.create({
            data: {
                content: 'Sunday Jazz starts this week! 🎷',
                platform: 'Facebook',
                status: 'draft',
                eventId: eventJazz1.id
            }
        })
        log('Social Posts done.')

        // 7. Tasks
        log('Creating Tasks...')
        await prisma.task.create({
            data: {
                title: 'Design Event Poster',
                description: 'Create 11x17 poster.',
                status: 'in-progress',
                dueDate: new Date('2026-09-01'),
                projectId: projFallFair.id
            }
        })
        await prisma.task.create({
            data: {
                title: 'Book Bands for August',
                description: 'Finalize schedule.',
                status: 'todo',
                dueDate: new Date('2026-05-15'),
                projectId: projJazz.id
            }
        })
        log('Tasks done.')

        // User
        log('Upserting User...')
        const passwordHash = await bcrypt.hash('admin', 10)
        await prisma.user.upsert({
            where: { email: 'admin@copromote.app' },
            update: {},
            create: {
                email: 'admin@copromote.app',
                username: 'admin',
                name: 'Admin User',
                password: passwordHash,
                mustChangePassword: true
            }
        })
        log('User done.')

        log('✅ Seed completed!')
    } catch (error: any) {
        log('❌ SEED FAILED AT STEP:')
        log(JSON.stringify(error, null, 2))
        if (error.message) log(error.message)
        throw error
    }
}

main()
    .catch((e) => {
        log('Process fatal error: ' + e.message)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
