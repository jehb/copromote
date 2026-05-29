'use server'
import { getSession } from '@/lib/session';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getAssetTemplates() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const templates = await prisma.assetTemplate.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        return templates;
    } catch (error) {
        console.error('Error fetching asset templates:', error);
        return [];
    }
}

export async function createAssetTemplate(data: {
    name: string;
    elements: any;
    canvasSize: any;
    canvasBg: string;
    previewImage?: string;
}) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const template = await prisma.assetTemplate.create({
            data: {
                name: data.name,
                elements: data.elements as Prisma.InputJsonValue,
                canvasSize: data.canvasSize as Prisma.InputJsonValue,
                canvasBg: data.canvasBg,
                previewImage: data.previewImage,
            },
        });
        revalidatePath('/asset-editor');
        return { success: true, data: template };
    } catch (error) {
        console.error('Error creating asset template:', error);
        return { success: false, error: 'Failed to create asset template' };
    }
}

export async function updateAssetTemplate(id: string, data: {
    name?: string;
    elements?: any;
    canvasSize?: any;
    canvasBg?: string;
    previewImage?: string;
}) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const template = await prisma.assetTemplate.update({
            where: { id },
            data: {
                ...data,
                elements: data.elements !== undefined ? data.elements as Prisma.InputJsonValue : undefined,
                canvasSize: data.canvasSize !== undefined ? data.canvasSize as Prisma.InputJsonValue : undefined,
            },
        });
        revalidatePath('/asset-editor');
        return { success: true, data: template };
    } catch (error) {
        console.error('Error updating asset template:', error);
        return { success: false, error: 'Failed to update asset template' };
    }
}

export async function deleteAssetTemplate(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        await prisma.assetTemplate.delete({
            where: { id },
        });
        revalidatePath('/asset-editor');
        return { success: true };
    } catch (error) {
        console.error('Error deleting asset template:', error);
        return { success: false, error: 'Failed to delete asset template' };
    }
}
