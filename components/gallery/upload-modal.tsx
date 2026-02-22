'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Tag, Link as LinkIcon, Loader2 } from 'lucide-react'
import { uploadPhoto, createPhotoTag } from '@/app/actions/photos'

interface UploadModalProps {
    tags: any[]
}

export function UploadModal({ tags }: UploadModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCreatingTag, setIsCreatingTag] = useState(false)
    const [newTag, setNewTag] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const file = formData.get('file') as File
        console.log('Uploading file:', file?.name, 'Size:', file?.size, 'Type:', file?.type)

        try {
            await uploadPhoto(formData)
            setOpen(false)
        } catch (err: any) {
            console.error('Upload error details:', err)
            alert(err.message || 'Failed to upload photo')
        } finally {
            setLoading(false)
        }
    }

    async function handleAddTag() {
        if (!newTag.trim()) return
        try {
            await createPhotoTag(newTag)
            setNewTag('')
            setIsCreatingTag(false)
        } catch (err) {
            console.error(err)
            alert('Failed to create tag')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" /> Upload Photo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload New Photo</DialogTitle>
                    <DialogDescription>
                        Add a photo to your gallery with categories and tags.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">Select Photo</Label>
                        <div className="relative">
                            <Plus className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="file"
                                name="file"
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="pl-9 pt-1.5"
                                required
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                            Max size: 5MB. Allowed: JPEG, PNG, WEBP, GIF.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="tagIds">Label / Tag</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] uppercase tracking-wider"
                                onClick={() => setIsCreatingTag(!isCreatingTag)}
                            >
                                {isCreatingTag ? 'Cancel' : 'New Tag'}
                            </Button>
                        </div>

                        {isCreatingTag ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter tag name"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    className="h-10"
                                />
                                <Button type="button" onClick={handleAddTag}>Add</Button>
                            </div>
                        ) : (
                            <Select name="tagIds">
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a tag" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tags.map((tag) => (
                                        <SelectItem key={tag.id} value={tag.id}>
                                            <div className="flex items-center gap-2">
                                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                                                {tag.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Upload Photo
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
