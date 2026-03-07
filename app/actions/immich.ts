'use server'
import { getSession } from '@/lib/session'

import * as immich from '@immich/sdk'
import { randomUUID } from 'crypto'

let isInitialized = false

export async function initImmich() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (isInitialized) return true

    let url = process.env.IMMICH_URL
    const apiKey = process.env.IMMICH_API_KEY

    if (!url || !apiKey) {
        return false
    }

    if (!url.endsWith('/api') && !url.endsWith('/api/')) {
        url = url.replace(/\/$/, '') + '/api';
    }

    try {
        immich.init({
            baseUrl: url,
            apiKey: apiKey,
        })
        isInitialized = true
        return true
    } catch (e) {
        return false
    }
}

export async function testImmichConnection() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        let url = process.env.IMMICH_URL
        const apiKey = process.env.IMMICH_API_KEY
        if (!url || !apiKey) return { success: false, message: 'Configuration missing' }

        if (!url.endsWith('/api') && !url.endsWith('/api/')) {
            url = url.replace(/\/$/, '') + '/api';
        }

        immich.init({
            baseUrl: url,
            apiKey: apiKey,
        })

        // basic ping/test
        const info = await immich.getAboutInfo()
        return { success: true, message: `Connected to Immich version ${info.version}` }
    } catch (err: any) {
        console.error('Immich connection test failed:', err)
        return { success: false, message: err.message || 'Failed to connect to Immich' }
    }
}

export async function getImmichTags() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const ready = await initImmich()
    if (!ready) return []
    try {
        const response = await immich.getAllTags({})
        return Array.isArray(response) ? response : []
    } catch (e) {
        return []
    }
}

export async function getImmichAssets(tagId?: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const ready = await initImmich()
    if (!ready) return []

    try {
        const res = await immich.searchAssets({
            metadataSearchDto: {
                createdBefore: new Date().toISOString(),
                tagIds: tagId && tagId !== 'all' ? [tagId] : undefined,
                withExif: true
            }
        })
        return res?.assets?.items ?? []
    } catch (e: any) {
        console.error('Failed to get Immich assets:', e)
        return []
    }
}

export async function deleteImmichAsset(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    return await immich.deleteAssets({ assetBulkDeleteDto: { ids: [id] } })
}

export async function createImmichTag(name: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    return await immich.createTag({ tagCreateDto: { name } })
}

export async function uploadImmichAsset(file: File, tagIds?: string[]) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()

    const url = process.env.IMMICH_URL
    const apiKey = process.env.IMMICH_API_KEY

    if (!url || !apiKey) {
        throw new Error('Immich credentials not configured')
    }

    const deviceId = 'copromote-server'
    const deviceAssetId = randomUUID()

    // Correctly reconstruct the File back into a Node Blob since Next server actions 
    // receive a web File that the SDK doesn't always successfully process
    let res;
    try {
        res = await immich.uploadAsset({
            assetMediaCreateDto: {
                assetData: file,
                deviceAssetId,
                deviceId,
                fileCreatedAt: new Date().toISOString(),
                fileModifiedAt: new Date().toISOString()
            }
        })
    } catch (e: any) {
        console.error('Immich upload rejected:', e.data || e.response?.data || e)
        throw new Error(`Failed to upload to Immich: 400 Bad Request`)
    }

    if (tagIds && tagIds.length > 0) {
        // Give Immich's async processing a moment to index the new asset before we tag it
        await new Promise(resolve => setTimeout(resolve, 1000))
        try {
            await immich.bulkTagAssets({
                tagBulkAssetsDto: { tagIds, assetIds: [res.id] }
            })
        } catch (tagErr: any) {
            console.error('Failed to attach tags to asset:', tagErr.data || tagErr.response?.data || tagErr)
        }
    }

    return res
}

export async function addTagToImmichAsset(assetId: string, tagId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        await immich.bulkTagAssets({
            tagBulkAssetsDto: { tagIds: [tagId], assetIds: [assetId] }
        })
    } catch (e: any) {
        console.error('Failed to add tag to Immich asset:', e?.response?.data || e.message)
        throw new Error('Failed to tag photo.')
    }
}

export async function updateImmichAsset(id: string, description: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        await immich.updateAsset({
            id,
            updateAssetDto: { description }
        })
    } catch (e: any) {
        console.error('Failed to update Immich asset:', e?.response?.data || e.message)
        throw new Error('Failed to update photo description.')
    }
}

export async function removeTagFromImmichAsset(assetId: string, tagId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        await immich.untagAssets({
            id: tagId,
            bulkIdsDto: { ids: [assetId] }
        })
    } catch (e: any) {
        console.error('Failed to remove tag from Immich asset:', e?.response?.data || e.message)
        throw new Error('Failed to remove tag from photo.')
    }
}

export async function getImmichAlbums() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const ready = await initImmich()
    if (!ready) return []
    try {
        const response = await immich.getAllAlbums({})
        return Array.isArray(response) ? response : []
    } catch (e) {
        console.error('Failed to get Immich albums:', e)
        return []
    }
}

export async function createImmichAlbum(albumName: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        return await immich.createAlbum({ createAlbumDto: { albumName } })
    } catch (e) {
        console.error('Failed to create Immich album:', e)
        throw new Error('Failed to create album.')
    }
}

export async function deleteImmichAlbum(id: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        return await immich.deleteAlbum({ id })
    } catch (e) {
        console.error('Failed to delete Immich album:', e)
        throw new Error('Failed to delete album.')
    }
}

export async function addAssetToImmichAlbum(albumId: string, assetId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        return await immich.addAssetsToAlbum({
            id: albumId,
            bulkIdsDto: { ids: [assetId] }
        })
    } catch (e) {
        console.error('Failed to add asset to Immich album:', e)
        throw new Error('Failed to add photo to album.')
    }
}

export async function removeAssetFromImmichAlbum(albumId: string, assetId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    await initImmich()
    try {
        return await immich.removeAssetFromAlbum({
            id: albumId,
            bulkIdsDto: { ids: [assetId] }
        })
    } catch (e) {
        console.error('Failed to remove asset from Immich album:', e)
        throw new Error('Failed to remove photo from album.')
    }
}
