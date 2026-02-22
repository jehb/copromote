'use server'

import * as immich from '@immich/sdk'
import { randomUUID } from 'crypto'

let isInitialized = false

export async function initImmich() {
    if (isInitialized) return true

    const url = process.env.IMMICH_URL
    const apiKey = process.env.IMMICH_API_KEY

    if (!url || !apiKey) {
        return false
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
    try {
        const url = process.env.IMMICH_URL
        const apiKey = process.env.IMMICH_API_KEY
        if (!url || !apiKey) return { success: false, message: 'Configuration missing' }

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
    const ready = await initImmich()
    if (!ready) return []
    try {
        return await immich.getAllTags({})
    } catch (e) {
        return []
    }
}

export async function getImmichAssets(tagId?: string) {
    const ready = await initImmich()
    if (!ready) return []

    try {
        const res = await immich.searchAssets({
            metadataSearchDto: {
                createdBefore: new Date().toISOString(),
                tagIds: tagId && tagId !== 'all' ? [tagId] : undefined
            }
        })
        return res.assets.items
    } catch (e: any) {
        console.error('Failed to get Immich assets:', e)
        return []
    }
}

export async function deleteImmichAsset(id: string) {
    await initImmich()
    return await immich.deleteAssets({ assetBulkDeleteDto: { ids: [id] } })
}

export async function createImmichTag(name: string) {
    await initImmich()
    return await immich.createTag({ tagCreateDto: { name } })
}

export async function uploadImmichAsset(file: File, tagIds?: string[]) {
    await initImmich()

    const url = process.env.IMMICH_URL
    const apiKey = process.env.IMMICH_API_KEY

    if (!url || !apiKey) {
        throw new Error('Immich credentials not configured')
    }

    const deviceId = 'promoty-server'
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

    return res
}
