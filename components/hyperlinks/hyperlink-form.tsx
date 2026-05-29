'use client'


import { useState, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createHyperlink, updateHyperlink } from '@/app/actions/hyperlinks'
import { Plus, Pencil } from 'lucide-react'

// Define the type for the hyperlink prop
type Hyperlink = {
    id: string
    title: string
    url: string
    description: string | null
    icon: string | null
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : (isEditing ? 'Update Hyperlink' : 'Save Hyperlink')}
        </Button>
    )
}

export function HyperlinkForm({ hyperlink }: { hyperlink?: Hyperlink }) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')
    const isEditing = !!hyperlink

    // Reset form state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setError('')
        }
    }, [open])

    async function clientAction(formData: FormData) {
        try {
            setError('')
            if (isEditing && hyperlink) {
                await updateHyperlink(hyperlink.id, formData)
            } else {
                await createHyperlink(formData)
            }
            setOpen(false)
        } catch (e) {
            setError('Failed to save hyperlink. Title and URL are required.')
            console.error(e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" aria-label="Edit Hyperlink" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Hyperlink
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={clientAction}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Hyperlink' : 'Add Hyperlink'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update details for this link.' : 'Create a new link to an external resource.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                placeholder="e.g., Marketing Dashboard"
                                defaultValue={hyperlink?.title}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="url">URL</Label>
                            <Input
                                id="url"
                                name="url"
                                placeholder="https://..."
                                defaultValue={hyperlink?.url}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                placeholder="Brief description of this resource..."
                                defaultValue={hyperlink?.description || ''}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="icon">Icon (Optional)</Label>
                            <Input
                                id="icon"
                                name="icon"
                                placeholder="Lucide icon name (e.g., 'ChartBar')"
                                defaultValue={hyperlink?.icon || ''}
                            />
                            <p className="text-xs text-muted-foreground">
                                Enter a valid <a href="https://lucide.dev/icons" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Lucide icon name</a>.
                            </p>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                        <SubmitButton isEditing={isEditing} />
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
