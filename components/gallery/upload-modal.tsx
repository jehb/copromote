'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Tag, Link as LinkIcon, Loader2 } from 'lucide-react'
import { uploadPhoto, createPhotoCategory } from '@/app/actions/photos'

interface UploadModalProps {
    categories: any[]
}

export function UploadModal({ categories }: UploadModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategory, setNewCategory] = useState('')

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

    async function handleAddCategory() {
        if (!newCategory.trim()) return
        try {
            await createPhotoCategory(newCategory)
            setNewCategory('')
            setIsCreatingCategory(false)
        } catch (err) {
            console.error(err)
            alert('Failed to create category')
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
                        <Label htmlFor="name">Photo Name (Optional)</Label>
                        <Input id="name" name="name" placeholder="Summer 2024 Launch" />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="categoryId">Category</Label>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 text-[10px] uppercase tracking-wider"
                                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                            >
                                {isCreatingCategory ? 'Cancel' : 'New Category'}
                            </Button>
                        </div>

                        {isCreatingCategory ? (
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter category name"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="h-10"
                                />
                                <Button type="button" onClick={handleAddCategory}>Add</Button>
                            </div>
                        ) : (
                            <Select name="categoryId" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tags" className="flex items-center gap-2">
                            <Tag className="h-4 w-4" /> Tags (comma separated)
                        </Label>
                        <Input id="tags" name="tags" placeholder="organic, fresh, summer" />
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
