import { getSession } from '@/lib/session'

export async function getCurrentUserId(): Promise<string | undefined> {
    const session = await getSession()
    return session?.id
}

export async function getCurrentUser() {
    const session = await getSession()
    if (!session?.id) return null

    const { prisma } = await import('@/lib/db')
    return await prisma.user.findUnique({
        where: { id: session.id }
    })
}
