export const dynamic = "force-dynamic"
import { getPhotos, getPhotoTags } from '@/app/actions/photos'
import { GalleryClient } from '@/components/gallery/gallery-client'
import { PageHeader } from '@/components/ui/page-header'
import { Images } from 'lucide-react'

import { ProtectedRoute } from '@/components/layout/protected-route'

export default async function GalleryPage() {
    // ⚡ Bolt: Execute independent data queries concurrently to avoid waterfall fetching
    const [photos, tags] = await Promise.all([getPhotos(), getPhotoTags()])

    return (
        <ProtectedRoute pageName="gallery">
            <div className="p-4 md:p-8 space-y-8 w-full">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <Images className="h-6 w-6" />
                            Image Gallery
                        </span>
                    }
                    description="Manage and organize your promotional photography."
                />

                <GalleryClient
                    initialPhotos={photos}
                    tags={tags}
                />
            </div>
        </ProtectedRoute>
    )
}
