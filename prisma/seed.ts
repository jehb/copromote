import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'
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
        const locMainLawn = await prisma.location.create({ data: { name: 'Main Lawn' } })
        const locWestside = await prisma.location.create({ data: { name: 'Westside Patio' } })
        const locNorthside = await prisma.location.create({ data: { name: 'Northside Store' } })
        const locDowntown = await prisma.location.create({ data: { name: 'Downtown Store' } })
        log('Locations done.')

        // 2. Organizations
        log('Creating Organizations...')
        const orgTown = await prisma.organization.create({
            data: { name: 'City Government', category: 'Community Partner', description: 'Local municipal government partner.', website: 'citygov.example.org' }
        })
        const orgFarm = await prisma.organization.create({
            data: { name: 'Eco-Farm Collective', category: 'Vendor', description: 'Local organic produce supplier.', website: 'eco-farm.example.org' }
        })
        const orgCoomer = await prisma.organization.create({
            data: { name: 'Bluegrass Band', category: 'Performer', description: 'Local bluegrass performers.', website: 'bluegrassband.example.com' }
        })
        const orgFoodBank = await prisma.organization.create({
            data: { name: 'Community Food Bank', category: 'Non-Profit', description: 'Food distribution.', website: 'foodbank.example.org' }
        })
        log('Organizations done.')

        // 3. Contacts
        log('Creating Contacts...')
        const contactOutreach = await prisma.contact.create({
            data: { firstName: 'Jane', lastName: 'Doe', company: 'Community Co-op', jobTitle: 'Community Outreach', email: 'jane.doe@example.com', notes: 'Key contact.', type: 'Internal' }
        })
        const contactManager = await prisma.contact.create({
            data: { firstName: 'John', lastName: 'Smith', company: 'Community Co-op', jobTitle: 'General Manager', email: 'john.smith@example.com', type: 'Internal' }
        })
        const contactMayor = await prisma.contact.create({
            data: { firstName: 'Alex', lastName: 'Johnson', company: 'City Government', jobTitle: 'Mayor', email: 'mayor@example.org', type: 'Partner', organizationId: orgTown.id }
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
                locationId: locMainLawn.id,
                // primaryContactId skipped
            }
        })

        log('Connecting Event 1...')
        await prisma.event.update({
            where: { id: eventFairLaunch.id },
            data: {
                organizations: { connect: [{ id: orgFoodBank.id }, { id: orgFarm.id }] },
                contacts: { connect: [{ id: contactOutreach.id }] }
            }
        })

        const eventJazz1 = await prisma.event.create({
            data: {
                title: 'Jazz on the Lawn: Bluegrass Performance',
                description: 'Live music on the lawn.',
                startTime: new Date('2026-06-07T11:00:00Z'),
                endTime: new Date('2026-06-07T13:00:00Z'),
                locationId: locMainLawn.id,
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

        // Roles
        log('Seeding Default Roles...')
        const roles = [
            { name: 'ADMIN', description: 'System Administrator with full access', isSystem: true },
            { name: 'USER', description: 'Standard user with basic access', isSystem: true },
            { name: 'EDITOR', description: 'Content editor with publishing access', isSystem: true }
        ]
        for (const role of roles) {
            await prisma.role.upsert({
                where: { name: role.name },
                update: { description: role.description, isSystem: role.isSystem },
                create: role
            })
        }
        log('Roles done.')

        // Permissions
        log('Seeding Default Role Permissions...')
        const systemPages = [
            'admin', 'calendar', 'chat', 'contacts', 'email-planner',
            'events', 'gallery', 'organizations', 'products', 'projects',
            'promotions', 'social', 'tasks'
        ]

        // Seed ADMIN permissions (all true)
        for (const page of systemPages) {
            await prisma.rolePermission.upsert({
                where: { role_page: { role: 'ADMIN', page } },
                update: { isEnabled: true },
                create: { role: 'ADMIN', page, isEnabled: true }
            })
        }

        // Seed USER permissions (allow common pages, restrict admin page)
        for (const page of systemPages) {
            const isEnabled = page !== 'admin'
            await prisma.rolePermission.upsert({
                where: { role_page: { role: 'USER', page } },
                update: { isEnabled },
                create: { role: 'USER', page, isEnabled }
            })
        }

        // Seed EDITOR permissions (all true by default, customizable)
        for (const page of systemPages) {
            await prisma.rolePermission.upsert({
                where: { role_page: { role: 'EDITOR', page } },
                update: { isEnabled: true },
                create: { role: 'EDITOR', page, isEnabled: true }
            })
        }
        log('Permissions done.')

        // User
        log('Upserting User...')
        const passwordHash = await hashPassword('admin')
        await prisma.user.upsert({
            where: { email: 'admin@copromote.app' },
            update: {
                role: 'ADMIN'
            },
            create: {
                email: 'admin@copromote.app',
                username: 'admin',
                name: 'Admin User',
                password: passwordHash,
                role: 'ADMIN',
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
