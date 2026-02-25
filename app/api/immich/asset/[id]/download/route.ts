import { initImmich } from '@/app/actions/immich'
import * as immich from '@immich/sdk'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await initImmich()
        const resolvedParams = await params
        // Get the name from search parameters to use as the download filename
        const { searchParams } = new URL(request.url)
        const name = searchParams.get('name') || 'download'
        const isInline = searchParams.get('inline') === 'true'

        const blob = await immich.downloadAsset({ id: resolvedParams.id })

        return new Response(blob, {
            headers: {
                'Content-Type': blob.type || 'application/octet-stream',
                'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(name)}"`,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
            }
        })
    } catch (error) {
        console.error('Error downloading Immich asset:', error)
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
