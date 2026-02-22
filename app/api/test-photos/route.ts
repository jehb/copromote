import { NextResponse } from 'next/server'
import { getPhotos } from '@/app/actions/photos'

export async function GET() {
    const photos = await getPhotos()
    return NextResponse.json({ photos })
}
