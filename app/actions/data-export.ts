'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/prisma'
import { formatInTimeZone } from 'date-fns-tz'

const TIMEZONE = 'America/New_York'
const DATE_FORMAT = "yyyy-MM-dd'T'HH:mm:ssXXX"

function formatDate(date: Date | null | undefined) {
    if (!date) return ''
    return formatInTimeZone(date, TIMEZONE, DATE_FORMAT)
}

export async function getExportData(entities: string[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const data: Record<string, any[]> = {}
    const promises: Promise<void>[] = []

    if (entities.includes('contacts')) {
        promises.push(prisma.contact.findMany({
            include: { organization: true }
        }).then(contacts => {
            data.contacts = contacts.map(c => ({
            ID: c.id,
            'First Name': c.firstName,
            'Last Name': c.lastName,
            Email: c.email || '',
            Phone: c.phone || '',
            Company: c.company || '',
            'Job Title': c.jobTitle || '',
            Type: c.type,
            Notes: c.notes || '',
            Organization: c.organization?.name || '',
            'Created At': formatDate(c.createdAt)
        }))
        }))
    }

    if (entities.includes('organizations')) {
        promises.push(prisma.organization.findMany({
            include: { primaryContact: true }
        }).then(orgs => {
            data.organizations = orgs.map(o => ({
            ID: o.id,
            Name: o.name,
            Category: o.category,
            Description: o.description || '',
            Website: o.website || '',
            'Primary Contact': o.primaryContact ? `${o.primaryContact.firstName} ${o.primaryContact.lastName}` : '',
            'Created At': formatDate(o.createdAt)
        }))
        }))
    }

    if (entities.includes('events')) {
        promises.push(prisma.event.findMany({
            include: { location: true, primaryContact: true }
        }).then(events => {
            data.events = events.map(e => ({
            ID: e.id,
            Title: e.title,
            Description: e.description || '',
            'Start Time': formatDate(e.startTime),
            'End Time': formatDate(e.endTime),
            Location: e.location.name,
            'Primary Contact': e.primaryContact ? e.primaryContact.name : '',
            'Created At': formatDate(e.createdAt)
        }))
        }))
    }

    if (entities.includes('tasks')) {
        promises.push(prisma.task.findMany({
            include: { assignee: true, project: true }
        }).then(tasks => {
            data.tasks = tasks.map(t => ({
            ID: t.id,
            Title: t.title,
            Description: t.description || '',
            Status: t.status,
            'Due Date': formatDate(t.dueDate),
            Assignee: t.assignee?.name || '',
            Project: t.project?.name || '',
            'Created At': formatDate(t.createdAt)
        }))
        }))
    }

    if (entities.includes('projects')) {
        promises.push(prisma.project.findMany().then(projects => {
            data.projects = projects.map(p => ({
            ID: p.id,
            Name: p.name,
            Description: p.description || '',
            Status: p.status,
            'Start Date': formatDate(p.startDate),
            'End Date': formatDate(p.endDate),
            'Created At': formatDate(p.createdAt)
        }))
        }))
    }

    if (entities.includes('hyperlinks')) {
        promises.push(prisma.hyperlink.findMany().then(hyperlinks => {
            data.hyperlinks = hyperlinks.map(h => ({
            ID: h.id,
            Title: h.title,
            URL: h.url,
            Description: h.description || '',
            Icon: h.icon || '',
            'Created At': formatDate(h.createdAt)
        }))
        }))
    }

    if (entities.includes('social-posts')) {
        promises.push(prisma.socialPost.findMany().then(socialPosts => {
            data['social-posts'] = socialPosts.map(p => ({
            ID: p.id,
            Content: p.content,
            Platform: p.platform,
            Status: p.status,
            'Scheduled Date': formatDate(p.scheduledDate),
            'Created At': formatDate(p.createdAt)
        }))
        }))
    }

    if (entities.includes('promotions')) {
        promises.push(prisma.promotionPeriod.findMany().then(promotions => {
            data.promotions = promotions.map(p => ({
            ID: p.id,
            Name: p.name,
            'Start Date': formatDate(p.startDate),
            'End Date': formatDate(p.endDate),
            'Ad Live Date': formatDate(p.adLiveDate),
            'Ad Image Deadline': formatDate(p.adImageDeadline),
            'Ad Publishing Deadline': formatDate(p.adPublishingDeadline),
            'Created At': formatDate(p.createdAt)
        }))
        }))
    }

    if (entities.includes('email-plans')) {
        promises.push(prisma.emailPlan.findMany().then(plans => {
            data['email-plans'] = plans.map(p => ({
            ID: p.id,
            Subject: p.subject,
            'Send Date': formatDate(p.sendDate),
            Notes: p.notes || '',
            'Created At': formatDate(p.createdAt)
        }))
        }))
    }

    if (entities.includes('email-items')) {
        promises.push(prisma.emailItem.findMany({
            include: { plan: true }
        }).then(items => {
            data['email-items'] = items.map(i => ({
            ID: i.id,
            Title: i.title,
            Description: i.description || '',
            'Plan Subject': i.plan.subject,
            Order: i.order,
            'Created At': formatDate(i.createdAt)
        }))
        }))
    }

    if (entities.includes('users')) {
        promises.push(prisma.user.findMany().then(users => {
            data.users = users.map(u => ({
            ID: u.id,
            Name: u.name,
            Email: u.email,
            Username: u.username,
            Role: u.role,
            'Must Change Password': u.mustChangePassword ? 'Yes' : 'No',
            'Created At': formatDate(u.createdAt)
        }))
        }))
    }

    if (entities.includes('color-palettes')) {
        promises.push(prisma.colorPalette.findMany().then(palettes => {
            data['color-palettes'] = palettes.map(p => {
            let parsedColors = p.colors;
            if (typeof p.colors === 'string') {
                try {
                    parsedColors = JSON.parse(p.colors)
                } catch (e) {
                    // Fallback if parsing fails
                }
            }
            const colorsString = Array.isArray(parsedColors) ? parsedColors.join(', ') : String(parsedColors);

            return {
                ID: p.id,
                Name: p.name,
                Colors: colorsString,
                'Created At': formatDate(p.createdAt)
            }
        })
        }))
    }

    await Promise.all(promises)

    return data
}
