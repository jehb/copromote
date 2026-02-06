'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Search, Images as ImagesIcon, Filter } from 'lucide-react'
import { getPhotos, getPhotoCategories } from '@/app/actions/photos'
import { cn } from '@/lib/utils'

interface PhotoSelectionModalProps {
    selectedPhotoIds: string[]
    onSelect: (photoIds: string[]) => void
}

export function PhotoSelectionModal({ selectedPhotoIds, onSelect }: PhotoSelectionModalProps) {
    const [open, setOpen] = useState(false)
    const [photos, setPhotos] = useState<any[]>([])
    const [categories, setCategories] = useState<any[]>([])
    const [selectedCategory, setSelectedCategory] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedPhotoIds)
    const [loading, setLoading] = useState(false)

    // Load data only when opening
    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open])

    // Sync props to temp state when opening or when props change
    useEffect(() => {
        if (open) {
            setTempSelectedIds(selectedPhotoIds)
        }
    }, [open, selectedPhotoIds])

    async function loadData() {
        setLoading(true)
        try {
            const [p, c] = await Promise.all([getPhotos(), getPhotoCategories()])
            setPhotos(p)
            setCategories(c)
        } catch (err) {
            console.error('Failed to load gallery photos:', err)
        } finally {
            setLoading(false)
        }
    }

    const filteredPhotos = photos.filter(photo => {
        const matchesCategory = selectedCategory === 'all' || photo.categoryId === selectedCategory
        const matchesSearch = photo.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            photo.tags.some((t: any) => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return matchesCategory && matchesSearch
    })

    const togglePhoto = (id: string) => {
        setTempSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        )
    }

    const handleSave = () => {
        onSelect(tempSelectedIds)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ImagesIcon className="h-4 w-4" /> Add from Gallery
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>Select Photos from Gallery</DialogTitle>
                    <DialogDescription>
                        Choose one or more photos to attach to your post.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col md:flex-row gap-4 p-6 pt-4 flex-1 overflow-hidden">
                    {/* Filters */}
                    <div className="w-full md:w-48 space-y-4 shrink-0 overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <div className="flex flex-wrap md:flex-col gap-1">
                                <Button
                                    type="button"
                                    variant={selectedCategory === 'all' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="justify-start h-8"
                                    onClick={() => setSelectedCategory('all')}
                                >
                                    All
                                </Button>
                                {categories.map(c => (
                                    <Button
                                        key={c.id}
                                        type="button"
                                        variant={selectedCategory === c.id ? 'default' : 'ghost'}
                                        size="sm"
                                        className="justify-start h-8"
                                        onClick={() => setSelectedCategory(c.id)}
                                    >
                                        <span className="truncate">{c.name}</span>
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Tag or name..."
                                    className="w-full pl-7 pr-3 py-1.5 text-xs border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="h-full flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                            </div>
                        ) : filteredPhotos.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-slate-50/50 text-muted-foreground py-12">
                                <ImagesIcon className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-sm font-medium">No results found</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                                {filteredPhotos.map((photo) => {
                                    const isSelected = tempSelectedIds.includes(photo.id)
                                    return (
                                        <Card
                                            key={photo.id}
                                            className={cn(
                                                "group cursor-pointer overflow-hidden border-2 transition-all relative aspect-square",
                                                isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                                            )}
                                            onClick={() => togglePhoto(photo.id)}
                                        >
                                            <img
                                                src={photo.url}
                                                alt={photo.name || 'Photo'}
                                                className="w-full h-full object-cover"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                                                    <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                                                        <Check className="h-4 w-4" />
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute bottom-0 inset-x-0 p-1 bg-black/60 translate-y-full group-hover:translate-y-0 transition-transform">
                                                <div className="text-[9px] text-white truncate px-1">
                                                    {photo.name || 'Untitled'}
                                                </div>
                                            </div>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t bg-slate-50/80 flex justify-between items-center sm:px-6">
                    <div className="text-sm font-medium text-slate-600">
                        {tempSelectedIds.length} photo{tempSelectedIds.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Confirm Selection
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

function Label({ children }: { children: React.ReactNode }) {
    return <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 mb-1">{children}</div>
}

function Loader2({ className }: { className?: string }) {
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
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
