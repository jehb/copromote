'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createAsset(formData: FormData) {
    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const url = formData.get('url') as string
    const projectId = formData.get('projectId') as string

    await prisma.asset.create({
        data: {
            name,
            type,
            url,
            projectId
        }
    })

    revalidatePath(`/projects/${projectId}`)
}

export async function deleteAsset(id: string, projectId: string) {
    await prisma.asset.delete({ where: { id } })
    revalidatePath(`/projects/${projectId}`)
}
