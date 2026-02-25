import { getPhoto } from '@/app/actions/photos'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Calendar, Tag as TagIcon, Image as ImageIcon, Download } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

interface GalleryItemPageProps {
    params: Promise<{
        id: string
    }>
}

export default async function GalleryItemPage({ params }: GalleryItemPageProps) {
    const { id } = await params
    const photo = await getPhoto(id)

    if (!photo) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
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

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                    <TagIcon className="h-4 w-4" /> Tags
                                </div>
                                {photo.tags && photo.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {photo.tags.map((tag: { id: string; name: string; color?: string }) => (
                                            <Badge
                                                key={tag.id}
                                                variant="secondary"
                                                className="px-2.5 py-1 text-sm bg-slate-100 hover:bg-slate-200 border-0 flex gap-2 items-center text-slate-700"
                                            >
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                                                {tag.name}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500 italic">No tags associated with this photo.</div>
                                )}
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
        </div>
    )
}
