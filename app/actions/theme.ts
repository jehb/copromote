'use server'

import { getSession } from '@/lib/session'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const themeSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isRecurring: z.boolean().default(true),
})

export async function getThemes() {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    return prisma.theme.findMany({
        orderBy: { startDate: 'asc' }
    })
}

export async function getTheme(id: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    return prisma.theme.findUnique({
        where: { id }
    })
}

export async function createTheme(data: z.infer<typeof themeSchema>) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    const validated = themeSchema.parse(data)

    return prisma.theme.create({
        data: {
            ...validated,
            startDate: new Date(validated.startDate),
            endDate: new Date(validated.endDate),
        }
    })
}

export async function updateTheme(id: string, data: Partial<z.infer<typeof themeSchema>>) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    return prisma.theme.update({
        where: { id },
        data: {
            ...data,
            startDate: data.startDate ? new Date(data.startDate) : undefined,
            endDate: data.endDate ? new Date(data.endDate) : undefined,
        }
    })
}

export async function deleteTheme(id: string) {
    const session = await getSession()
    if (!session) throw new Error('Unauthorized')

    return prisma.theme.delete({
        where: { id }
    })
}
