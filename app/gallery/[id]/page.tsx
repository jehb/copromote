import { getPhoto, getPhotoTags, getAlbums } from '@/app/actions/photos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag as TagIcon, Image as ImageIcon, Download, AlignLeft, Layers } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ProductTagAssigner } from '@/components/gallery/product-tag-assigner'
import { PhotoMetadataEditor } from '@/components/gallery/photo-metadata-editor'
import { PhotoAlbumEditor } from '@/components/gallery/photo-album-editor'
import { getImmichAssets } from '@/app/actions/immich'

interface GalleryItemPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function GalleryItemPage({ params }: GalleryItemPageProps) {
    const { id } = await params

    // Performance optimization: Execute independent data fetches concurrently
    // to avoid sequential waterfall delays and reduce total page load latency.
    const [photo, allTags, allAlbums] = await Promise.all([
        getPhoto(id),
        getPhotoTags(),
        getAlbums()
    ])

    if (!photo) {
        notFound()
    }

    const existingUpcs = photo.tags
        ?.filter(t => t.name.startsWith('upc/'))
        .map(t => t.name.split('/')[1]) || []

    // Map which albums this photo is currently in
    const initialAlbums: any[] = []
    
    // Immich doesn't easily return an asset's albums from searchAssets yet,
    // so we need a workaround or if the SDK exposes it, we use it. 
    // Usually we fetch contents of albums or the list of albums an asset belongs to.
    // For now we will iterate the albums and find if the asset belongs to it using getAssets by album but that might be slow.
    // Given the SDK shape we may just pass empty initially if there's no efficient endpoint and let the UI manage new state, 
    // wait, we can just fetch the album contents if needed or use a raw API call to get an asset's albums.
    // Let's check if we can query an asset's albums directly. Immich allows getting asset details which might include album information.
    // To keep it simple, we'll try to get it if available on the asset, otherwise default to [].

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild aria-label="Back to Gallery">
                        <Link href="/gallery">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 group flex items-center gap-2">
                            {photo.name || 'Untitled Photo'}
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-1.5 mt-1">
                            <ImageIcon className="h-4 w-4" />
                            <span>Photo Details</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content - Image Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden flex items-center justify-center p-4 bg-slate-50/50 min-h-[60vh]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/api/immich/asset/${photo.id}/download?inline=true&name=${encodeURIComponent(photo.name || 'photo.jpg')}`}
                            alt={photo.name || 'Photo'}
                            className="w-full h-full max-h-[85vh] object-scale-down rounded-lg shadow-sm"
                        />
                    </div>
                </div>

                {/* Sidebar - Metadata */}
                <div className="space-y-6">
                    <div className="rounded-xl border bg-card text-card-foreground shadow-sm">
                        <div className="p-6 pb-2">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                Details
                            </h3>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="space-y-1">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" /> Date Added
                                </div>
                                <div className="text-slate-900 font-medium">
                                    {format(new Date(photo.createdAt), 'MMMM d, yyyy')}
                                </div>
                            </div>

                            <PhotoMetadataEditor
                                photoId={photo.id}
                                initialTags={photo.tags || []}
                                initialDescription={photo.description || null}
                                allTags={allTags}
                            />
                            
                            <div className="pt-4 border-t border-slate-100">
                                <PhotoAlbumEditor
                                    photoId={photo.id}
                                    initialAlbums={initialAlbums}
                                    allAlbums={allAlbums}
                                />
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <ProductTagAssigner
                                    photoId={photo.id}
                                    existingUpcs={existingUpcs}
                                />
                            </div>
                        </div>
                        <div className="p-6 pt-0">
                            <Button className="w-full" asChild>
                                <a href={`/api/immich/asset/${photo.id}/download?name=${encodeURIComponent(photo.name || 'photo.jpg')}`} download>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Original
                                </a>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    )
}
