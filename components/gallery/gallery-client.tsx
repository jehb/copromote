'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, Tag as TagIcon, Search, Eye, LayoutGrid, List } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UploadModal } from './upload-modal'
import { deletePhoto } from '@/app/actions/photos'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export interface PhotoTag {
    id: string
    name: string
    color?: string
}

export interface PhotoAsset {
    id: string
    url: string
    name: string
    createdAt: string
    updatedAt: string
    description?: string | null
    tags: PhotoTag[]
}

interface GalleryClientProps {
    initialPhotos: PhotoAsset[]
    tags: PhotoTag[]
}

export function GalleryClient({ initialPhotos, tags }: GalleryClientProps) {
    const [selectedTag, setSelectedTag] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [view, setView] = useState<'grid' | 'table'>('grid')

    // ⚡ Bolt: Cache filtered array mapping to reduce CPU spikes when toggling gallery views
    const filteredPhotos = useMemo(() => {
        return initialPhotos.filter(photo => {
            const matchesTag = selectedTag === 'all' || photo.tags.some((t) => t.id === selectedTag)
            const matchesSearch = !!photo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                photo.tags.some((t) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
            return matchesTag && matchesSearch
        })
    }, [initialPhotos, selectedTag, searchQuery])

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
        <div className="flex flex-col gap-6">
            {/* Top Bar: Upload & Search */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <UploadModal tags={tags} />

                <div className="flex w-full sm:w-auto items-center gap-4">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Find by tag or name..."
                            className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <Button
                            variant={view === 'grid' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn("h-8 w-8 rounded-md", view === 'grid' && "bg-white shadow-sm")}
                            onClick={() => setView('grid')}
                            aria-label="Grid view"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === 'table' ? 'secondary' : 'ghost'}
                            size="icon"
                            className={cn("h-8 w-8 rounded-md", view === 'table' && "bg-white shadow-sm")}
                            onClick={() => setView('table')}
                            aria-label="Table view"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Horizontal Tags */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
                <button
                    onClick={() => setSelectedTag('all')}
                    className={cn(
                        "flex-none flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors border",
                        selectedTag === 'all'
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                >
                    <TagIcon className="h-3.5 w-3.5" />
                    <span>All Photos</span>
                    <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        selectedTag === 'all' ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    )}>
                        {initialPhotos.length}
                    </span>
                </button>
                {tags.map((tag) => (
                    <button
                        key={tag.id}
                        onClick={() => setSelectedTag(tag.id)}
                        className={cn(
                            "flex-none flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-full transition-colors border",
                            selectedTag === tag.id
                                ? "bg-slate-900 border-slate-900 text-white"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        )}
                    >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                        <span>{tag.name}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {filteredPhotos.length === 0 ? (
                <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-slate-50/50 text-muted-foreground">
                    <Images className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">No photos found</p>
                    <p className="text-sm">Try changing your filters or upload a new photo.</p>
                </div>
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6">
                    {filteredPhotos.map((photo) => (
                        <Card key={photo.id} className="group overflow-hidden border-0 shadow-sm ring-1 ring-slate-200 hover:ring-primary/50 transition-all">
                            <CardContent className="p-0 relative aspect-square bg-slate-50">
                                <Link href={`/gallery/${photo.id}`}>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={photo.url}
                                        alt={photo.name || 'Photo'}
                                        className="w-full h-full object-contain cursor-pointer"
                                    />
                                </Link>
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                    <div className="pointer-events-auto flex gap-2">
                                        <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full" aria-label={`View photo ${photo.name || 'details'}`} asChild>
                                            <Link href={`/gallery/${photo.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="destructive"
                                            className="h-9 w-9 rounded-full bg-red-500 hover:bg-red-600"
                                            onClick={() => handleDelete(photo.id)}
                                            aria-label={`Delete photo ${photo.name || 'details'}`}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                                {photo.tags.length > 0 && (
                                    <Badge className="absolute top-2 left-2 bg-white/90 text-slate-900 hover:bg-white pointer-events-none border-0 shadow-sm flex gap-1 items-center">
                                        <TagIcon className="h-3 w-3 text-muted-foreground" />
                                        {photo.tags[0]?.name}
                                        {photo.tags.length > 1 && <span className="text-[10px] text-muted-foreground ml-1">+{photo.tags.length - 1}</span>}
                                    </Badge>
                                )}
                            </CardContent>
                            <div className="p-4 bg-white">
                                <div className="font-semibold text-sm truncate mb-2" title={photo.name}>
                                    {photo.name || 'Untitled Photo'}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {photo.tags.map((tag) => (
                                        <div key={tag.id} className="flex items-center gap-1.5 text-[10px] bg-slate-50 border px-2 py-0.5 rounded-full text-slate-600 font-medium">
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || '#cbd5e1' }} />
                                            {tag.name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-xl border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead className="hidden sm:table-cell">Edited</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPhotos.map((photo) => (
                                <TableRow key={photo.id}>
                                    <TableCell>
                                        <div className="h-12 w-12 rounded-lg border bg-slate-50 overflow-hidden flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={photo.url}
                                                alt={photo.name || 'Thumbnail'}
                                                className="max-h-full max-w-full object-contain"
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {photo.name || <span className="text-muted-foreground italic">Untitled</span>}
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell max-w-[200px] truncate text-slate-500" title={photo.description || undefined}>
                                        {photo.description || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {photo.tags.map((tag) => (
                                                <Badge key={tag.id} variant="outline" className="font-normal bg-slate-50 gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || '#cbd5e1' }} />
                                                    {tag.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-slate-500 whitespace-nowrap">
                                        {new Date(photo.updatedAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`View photo ${photo.name || 'details'}`} asChild>
                                                <Link href={`/gallery/${photo.id}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleDelete(photo.id)}
                                                aria-label={`Delete photo ${photo.name || 'details'}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
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
