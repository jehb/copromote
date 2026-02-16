export const dynamic = "force-dynamic"
import { getPhotos, getPhotoCategories } from '@/app/actions/photos'
import { GalleryClient } from '@/components/gallery/gallery-client'
import { PageHeader } from '@/components/ui/page-header'
import { Images } from 'lucide-react'

export default async function GalleryPage() {
    const photos = await getPhotos()
    const categories = await getPhotoCategories()

    return (
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
                categories={categories}
            />
        </div>
    )
}
