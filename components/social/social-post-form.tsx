'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, Sparkles, Loader2, Check, X, Images as ImagesIcon } from 'lucide-react'
import { format } from 'date-fns'
import { generateSocialPostAlternatives } from '@/app/actions/ai'
import { PhotoSelectionModal } from '@/components/gallery/photo-selection-modal'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

interface SocialPostFormProps {
    post?: any
    promotions: any[]
    users: any[]
    events: any[]
    availablePlatforms: { value: string, label: string }[]
    action: (formData: FormData) => Promise<void>
}

export function SocialPostForm({ post, promotions, users, events, availablePlatforms, action }: SocialPostFormProps) {
    const defaultPlatform = post?.platform || availablePlatforms?.[0]?.value || 'Twitter'
    const [status, setStatus] = useState(post?.status || 'draft')
    const [content, setContent] = useState(post?.content || '')
    const [platform, setPlatform] = useState(defaultPlatform)
    const [alternatives, setAlternatives] = useState<string[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPhotos, setSelectedPhotos] = useState<any[]>(post?.assets || [])

    const photoIds = selectedPhotos.map(p => p.id).join(',')

    return (
        <form action={action} className="space-y-6">
            {post?.id && <input type="hidden" name="id" value={post.id} />}
            <input type="hidden" name="assetIds" value={photoIds} />

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label htmlFor="content">Content</Label>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100"
                            onClick={async () => {
                                if (!content.trim() || content.length < 10) {
                                    setError('Please enter at least 10 characters to get meaningful suggestions.')
                                    return
                                }
                                setIsGenerating(true)
                                setError(null)
                                try {
                                    const results = await generateSocialPostAlternatives(content, platform)
                                    if (!results || results.length === 0) {
                                        throw new Error('AI could not generate any variations. Try changing your content.')
                                    }
                                    setAlternatives(results)
                                    setShowSuggestions(true)
                                } catch (err: any) {
                                    console.error('AI Suggestion Error:', err)
                                    setError(err.message || 'Failed to generate suggestions. Check your AI settings.')
                                } finally {
                                    setIsGenerating(false)
                                }
                            }}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Sparkles className="h-3.5 w-3.5" />
                            )}
                            {isGenerating ? 'Generating...' : 'AI Suggestions'}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="text-xs text-red-500 bg-red-50 p-2 rounded border border-red-100">
                        {error}
                    </div>
                )}

                <Textarea
                    id="content"
                    name="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your caption here..."
                    className="min-h-[150px] text-lg"
                    required
                />
            </div>

            <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                            AI Suggestions
                        </DialogTitle>
                        <DialogDescription>
                            Three alternatives based on your current content. Click one to use it.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {alternatives.length > 0 ? (
                            alternatives.map((alt, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group relative"
                                    onClick={() => {
                                        setContent(alt)
                                        setShowSuggestions(false)
                                    }}
                                >
                                    <div className="text-sm leading-relaxed text-slate-700">{alt}</div>
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Badge variant="outline" className="text-[10px] bg-white">Select</Badge>
                                    </div>
                                </button>
                            ))
                        ) : (
                            <div className="py-8 text-center text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                                No suggestions found.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)}>
                            Cancel
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <Label className="flex items-center gap-2">
                        <ImagesIcon className="h-4 w-4 text-slate-500" /> Attached Media
                    </Label>
                    <PhotoSelectionModal
                        selectedPhotoIds={useMemo(() => selectedPhotos.map(p => p.id), [selectedPhotos])}
                        onSelect={async (ids) => {
                            // This depends on getPhotos but for simplicity we could refetch or trust the modal
                            // Since the modal already has the data, but we only return IDs
                            // Let's just fetch them here or update the modal to return full objects
                            const allPhotos = await import('@/app/actions/photos').then(m => m.getPhotos())
                            const selected = allPhotos.filter((p: any) => ids.includes(p.id))
                            setSelectedPhotos(selected)
                        }}
                    />
                </div>

                {selectedPhotos.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-6 text-center text-muted-foreground bg-slate-50/50">
                        <p className="text-xs">No media attached. Select photos from the gallery.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {selectedPhotos.map((photo) => (
                            <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group border bg-white ring-offset-2 hover:ring-2 hover:ring-primary/20 transition-all">
                                <img
                                    src={photo.url}
                                    alt={photo.name || 'Post Media'}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSelectedPhotos(prev => prev.filter(p => p.id !== photo.id))}
                                    className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 text-[8px] text-white truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                    {photo.category?.name || 'Uncategorized'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="platform">Platform</Label>
                    <Select name="platform" defaultValue={platform} onValueChange={setPlatform} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                            {availablePlatforms.map((p) => (
                                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        name="status"
                        defaultValue={status}
                        onValueChange={setStatus}
                        required
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="ready-for-review">Ready for Review</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {status === 'ready-for-review' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Label htmlFor="reviewerId">Reviewer</Label>
                    <Select name="reviewerId" defaultValue={post?.reviewerId || 'none'} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select reviewer" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" disabled>Select a reviewer...</SelectItem>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Assign a teammate to review this post.</p>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date & Time</Label>
                <Input
                    type="datetime-local"
                    id="scheduledDate"
                    name="scheduledDate"
                    defaultValue={post?.scheduledDate ? format(new Date(post.scheduledDate), "yyyy-MM-dd'T'HH:mm") : ''}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="promotionPeriodId">Linked Promotion</Label>
                    <Select name="promotionPeriodId" defaultValue={post?.promotionPeriodId || 'unlinked'}>
                        <SelectTrigger>
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unlinked">None</SelectItem>
                            {promotions.map((promo: any) => (
                                <SelectItem key={promo.id} value={promo.id}>{promo.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="eventId">Linked Event</Label>
                    <Select name="eventId" defaultValue={post?.eventId || 'none'}>
                        <SelectTrigger>
                            <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {events.map((event: any) => (
                                <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>



            <div className="pt-4 flex justify-end gap-2">
                <Button type="submit" className="gap-2">
                    <Save className="h-4 w-4" /> {post?.id ? 'Save Changes' : 'Create Post'}
                </Button>
            </div>
        </form>
    )
}
