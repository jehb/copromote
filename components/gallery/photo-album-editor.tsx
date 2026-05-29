'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Image as ImageIcon, Plus, Loader2, X, Trash2 } from 'lucide-react'
import { createAlbum, addPhotoToAlbum, removePhotoFromAlbum, deleteAlbum } from '@/app/actions/photos'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface AlbumType {
    id: string
    name: string
    assetCount: number
}

interface PhotoAlbumEditorProps {
    photoId: string
    initialAlbums: AlbumType[]
    allAlbums: AlbumType[]
}

export function PhotoAlbumEditor({
    photoId,
    initialAlbums,
    allAlbums
}: PhotoAlbumEditorProps) {
    const [albums, setAlbums] = useState<AlbumType[]>(initialAlbums || [])
    const [availableAlbums, setAvailableAlbums] = useState<AlbumType[]>(allAlbums || [])
    const [openCombobox, setOpenCombobox] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isPending, startTransition] = useTransition()

    const unassignedAlbums = availableAlbums.filter(
        (a) => !albums.some((assigned) => assigned.id === a.id)
    )

    const exactMatch =
        availableAlbums.some((a) => a.name.toLowerCase() === searchQuery.trim().toLowerCase()) ||
        albums.some((a) => a.name.toLowerCase() === searchQuery.trim().toLowerCase())

    const handleCreateAlbum = async () => {
        const trimmed = searchQuery.trim()
        if (!trimmed) return

        setIsCreating(true)
        try {
            const newAlbum = await createAlbum(trimmed)
            if (newAlbum) {
                const fullAlbum = { ...newAlbum, assetCount: 0 }
                setAvailableAlbums([...availableAlbums, fullAlbum])

                // Also add the current photo to it immediately
                await addPhotoToAlbum(photoId, newAlbum.id)
                setAlbums([...albums, fullAlbum])

                setSearchQuery('')
                setOpenCombobox(false)
            }
        } catch (error) {
            console.error("Failed to create album", error)
        } finally {
            setIsCreating(false)
        }
    }

    const handleAddAlbum = (album: AlbumType) => {
        startTransition(async () => {
            try {
                await addPhotoToAlbum(photoId, album.id)
                setAlbums([...albums, album])
                setOpenCombobox(false)
                setSearchQuery('')
            } catch (error) {
                console.error("Failed to add photo to album", error)
            }
        })
    }

    const handleRemoveAlbum = (albumId: string) => {
        startTransition(async () => {
            try {
                await removePhotoFromAlbum(photoId, albumId)
                setAlbums(albums.filter(a => a.id !== albumId))
            } catch (error) {
                console.error("Failed to remove photo from album", error)
            }
        })
    }

    const handleDeleteAlbum = (albumId: string, event: React.MouseEvent) => {
        event.stopPropagation()
        if (!confirm('Are you sure you want to delete this album exactly? This cannot be undone.')) return
        startTransition(async () => {
            try {
                await deleteAlbum(albumId)
                setAvailableAlbums(availableAlbums.filter(a => a.id !== albumId))
                setAlbums(albums.filter(a => a.id !== albumId))
            } catch (error) {
                console.error("Failed to delete album", error)
            }
        })
    }

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> Albums
                {isPending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-2" />}
            </div>

            <div className="flex flex-wrap gap-2">
                {albums.map((album) => (
                    <Badge
                        key={album.id}
                        variant="outline"
                        className="px-2.5 py-1 text-sm bg-slate-50 border-slate-200 flex gap-1.5 items-center text-slate-700"
                    >
                        {album.name}
                        <button
                            disabled={isPending}
                            className="ml-1 hover:text-red-500 focus:outline-none disabled:opacity-50"
                            onClick={() => handleRemoveAlbum(album.id)}
                            title="Remove photo from album"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}

                <Popover open={openCombobox} onOpenChange={(open) => {
                    setOpenCombobox(open)
                    if (!open) {
                        setSearchQuery('')
                    }
                }}>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-dashed gap-1"
                            disabled={isPending}
                        >
                            <Plus className="h-3 w-3" />
                            Add to Album
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[240px] p-0" align="start">
                        <Command>
                            <CommandInput
                                placeholder="Search albums..."
                                className="h-9"
                                value={searchQuery}
                                onValueChange={setSearchQuery}
                            />
                            <CommandList>
                                <CommandEmpty>No albums found.</CommandEmpty>
                                <CommandGroup>
                                    {unassignedAlbums.map((album) => (
                                        <CommandItem
                                            key={album.id}
                                            value={album.name}
                                            onSelect={() => handleAddAlbum(album)}
                                            className="flex justify-between items-center group pr-2"
                                        >
                                            <span className="truncate">{album.name}</span>
                                            <button
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-opacity"
                                                onClick={(e) => handleDeleteAlbum(album.id, e)}
                                                title="Delete album permanently"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                                {!exactMatch && searchQuery.trim() !== '' && (
                                    <CommandGroup>
                                        <CommandItem
                                            value={searchQuery}
                                            onSelect={handleCreateAlbum}
                                            className="text-primary italic font-medium"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create &quot;{searchQuery.trim()}&quot;
                                            {isCreating && <Loader2 className="ml-2 h-3 w-4 animate-spin" />}
                                        </CommandItem>
                                    </CommandGroup>
                                )}
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
            </div>
            {albums.length === 0 && (
                <div className="text-sm text-slate-500 italic -mt-1">Not in any albums.</div>
            )}
        </div>
    )
}
