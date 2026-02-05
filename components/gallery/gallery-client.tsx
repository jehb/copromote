'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Tag as TagIcon, Search, Eye } from 'lucide-react'
import { UploadModal } from './upload-modal'
import { deletePhoto } from '@/app/actions/photos'
import { cn } from '@/lib/utils'

interface GalleryClientProps {
    initialPhotos: any[]
    categories: any[]
}

export function GalleryClient({ initialPhotos, categories }: GalleryClientProps) {
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filteredPhotos = initialPhotos.filter(photo => {
        const matchesCategory = selectedCategory === 'all' || photo.categoryId === selectedCategory
        const matchesSearch = photo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            photo.tags.some((t: any) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this photo?')) return
        try {
            await deletePhoto(id)
        } catch (err) {
            console.error(err)
            alert('Failed to delete photo')
        }
    }

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <div className="w-full lg:w-64 space-y-6">
                <UploadModal categories={categories} />

                <div className="space-y-4">
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Categories</div>
                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={cn(
                                "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                selectedCategory === 'all' ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            <span>All Photos</span>
                            <span className="text-[10px] opacity-70">{initialPhotos.length}</span>
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                    selectedCategory === category.id ? "bg-primary text-primary-foreground" : "text-slate-600 hover:bg-slate-100"
                                )}
                            >
                                <span className="truncate">{category.name}</span>
                                <span className="text-[10px] opacity-70">{category._count.photos}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Search Tags</div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find by tag or name..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Photo Grid */}
            <div className="flex-1">
                {filteredPhotos.length === 0 ? (
                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50/50 text-muted-foreground">
                        <Images className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium">No photos found</p>
                        <p className="text-sm">Try changing your filters or upload a new photo.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredPhotos.map((photo) => (
                            <Card key={photo.id} className="group overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 hover:ring-primary/50 transition-all">
                                <CardContent className="p-0 relative aspect-square">
                                    <img
                                        src={photo.url}
                                        alt={photo.name || 'Photo'}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" asChild>
                                            <a href={photo.url} target="_blank" rel="noopener noreferrer">
                                                <Eye className="h-4 w-4" />
                                            </a>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDelete(photo.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Badge className="absolute top-2 left-2 bg-white/90 text-slate-900 hover:bg-white pointer-events-none border-0">
                                        {photo.category.name}
                                    </Badge>
                                </CardContent>
                                <div className="p-4 bg-white">
                                    <div className="font-semibold text-sm truncate mb-2">
                                        {photo.name || 'Untitled Photo'}
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {photo.tags.map((tag: any) => (
                                            <div key={tag.id} className="flex items-center gap-1 text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                <TagIcon className="h-2.5 w-2.5" />
                                                {tag.name}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function Images({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 22H4a2 2 0 0 1-2-2V6" />
            <path d="M22 18V4a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v14" />
            <rect width="18" height="18" x="2" y="2" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="m16 16-3.4-3.4a2 2 0 0 0-2.8 0L6.4 16" />
        </svg>
    )
}
