'use server'

import { revalidatePath } from 'next/cache'
import { getImmichAssets, getImmichTags, uploadImmichAsset, deleteImmichAsset, createImmichTag, addTagToImmichAsset, updateImmichAsset, removeTagFromImmichAsset, getImmichAlbums, createImmichAlbum, deleteImmichAlbum, addAssetToImmichAlbum, removeAssetFromImmichAlbum } from './immich'

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
            updatedAt: a.updatedAt,
            description: a.exifInfo?.description || null,
            tags: assetTags
        }
    })
}

export async function getPhoto(id: string) {
    const photos = await getPhotos()
    return photos.find(p => p.id === id) || null
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
    const newTag = await createImmichTag(name)
    revalidatePath('/gallery')
    return {
        id: newTag.id,
        name: newTag.name,
        color: newTag.color
    }
}

export async function assignProductTagToPhoto(photoId: string, upc: string) {
    const tagName = `upc/${upc}`
    const allTags = await getPhotoTags()

    let tagId = allTags.find(t => t.name === tagName)?.id

    // Create the tag in Immich if it doesn't already exist
    if (!tagId) {
        const newTag = await createImmichTag(tagName)
        if (newTag) {
            tagId = newTag.id
        } else {
            throw new Error('Failed to auto-create missing UPC tag.')
        }
    }

    // Assign tag to the photo
    await addTagToImmichAsset(photoId, tagId)

    // Flush the built caches
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function updatePhotoDescription(id: string, description: string) {
    await updateImmichAsset(id, description)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${id}`)
}

export async function addPhotoTag(photoId: string, tagId: string) {
    await addTagToImmichAsset(photoId, tagId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function removePhotoTag(photoId: string, tagId: string) {
    await removeTagFromImmichAsset(photoId, tagId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function getAlbums() {
    const albums = await getImmichAlbums()
    return albums.map((a: any) => ({
        id: a.id,
        name: a.albumName,
        assetCount: a.assetCount || 0
    }))
}

export async function createAlbum(name: string) {
    const newAlbum = await createImmichAlbum(name)
    revalidatePath('/gallery')
    return {
        id: newAlbum.id,
        name: newAlbum.albumName
    }
}

export async function deleteAlbum(albumId: string) {
    await deleteImmichAlbum(albumId)
    revalidatePath('/gallery')
}

export async function addPhotoToAlbum(photoId: string, albumId: string) {
    await addAssetToImmichAlbum(albumId, photoId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function removePhotoFromAlbum(photoId: string, albumId: string) {
    await removeAssetFromImmichAlbum(albumId, photoId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}
