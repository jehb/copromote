import { getPhotos, getPhotoCategories } from '@/app/actions/photos'
import { GalleryClient } from '@/components/gallery/gallery-client'

export default async function GalleryPage() {
    const photos = await getPhotos()
    const categories = await getPhotoCategories()

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold">Image Gallery</h1>
                <p className="text-muted-foreground font-medium">Manage and organize your promotional photography.</p>
            </div>

            <GalleryClient
                initialPhotos={photos}
                categories={categories}
            />
        </div>
    )
}
