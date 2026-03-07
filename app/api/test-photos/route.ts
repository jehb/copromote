import { NextResponse } from 'next/server'
import { getPhotos } from '@/app/actions/photos'
import { getSession } from '@/lib/session'

export async function GET() {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const photos = await getPhotos()
    return NextResponse.json({ photos })
}
