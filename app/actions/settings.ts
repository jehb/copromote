'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getConfig(key: string) {
    const config = await prisma.config.findUnique({
        where: { key }
    })
    return config?.value?.trim() || null
}

export async function updateConfig(key: string, value: string) {
    await prisma.config.upsert({
        where: { key },
        update: { value },
        create: { key, value }
    })
    revalidatePath('/settings')
}
