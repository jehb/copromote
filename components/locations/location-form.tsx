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
import { createLocation, updateLocation } from '@/app/actions/locations'
import { Plus, Pencil } from 'lucide-react'
import { toast } from 'sonner'

// Define the type for the location prop
type Location = {
    id: string
    name: string
}

function SubmitButton({ isEditing }: { isEditing: boolean }) {
    const { pending } = useFormStatus()
    return (
        <Button type="submit" disabled={pending}>
            {pending ? 'Saving...' : (isEditing ? 'Update Location' : 'Save Location')}
        </Button>
    )
}

export function LocationForm({ location }: { location?: Location }) {
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')
    const isEditing = !!location

    // Reset form state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            setError('')
        }
    }, [open])

    async function clientAction(formData: FormData) {
        try {
            setError('')
            let result;
            if (isEditing && location) {
                result = await updateLocation(location.id, formData)
            } else {
                result = await createLocation(formData)
            }

            if (result.success) {
                setOpen(false)
                toast.success(isEditing ? 'Location updated' : 'Location created')
            } else {
                setError(result.message || 'Failed to save location.')
            }
        } catch (e) {
            setError('An unexpected error occurred.')
            console.error(e)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" aria-label="Edit Location" className="h-8 w-8 text-muted-foreground hover:text-blue-600">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Location
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form action={clientAction}>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? 'Edit Location' : 'Add Location'}</DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update details for this location.' : 'Create a new location for events.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g., Main Hall"
                                defaultValue={location?.name}
                                required
                            />
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
