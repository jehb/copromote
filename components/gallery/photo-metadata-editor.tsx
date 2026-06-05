'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { TagIcon, AlignLeft, Pencil, X, Plus, Loader2 } from 'lucide-react'
import { updatePhotoDescription, updatePhotoTags, createPhotoTag } from '@/app/actions/photos'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface TagType {
    id: string
    name: string
    color?: string
}

interface PhotoMetadataEditorProps {
    photoId: string
    initialTags: TagType[]
    initialDescription: string | null
    allTags: TagType[]
}

export function PhotoMetadataEditor({
    photoId,
    initialTags,
    initialDescription,
    allTags
}: PhotoMetadataEditorProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [description, setDescription] = useState(initialDescription || '')
    const [tags, setTags] = useState<TagType[]>(initialTags || [])
    const [openCombobox, setOpenCombobox] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        startTransition(async () => {
            try {
                if (description !== (initialDescription || '')) {
                    await updatePhotoDescription(photoId, description)
                }

                const initialTagIds = new Set((initialTags || []).map(t => t.id))
                const currentTagIds = new Set(tags.map(t => t.id))

                const tagsToRemove: string[] = []
                const tagsToAdd: string[] = []

                // Tags to remove
                for (const initTag of initialTags || []) {
                    if (!currentTagIds.has(initTag.id)) {
                        tagsToRemove.push(initTag.id)
                    }
                }

                // Tags to add
                for (const currTag of tags) {
                    if (!initialTagIds.has(currTag.id)) {
                        tagsToAdd.push(currTag.id)
                    }
                }

                if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
                    await updatePhotoTags(photoId, tagsToAdd, tagsToRemove)
                }

                setIsEditing(false)
            } catch (error) {
                console.error("Failed to save changes", error)
            }
        })
    }

    const unassignedTags = allTags.filter(
        (t) => !tags.some((assigned) => assigned.id === t.id)
    )

    const exactMatch =
        allTags.some((t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase()) ||
        tags.some((t) => t.name.toLowerCase() === searchQuery.trim().toLowerCase())

    const handleCreateTag = async () => {
        const trimmed = searchQuery.trim()
        if (!trimmed) return

        setIsCreating(true)
        try {
            const newTag = await createPhotoTag(trimmed)
            if (newTag) {
                // Add to current tags selection
                setTags([...tags, newTag])
                setSearchQuery('')
                setOpenCombobox(false)
            }
        } catch (error) {
            console.error("Failed to create tag", error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TagIcon className="h-4 w-4" /> Tags
                </div>
                {!isEditing && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(true)} aria-label="Edit metadata">
                        <Pencil className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="px-2.5 py-1 text-sm bg-slate-100 border-0 flex gap-1.5 items-center text-slate-700"
                            >
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                                {tag.name}
                                <button
                                    className="ml-1 hover:text-red-500 focus:outline-none"
                                    onClick={() => setTags(tags.filter(t => t.id !== tag.id))}
                                    aria-label={`Remove ${tag.name} tag`}
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
                                >
                                    <Plus className="h-3 w-3" />
                                    Add Tag
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Search tags..."
                                        className="h-9"
                                        value={searchQuery}
                                        onValueChange={setSearchQuery}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No tags found.</CommandEmpty>
                                        <CommandGroup>
                                            {unassignedTags.map((tag) => (
                                                <CommandItem
                                                    key={tag.id}
                                                    value={tag.name}
                                                    onSelect={() => {
                                                        setTags([...tags, tag])
                                                        setOpenCombobox(false)
                                                        setSearchQuery('')
                                                    }}
                                                >
                                                    <div className="h-2 w-2 rounded-full mr-2" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                                                    {tag.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        {!exactMatch && searchQuery.trim() !== '' && (
                                            <CommandGroup>
                                                <CommandItem
                                                    value={searchQuery}
                                                    onSelect={handleCreateTag}
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
                </div>
            ) : (
                <>
                    {initialTags && initialTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2 -mt-4">
                            {initialTags.map((tag) => (
                                <Badge
                                    key={tag.id}
                                    variant="secondary"
                                    className="px-2.5 py-1 text-sm bg-slate-100 hover:bg-slate-200 border-0 flex gap-2 items-center text-slate-700"
                                >
                                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                                    {tag.name}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-slate-500 italic -mt-4">No tags associated with this photo.</div>
                    )}
                </>
            )}

            <div className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <AlignLeft className="h-4 w-4" /> Description
                    </div>
                </div>
                {isEditing ? (
                    <Textarea
                        placeholder="Add a description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="resize-none"
                        rows={4}
                    />
                ) : (
                    <div className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {initialDescription || <span className="text-slate-500 italic">No description provided.</span>}
                    </div>
                )}
            </div>

            {isEditing && (
                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => {
                        setIsEditing(false)
                        setDescription(initialDescription || '')
                        setTags(initialTags || [])
                    }} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </div>
    )
}
