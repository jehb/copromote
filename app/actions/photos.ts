'use server'

import { revalidatePath } from 'next/cache'
import { getImmichAssets, getImmichTags, uploadImmichAsset, deleteImmichAsset, createImmichTag } from './immich'

export async function getPhotos(tagId?: string) {
    const assets = await getImmichAssets(tagId)
    const allTags = await getPhotoTags()

    // For each tag, map which assets have it
    const tagStore = new Map<string, string[]>()
    await Promise.all(allTags.map(async (tag) => {
        const tAssets = await getImmichAssets(tag.id)
        tagStore.set(tag.id, tAssets.map(a => a.id))
    }))

    // Map to the shape expected by the frontend
    return assets.map(a => {
        const assetTags = allTags.filter(t => tagStore.get(t.id)?.includes(a.id))
        return {
            id: a.id,
            url: `/api/immich/asset/${a.id}`,
            name: a.originalFileName,
            createdAt: a.fileCreatedAt,
            tags: assetTags
        }
    })
}

export async function getPhotoTags() {
    const tags = await getImmichTags()
    return tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color
    }))
}

export async function uploadPhoto(formData: FormData) {
    const file = formData.get('file') as File
    const tagIdsString = formData.get('tagIds') as string
    const tagIds = tagIdsString ? tagIdsString.split(',').filter(Boolean) : []

    if (!file || file.size === 0) {
        throw new Error('No file uploaded.')
    }

    await uploadImmichAsset(file, tagIds)
    revalidatePath('/gallery')
}

export async function deletePhoto(id: string) {
    await deleteImmichAsset(id)
    revalidatePath('/gallery')
}

export async function createPhotoTag(name: string) {
    await createImmichTag(name)
    revalidatePath('/gallery')
}

