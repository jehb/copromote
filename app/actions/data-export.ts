'use server'

import { prisma } from '@/lib/prisma'

export async function getExportData(entities: string[]) {
    const data: Record<string, any[]> = {}

    if (entities.includes('contacts')) {
        const contacts = await prisma.contact.findMany({
            include: { organization: true }
        })
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
            'Created At': c.createdAt.toISOString()
        }))
    }

    if (entities.includes('organizations')) {
        const orgs = await prisma.organization.findMany({
            include: { primaryContact: true }
        })
        data.organizations = orgs.map(o => ({
            ID: o.id,
            Name: o.name,
            Category: o.category,
            Description: o.description || '',
            Website: o.website || '',
            'Primary Contact': o.primaryContact ? `${o.primaryContact.firstName} ${o.primaryContact.lastName}` : '',
            'Created At': o.createdAt.toISOString()
        }))
    }

    if (entities.includes('events')) {
        const events = await prisma.event.findMany({
            include: { location: true, primaryContact: true }
        })
        data.events = events.map(e => ({
            ID: e.id,
            Title: e.title,
            Description: e.description || '',
            'Start Time': e.startTime.toISOString(),
            'End Time': e.endTime.toISOString(),
            Location: e.location.name,
            'Primary Contact': e.primaryContact ? e.primaryContact.name : '',
            'Created At': e.createdAt.toISOString()
        }))
    }

    if (entities.includes('tasks')) {
        const tasks = await prisma.task.findMany({
            include: { assignee: true, project: true }
        })
        data.tasks = tasks.map(t => ({
            ID: t.id,
            Title: t.title,
            Description: t.description || '',
            Status: t.status,
            'Due Date': t.dueDate ? t.dueDate.toISOString() : '',
            Assignee: t.assignee?.name || '',
            Project: t.project?.name || '',
            'Created At': t.createdAt.toISOString()
        }))
    }

    if (entities.includes('projects')) {
        const projects = await prisma.project.findMany()
        data.projects = projects.map(p => ({
            ID: p.id,
            Name: p.name,
            Description: p.description || '',
            Status: p.status,
            'Start Date': p.startDate.toISOString(),
            'End Date': p.endDate ? p.endDate.toISOString() : '',
            'Created At': p.createdAt.toISOString()
        }))
    }

    if (entities.includes('hyperlinks')) {
        const hyperlinks = await prisma.hyperlink.findMany()
        data.hyperlinks = hyperlinks.map(h => ({
            ID: h.id,
            Title: h.title,
            URL: h.url,
            Description: h.description || '',
            Icon: h.icon || '',
            'Created At': h.createdAt.toISOString()
        }))
    }

    if (entities.includes('social-posts')) {
        const socialPosts = await prisma.socialPost.findMany()
        data['social-posts'] = socialPosts.map(p => ({
            ID: p.id,
            Content: p.content,
            Platform: p.platform,
            Status: p.status,
            'Scheduled Date': p.scheduledDate ? p.scheduledDate.toISOString() : '',
            'Created At': p.createdAt.toISOString()
        }))
    }

    return data
}
