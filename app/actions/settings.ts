'use server'
import { getSession } from '@/lib/session'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getConfig(key: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const config = await prisma.config.findUnique({
        where: { key }
    })
    return config?.value?.trim() || null
}

export async function updateConfig(key: string, value: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    })
    revalidatePath('/admin/settings')
}
