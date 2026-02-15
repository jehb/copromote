'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/lib/session'

export type SearchResult = {
    id: string
    type: 'project' | 'task' | 'contact' | 'organization' | 'event' | 'post' | 'user' | 'hyperlink'
    title: string
    subtitle?: string
    url: string
}

export type SearchResults = {
    projects: SearchResult[]
    tasks: SearchResult[]
    contacts: SearchResult[]
    organizations: SearchResult[]
    events: SearchResult[]
    posts: SearchResult[]
    users: SearchResult[]
    hyperlinks: SearchResult[]
}

export async function search(query: string): Promise<SearchResults> {
    if (!query || query.length < 2) {
        return {
            projects: [],
            tasks: [],
            contacts: [],
            organizations: [],
            events: [],
            posts: [],
            users: [],
            hyperlinks: []
        }
    }

    const session = await verifySession()
    if (!session) {
        throw new Error('Unauthorized')
    }

    try {
        const [projects, tasks, contacts, organizations, events, posts, users, hyperlinks] = await Promise.all([
            // Projects
            prisma.project.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { description: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, description: true }
            }),
            // Tasks
            prisma.task.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { description: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, status: true }
            }),
            // Contacts
            prisma.contact.findMany({
                where: {
                    OR: [
                        { firstName: { contains: query } },
                        { lastName: { contains: query } },
                        { email: { contains: query } },
                        { company: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, firstName: true, lastName: true, company: true }
            }),
            // Organizations
            prisma.organization.findMany({
                where: {
                    name: { contains: query }
                },
                take: 5,
                select: { id: true, name: true, category: true }
            }),
            // Events
            prisma.event.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { description: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, startTime: true }
            }),
            // Social Posts
            prisma.socialPost.findMany({
                where: {
                    content: { contains: query }
                },
                take: 5,
                select: { id: true, content: true, platform: true }
            }),
            // Users (if admin or just searching colleagues)
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: query } },
                        { email: { contains: query } },
                        { username: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, name: true, email: true }
            }),
            // Hyperlinks
            prisma.hyperlink.findMany({
                where: {
                    OR: [
                        { title: { contains: query } },
                        { url: { contains: query } }
                    ]
                },
                take: 5,
                select: { id: true, title: true, url: true, description: true }
            })
        ])

        return {
            projects: projects.map(p => ({
                id: p.id,
                type: 'project',
                title: p.name,
                subtitle: p.description || '',
                url: `/projects/${p.id}`
            })),
            tasks: tasks.map(t => ({
                id: t.id,
                type: 'task',
                title: t.title,
                subtitle: t.status,
                url: `/tasks`
            })),
            contacts: contacts.map(c => ({
                id: c.id,
                type: 'contact',
                title: `${c.firstName} ${c.lastName}`,
                subtitle: c.company || '',
                url: `/contacts/${c.id}`
            })),
            organizations: organizations.map(o => ({
                id: o.id,
                type: 'organization',
                title: o.name,
                subtitle: o.category || '',
                url: `/organizations/${o.id}`
            })),
            events: events.map(e => ({
                id: e.id,
                type: 'event',
                title: e.title,
                subtitle: new Date(e.startTime).toLocaleDateString(),
                url: `/events`
            })),
            posts: posts.map(p => ({
                id: p.id,
                type: 'post',
                title: p.content.substring(0, 50) + (p.content.length > 50 ? '...' : ''),
                subtitle: p.platform,
                url: `/social?post=${p.id}`
            })),
            users: users.map(u => ({
                id: u.id,
                type: 'user',
                title: u.name,
                subtitle: u.email,
                url: `/admin/users`
            })),
            hyperlinks: hyperlinks.map(h => ({
                id: h.id,
                type: 'hyperlink',
                title: h.title,
                subtitle: h.description || '',
                url: h.url
            }))
        }
    } catch (error) {
        console.error('Search error:', error)
        throw new Error('Failed to search')
    }
}
