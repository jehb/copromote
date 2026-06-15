'use client'

import { useState, useEffect } from 'react'
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
import { createColorPalette, updateColorPalette } from '@/app/actions/color-palettes'
import { Plus, Pencil, Trash2, Palette } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type ColorPalette = {
    id: string
    name: string
    colors: any
}

export function ColorPaletteForm({ palette }: { palette?: ColorPalette }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [error, setError] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    // Parse the colors or start with a default array of 5 empty strings
    const initialColors = palette ? (typeof palette.colors === 'string' ? JSON.parse(palette.colors) : palette.colors) : ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff']
    const [colors, setColors] = useState<string[]>(initialColors)
    const [name, setName] = useState(palette?.name || '')

    const isEditing = !!palette

    useEffect(() => {
        setIsMounted(true)
        if (!open) {
            setError('')
            setColors(palette ? (typeof palette.colors === 'string' ? JSON.parse(palette.colors) : palette.colors) : ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff'])
            setName(palette?.name || '')
        }
    }, [open, palette])

    if (!isMounted) {
        return isEditing ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" aria-label="Edit Color Palette">
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit</span>
            </Button>
        ) : (
            <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Palette
            </Button>
        )
    }

    const handleAddColor = () => setColors([...colors, '#ffffff'])

    const handleRemoveColor = (index: number) => {
        const newColors = [...colors]
        newColors.splice(index, 1)
        setColors(newColors)
    }

    const handleColorChange = (index: number, value: string) => {
        const newColors = [...colors]
        newColors[index] = value
        setColors(newColors)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        try {
            setIsPending(true)
            setError('')

            if (!name.trim()) {
                setError('Name is required.')
                return
            }
            if (colors.length === 0) {
                setError('At least one color is required.')
                return
            }

            let result;
            if (isEditing && palette) {
                result = await updateColorPalette(palette.id, { name, colors })
            } else {
                result = await createColorPalette({ name, colors })
            }

            if (result.success) {
                setOpen(false)
                toast.success(isEditing ? 'Color palette updated' : 'Color palette created')
                router.refresh()
            } else {
                setError(result.error || 'Failed to save color palette.')
            }
        } catch (e) {
            setError('An unexpected error occurred.')
            console.error(e)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-600" aria-label="Edit Color Palette">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                    </Button>
                ) : (
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Palette
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="w-5 h-5 text-blue-600" />
                            {isEditing ? 'Edit Color Palette' : 'Add Color Palette'}
                        </DialogTitle>
                        <DialogDescription>
                            {isEditing ? 'Update your brand colors.' : 'Create a new collection of colors.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Palette Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Primary Brand Colors"
                                required
                            />
                        </div>

                        <div className="space-y-3 mt-2">
                            <div className="flex justify-between items-center">
                                <Label>Colors</Label>
                                <Button type="button" variant="outline" size="sm" onClick={handleAddColor}>
                                    <Plus className="h-3 w-3 mr-1" /> Add Color
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {colors.map((color, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded border shadow-sm shrink-0"
                                            style={{ backgroundColor: color }}
                                        />
                                        <Input
                                            type="color"
                                            value={color}
                                            onChange={(e) => handleColorChange(idx, e.target.value)}
                                            className="w-12 h-9 p-1 shrink-0 cursor-pointer"
                                        />
                                        <Input
                                            type="text"
                                            value={color}
                                            onChange={(e) => handleColorChange(idx, e.target.value)}
                                            className="font-mono text-sm uppercase"
                                            placeholder="#000000"
                                            pattern="^#[0-9a-fA-F]{6}$"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                                            onClick={() => handleRemoveColor(idx)}
                                            disabled={colors.length === 1}
                                            aria-label="Remove Color"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500">{error}</p>}
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? 'Saving...' : (isEditing ? 'Update Palette' : 'Save Palette')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
