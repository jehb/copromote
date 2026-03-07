'use server'
import { getSession } from '@/lib/session';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function getColorPalettes() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const palettes = await prisma.colorPalette.findMany({
            orderBy: { name: 'asc' }
        });
        return { success: true, data: palettes };
    } catch (error: any) {
        console.error('Error fetching color palettes:', error);
        return { success: false, error: 'Failed to fetch color palettes' };
    }
}

export async function createColorPalette(data: { name: string; colors: string[] }) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const existing = await prisma.colorPalette.findUnique({
            where: { name: data.name }
        });

        if (existing) {
            return { success: false, error: 'A palette with this name already exists' };
        }

        const newPalette = await prisma.colorPalette.create({
            data: {
                name: data.name,
                colors: JSON.stringify(data.colors)
            }
        });

        revalidatePath('/admin/color-palettes');
        return { success: true, data: newPalette };
    } catch (error: any) {
        console.error('Error creating color palette:', error);
        return { success: false, error: 'Failed to create color palette' };
    }
}

export async function updateColorPalette(id: string, data: { name: string; colors: string[] }) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const existing = await prisma.colorPalette.findFirst({
            where: {
                name: data.name,
                id: { not: id }
            }
        });

        if (existing) {
            return { success: false, error: 'A palette with this name already exists' };
        }

        const updated = await prisma.colorPalette.update({
            where: { id },
            data: {
                name: data.name,
                colors: JSON.stringify(data.colors)
            }
        });

        revalidatePath('/admin/color-palettes');
        return { success: true, data: updated };
    } catch (error: any) {
        console.error('Error updating color palette:', error);
        return { success: false, error: 'Failed to update color palette' };
    }
}

export async function deleteColorPalette(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        await prisma.colorPalette.delete({
            where: { id }
        });

        revalidatePath('/admin/color-palettes');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting color palette:', error);
        return { success: false, error: 'Failed to delete color palette' };
    }
}
