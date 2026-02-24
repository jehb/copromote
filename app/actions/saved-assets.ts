'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function getSavedAssets() {
    try {
        const assets = await prisma.savedAsset.findMany({
            orderBy: [
                { category: 'asc' },
                { createdAt: 'desc' }
            ],
        });
        return assets;
    } catch (error) {
        console.error('Error fetching saved assets:', error);
        return [];
    }
}

export async function createSavedAsset(data: {
    name: string;
    category: string;
    elements: any;
    canvasSize: any;
    canvasBg: string;
    previewImage?: string;
}) {
    try {
        const asset = await prisma.savedAsset.create({
            data: {
                name: data.name,
                category: data.category,
                elements: data.elements as Prisma.InputJsonValue,
                canvasSize: data.canvasSize as Prisma.InputJsonValue,
                canvasBg: data.canvasBg,
                previewImage: data.previewImage,
            },
        });
        revalidatePath('/asset-editor');
        return { success: true, data: asset };
    } catch (error) {
        console.error('Error creating saved asset:', error);
        return { success: false, error: `Failed to create saved asset: ${String(error)}` };
    }
}

export async function updateSavedAsset(id: string, data: {
    name?: string;
    category?: string;
    elements?: any;
    canvasSize?: any;
    canvasBg?: string;
    previewImage?: string;
}) {
    try {
        const asset = await prisma.savedAsset.update({
            where: { id },
            data: {
                ...data,
                elements: data.elements !== undefined ? data.elements as Prisma.InputJsonValue : undefined,
                canvasSize: data.canvasSize !== undefined ? data.canvasSize as Prisma.InputJsonValue : undefined,
            },
        });
        revalidatePath('/asset-editor');
        return { success: true, data: asset };
    } catch (error) {
        console.error('Error updating saved asset:', error);
        return { success: false, error: 'Failed to update saved asset' };
    }
}

export async function deleteSavedAsset(id: string) {
    try {
        await prisma.savedAsset.delete({
            where: { id },
        });
        revalidatePath('/asset-editor');
        return { success: true };
    } catch (error) {
        console.error('Error deleting saved asset:', error);
        return { success: false, error: 'Failed to delete saved asset' };
    }
}
