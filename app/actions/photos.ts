'use server'
import { getSession } from '@/lib/session'

import { revalidatePath } from 'next/cache'
import { getImmichAssets, getImmichTags, uploadImmichAsset, deleteImmichAsset, createImmichTag, addTagToImmichAsset, updateImmichAsset, removeTagFromImmichAsset, getImmichAlbums, createImmichAlbum, deleteImmichAlbum, addAssetToImmichAlbum, removeAssetFromImmichAlbum } from './immich'

export async function getPhotos(tagId?: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const assets = await getImmichAssets(tagId)
    const allTags = await getPhotoTags()

    // Optimization: Immich assets already include their assigned tags.
    // Map to the shape expected by the frontend by filtering allTags against a.tags
    return assets.map(a => {
        // Find which known tags are present on this asset's built-in tags array
        const assetTags = allTags.filter(t => a.tags?.some(assetTag => assetTag.id === t.id))

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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const photos = await getPhotos()
    return photos.find(p => p.id === id) || null
}

export async function getPhotoTags() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const tags = await getImmichTags()
    return tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color
    }))
}

export async function uploadPhoto(formData: FormData) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await deleteImmichAsset(id)
    revalidatePath('/gallery')
}

export async function createPhotoTag(name: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const newTag = await createImmichTag(name)
    revalidatePath('/gallery')
    return {
        id: newTag.id,
        name: newTag.name,
        color: newTag.color
    }
}

export async function assignProductTagToPhoto(photoId: string, upc: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
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
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await updateImmichAsset(id, description)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${id}`)
}

export async function addPhotoTag(photoId: string, tagId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await addTagToImmichAsset(photoId, tagId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function removePhotoTag(photoId: string, tagId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await removeTagFromImmichAsset(photoId, tagId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function getAlbums() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const albums = await getImmichAlbums()
    return albums.map((a: any) => ({
        id: a.id,
        name: a.albumName,
        assetCount: a.assetCount || 0
    }))
}

export async function createAlbum(name: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const newAlbum = await createImmichAlbum(name)
    revalidatePath('/gallery')
    return {
        id: newAlbum.id,
        name: newAlbum.albumName
    }
}

export async function deleteAlbum(albumId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await deleteImmichAlbum(albumId)
    revalidatePath('/gallery')
}

export async function addPhotoToAlbum(photoId: string, albumId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await addAssetToImmichAlbum(albumId, photoId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}

export async function removePhotoFromAlbum(photoId: string, albumId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await removeAssetFromImmichAlbum(albumId, photoId)
    revalidatePath('/gallery')
    revalidatePath(`/gallery/${photoId}`)
}
