import { useState } from 'react'
import { Plus, Check } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface PhotoSelectorProps {
    availablePhotos: { id: string, url: string, name: string }[]
    onSelect: (photoId: string) => void
}

export function PhotoSelector({ availablePhotos, onSelect }: PhotoSelectorProps) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start text-stone-500 font-normal">
                    <Plus className="mr-2 h-4 w-4" />
                    Attach Gallery Photo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white">
                <DialogHeader>
                    <DialogTitle>Select Photo from Gallery</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-4 py-4 max-h-[60vh] overflow-y-auto w-full">
                    {availablePhotos.length === 0 ? (
                        <div className="col-span-3 text-center py-8 text-stone-500">
                            No photos available in the gallery.
                        </div>
                    ) : (
                        availablePhotos.map((photo) => (
                            <button
                                key={photo.id}
                                onClick={() => {
                                    onSelect(photo.id)
                                    setOpen(false)
                                }}
                                className={cn(
                                    "flex flex-col relative aspect-square items-center justify-center rounded-lg border-2 border-transparent transition-all overflow-hidden bg-neutral-100",
                                    "hover:border-blue-500 hover:shadow-md"
                                )}
                            >
                                <img
                                    src={photo.url}
                                    alt={photo.name || 'Gallery photo'}
                                    className="object-cover w-full h-full"
                                />
                                <div className="absolute inset-x-0 bottom-0 bg-black/50 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs truncate text-center">
                                        {photo.name}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
