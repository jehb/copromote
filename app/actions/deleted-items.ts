'use server'

import { prisma } from '@/lib/db'
import { getSession } from '@/lib/session'
import { logActivity } from '@/app/actions/activity-logs'
import { getCurrentUser, getCurrentUserId } from '@/lib/user-util'
import { revalidatePath } from 'next/cache'

export interface DeletedItem {
    id: string
    title: string
    deletedAt: Date
    deletedByName: string
}

export interface DeletedItemsResponse {
    projects: DeletedItem[]
    tasks: DeletedItem[]
    events: DeletedItem[]
    contacts: DeletedItem[]
    organizations: DeletedItem[]
    socialPosts: DeletedItem[]
}

export async function getDeletedItems(): Promise<DeletedItemsResponse> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') throw new Error("Only admins can access deleted items");

    const [projects, tasks, events, contacts, organizations, socialPosts] = await Promise.all([
        prisma.project.findMany({
            where: { deletedAt: { not: null } },
            include: { updatedBy: { select: { name: true } } },
            orderBy: { deletedAt: 'desc' }
        }),
        prisma.task.findMany({
            where: { deletedAt: { not: null } },
            include: { updatedBy: { select: { name: true } } },
            orderBy: { deletedAt: 'desc' }
        }),
        prisma.event.findMany({
            where: { deletedAt: { not: null } },
            include: { updatedBy: { select: { name: true } } },
            orderBy: { deletedAt: 'desc' }
        }),
        prisma.contact.findMany({
            where: { deletedAt: { not: null } },
            include: { updatedBy: { select: { name: true } } },
            orderBy: { deletedAt: 'desc' }
        }),
        prisma.organization.findMany({
            where: { deletedAt: { not: null } },
            include: { updatedBy: { select: { name: true } } },
            orderBy: { deletedAt: 'desc' }
        }),
        prisma.socialPost.findMany({
            where: { deletedAt: { not: null } },
            orderBy: { deletedAt: 'desc' }
        })
    ]);

    return {
        projects: projects.map(p => ({
            id: p.id,
            title: p.name,
            deletedAt: p.deletedAt!,
            deletedByName: p.updatedBy?.name || 'Admin'
        })),
        tasks: tasks.map(t => ({
            id: t.id,
            title: t.title,
            deletedAt: t.deletedAt!,
            deletedByName: t.updatedBy?.name || 'Admin'
        })),
        events: events.map(e => ({
            id: e.id,
            title: e.title,
            deletedAt: e.deletedAt!,
            deletedByName: e.updatedBy?.name || 'Admin'
        })),
        contacts: contacts.map(c => ({
            id: c.id,
            title: `${c.firstName} ${c.lastName}`,
            deletedAt: c.deletedAt!,
            deletedByName: c.updatedBy?.name || 'Admin'
        })),
        organizations: organizations.map(o => ({
            id: o.id,
            title: o.name,
            deletedAt: o.deletedAt!,
            deletedByName: o.updatedBy?.name || 'Admin'
        })),
        socialPosts: socialPosts.map(p => ({
            id: p.id,
            title: p.content.length > 50 ? p.content.substring(0, 50) + '...' : p.content,
            deletedAt: p.deletedAt!,
            deletedByName: 'Admin'
        }))
    };
}

export async function restoreItem(
    type: 'project' | 'task' | 'event' | 'contact' | 'organization' | 'socialPost',
    id: string
) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') throw new Error("Only admins can restore items");

    const userId = user.id;

    switch (type) {
        case 'project':
            await prisma.project.update({
                where: { id },
                data: { deletedAt: null, updatedById: userId }
            });
            break;
        case 'task':
            await prisma.task.update({
                where: { id },
                data: { deletedAt: null, updatedById: userId }
            });
            break;
        case 'event':
            await prisma.event.update({
                where: { id },
                data: { deletedAt: null, updatedById: userId }
            });
            break;
        case 'contact':
            await prisma.contact.update({
                where: { id },
                data: { deletedAt: null, updatedById: userId }
            });
            break;
        case 'organization':
            await prisma.organization.update({
                where: { id },
                data: { deletedAt: null, updatedById: userId }
            });
            break;
        case 'socialPost':
            await prisma.socialPost.update({
                where: { id },
                data: { deletedAt: null }
            });
            break;
    }

    await logActivity('RESTORE', type.toUpperCase(), id, `Restored ${type}: ${id}`);

    // Revalidate paths for real-time visual updates
    revalidatePath('/projects');
    revalidatePath('/tasks');
    revalidatePath('/events');
    revalidatePath('/calendar');
    revalidatePath('/contacts');
    revalidatePath('/organizations');
    revalidatePath('/social');
    revalidatePath('/admin/deleted-items');

    return { success: true };
}

export async function deleteItemForever(
    type: 'project' | 'task' | 'event' | 'contact' | 'organization' | 'socialPost',
    id: string
) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser();
    if (user?.role !== 'ADMIN') throw new Error("Only admins can permanently delete items");

    switch (type) {
        case 'project':
            await prisma.project.delete({ where: { id } });
            break;
        case 'task':
            await prisma.task.delete({ where: { id } });
            break;
        case 'event':
            await prisma.event.delete({ where: { id } });
            break;
        case 'contact':
            await prisma.contact.delete({ where: { id } });
            break;
        case 'organization':
            await prisma.organization.delete({ where: { id } });
            break;
        case 'socialPost':
            await prisma.socialPost.delete({ where: { id } });
            break;
    }

    await logActivity('HARD_DELETE', type.toUpperCase(), id, `Permanently deleted ${type}: ${id}`);

    // Revalidate paths
    revalidatePath('/projects');
    revalidatePath('/tasks');
    revalidatePath('/events');
    revalidatePath('/calendar');
    revalidatePath('/contacts');
    revalidatePath('/organizations');
    revalidatePath('/social');
    revalidatePath('/admin/deleted-items');

    return { success: true };
}
