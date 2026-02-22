import { initImmich } from '@/app/actions/immich'
import * as immich from '@immich/sdk'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initImmich()
        const resolvedParams = await params
        const blob = await immich.viewAsset({ id: resolvedParams.id })

        return new Response(blob, {
            headers: {
                'Content-Type': blob.type || 'image/jpeg',
                // Cache immich images locally for a week to save bandwidth
                'Cache-Control': 'public, max-age=604800, immutable',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            }
        })
    } catch (error) {
        console.error('Error fetching Immich asset:', error)
        return new Response('Asset not found', { status: 404 })
    }
}

export async function OPTIONS() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
        }
    })
}
