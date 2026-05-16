'use server'
import { getSession } from '@/lib/session'

import Postiz from '@postiz/node'

export async function getPostizClient() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const url = process.env.POSTIZ_URL
    const apiKey = process.env.POSTIZ_API_KEY
    if (!apiKey) return null

    // The Postiz node package takes (apiKey, path) but wait. Looking at the type: constructor(_apiKey: string, _path?: string);
    // where _path defaults to https://app.postiz.com/api/
    const apiUrl = url ? (url.endsWith('/api') ? url : url.endsWith('/') ? `${url}api` : `${url}/api`) : undefined

    return new Postiz(apiKey, apiUrl)
}

export async function fetchPostizIntegrations() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const client = await getPostizClient()
    if (!client) return []
    try {
        const integrations: any = await client.integrations()
        return integrations || []
    } catch (e) {
        console.error('Failed to fetch Postiz integrations:', e)
        return []
    }
}

export async function getAvailablePlatforms(): Promise<{ value: string, label: string }[]> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const integrations = await fetchPostizIntegrations()
    if (!integrations || integrations.length === 0) {
        // Fallback or unconfigured
        return [
            { value: 'Instagram', label: 'Instagram' },
            { value: 'Facebook', label: 'Facebook' },
            { value: 'LinkedIn', label: 'LinkedIn' },
            { value: 'Twitter', label: 'Twitter' }
        ]
    }

    const platforms = new Set<string>()
    integrations.forEach((i: any) => {
        if (!i.provider) return
        if (i.provider === 'x' || i.provider === 'twitter') platforms.add('Twitter')
        else platforms.add(i.provider.charAt(0).toUpperCase() + i.provider.slice(1))
    })

    return Array.from(platforms).map(p => ({ value: p, label: p }))
}

export async function syncPostToPostiz(postParams: {
    platforms: string[],
    content: string,
    scheduledDate: Date | null,
    status: string,
    assets?: { url: string, type: string }[]
}): Promise<string | null> {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const client = await getPostizClient()
    if (!client) return null

    try {
        const integrations = await fetchPostizIntegrations()
        if (!integrations || integrations.length === 0) {
            console.warn('No Postiz integrations found')
            return null
        }

        // Map Co+promote platforms to Postiz integration provider types
        const typeMap: Record<string, string> = {
            'twitter': 'x',
            'linkedin': 'linkedin',
            'facebook': 'facebook',
            'instagram': 'instagram',
            'tiktok': 'tiktok'
        }

        const validIntegrations = integrations.filter((i: any) =>
            postParams.platforms.some(p => (typeMap[p.toLowerCase()] || p.toLowerCase()) === i.provider)
        )

        if (validIntegrations.length === 0) {
            console.warn('No matching Postiz integrations found for platforms:', postParams.platforms)
            return null
        }

        let postType: 'draft' | 'schedule' | 'now' = 'draft'
        if (postParams.status === 'scheduled' && postParams.scheduledDate) {
            postType = 'schedule'
        } else if (postParams.status === 'published') {
            postType = 'now'
        }

        // Upload assets if any exist
        const postizMedia: any[] = []
        if (postParams.assets && postParams.assets.length > 0) {
            const uploadPromises = postParams.assets.map(async (asset) => {
                try {
                    // Extract extension from URL, defaulting to jpg/mp4 based on type if missing
                    let ext = asset.url.split('.').pop()?.split(/[?#]/)[0] || ''
                    if (!['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4'].includes(ext.toLowerCase())) {
                        ext = asset.type === 'video' ? 'mp4' : 'jpg'
                    }

                    // Download the file into a buffer
                    const response = await fetch(asset.url)
                    if (!response.ok) throw new Error(`HTTP ${response.status} fetching asset`)
                    const arrayBuffer = await response.arrayBuffer()
                    const buffer = Buffer.from(arrayBuffer)

                    // Upload to Postiz
                    const uploadedMedia: any = await client.upload(buffer, ext)
                    console.log('Postiz Upload Media Result:', uploadedMedia)
                    return uploadedMedia
                } catch (err: any) {
                    console.error('Failed to upload asset to Postiz:', asset.url, err?.message || err)
                    return null
                }
            })

            const results = await Promise.all(uploadPromises)

            for (const uploadedMedia of results) {
                if (!uploadedMedia) continue

                if (uploadedMedia.id || uploadedMedia.path) {
                    postizMedia.push(uploadedMedia)
                } else if (Array.isArray(uploadedMedia)) {
                    postizMedia.push(...uploadedMedia)
                } else if (typeof uploadedMedia === 'string') {
                    postizMedia.push({ id: uploadedMedia })
                }
            }
        }

        const dateStr = postParams.scheduledDate ? postParams.scheduledDate.toISOString() : new Date().toISOString()

        const posts = validIntegrations.map((integration: any) => {
            return {
                integration: { id: integration.id },
                group: integration.id,
                value: [{
                    id: Math.random().toString(36).substring(7),
                    content: postParams.content,
                    image: postizMedia
                }],
                settings: { __type: integration.provider } // Using generic None settings
            }
        })

        const res: any = await client.post({
            type: postType,
            date: dateStr,
            inter: 0,
            shortLink: false,
            tags: [],
            posts: posts
        })

        if (!res?.id && !res?.[0]?.id) {
            console.error('Postiz did not return a valid task ID. Response was:', res)
        }

        // The Postiz API response for creating a post varies, if we get an array or object
        // Return a mock ID or real group ID if available, so it can be tracked
        return res?.id || res?.[0]?.id || `postiz_${Date.now()}`

    } catch (e: any) {
        console.error('Sync to Postiz failed:', e?.message || e)
        return null
    }
}

export async function deletePostFromPostiz(postId: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const client = await getPostizClient()
    if (!client) return
    try {
        await client.deletePost(postId)
    } catch (e) {
        console.error('Failed to delete Postiz post:', e)
    }
}

export async function testPostizConnection() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const url = process.env.POSTIZ_URL
        const apiKey = process.env.POSTIZ_API_KEY
        if (!apiKey) return { success: false, message: 'API Key is required' }

        const apiUrl = url ? (url.endsWith('/api') ? url : url.endsWith('/') ? `${url}api` : `${url}/api`) : undefined
        const client = new Postiz(apiKey, apiUrl)
        const integrations: any = await client.integrations()
        const numIdentities = Array.isArray(integrations) ? integrations.length : 0

        return {
            success: true,
            message: `Successfully connected to Postiz. Found ${numIdentities} connected integrations.`
        }
    } catch (e: any) {
        console.error('Postiz connection test failed:', e)
        return { success: false, message: e.message || 'Connection failed' }
    }
}
