import { getSocialPost, updateSocialPost, addAssetToSocialPost, deleteSocialPostAsset } from '@/app/actions/social'
import { getPromotions } from '@/app/actions/promotions'
import { getUsers, getEvents } from '@/app/actions/events'
import { getAvailablePlatforms } from '@/app/actions/postiz'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Trash2, Video, ArrowLeft, Plus, Pencil, Calendar, Instagram, Facebook, Linkedin, Twitter, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { SocialPostForm } from '@/components/social/social-post-form'

export default async function SocialPostDetailPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { edit?: string }
}) {
    const { id } = await params
    const { edit } = await searchParams
    const isEditing = edit === 'true'

    const postPromise = getSocialPost(id)
    const promotionsPromise = getPromotions()
    const usersPromise = getUsers()
    const eventsPromise = getEvents()
    const platformsPromise = getAvailablePlatforms()

    const [post, promotions, users, events, platforms] = await Promise.all([
        postPromise,
        promotionsPromise,
        usersPromise,
        eventsPromise,
        platformsPromise
    ])

    if (!post) notFound()

    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/social" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Social Media
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">{isEditing ? 'Edit Post' : 'Post Details'}</h1>
                        <p className="text-muted-foreground">
                            {isEditing ? 'Update content and schedule' : 'View post content and status'}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isEditing && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/social/${post.id}?edit=true`}>
                                    <Pencil className="h-4 w-4 mr-2" /> Edit Post
                                </Link>
                            </Button>
                        )}
                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize h-7">
                            {post.status.replace(/-/g, ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {isEditing ? (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Edit Content</CardTitle>
                                    <CardDescription>Update your post details</CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={`/social/${post.id}`}>Cancel</Link>
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <SocialPostForm
                                    post={post}
                                    promotions={promotions}
                                    users={users}
                                    events={events}
                                    availablePlatforms={platforms}
                                    action={updateSocialPost}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            <Card className="overflow-hidden">
                                <CardHeader className="bg-slate-50/50 border-b">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            {post.platform === 'Instagram' && <Instagram className="h-5 w-5 text-pink-600" />}
                                            {post.platform === 'Facebook' && <Facebook className="h-5 w-5 text-blue-600" />}
                                            {post.platform === 'LinkedIn' && <Linkedin className="h-5 w-5 text-blue-800" />}
                                            {post.platform === 'Twitter' && <Twitter className="h-5 w-5 text-slate-900" />}
                                            <span className="font-semibold">{post.platform} Post</span>
                                        </div>
                                        {post.scheduledDate && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="h-4 w-4" />
                                                {format(new Date(post.scheduledDate), 'PPP p')}
                                            </div>
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="text-xl leading-relaxed whitespace-pre-wrap text-slate-800">
                                        {post.content}
                                    </div>

                                    <div className="mt-8 flex flex-wrap gap-2 pt-6 border-t">
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {post.promotionPeriod && (
                                    <Card>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                                <MessageSquare className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Promotion</div>
                                                <Link href={`/promotions/${post.promotionPeriod.id}`} className="font-medium hover:underline">
                                                    {post.promotionPeriod.name}
                                                </Link>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {post.event && (
                                    <Card>
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Linked Event</div>
                                                <div className="font-medium">{post.event.title}</div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Assets */}
                <div className="space-y-8">

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">Other Assets</CardTitle>
                                {post.assets.length > 0 && (
                                    <CardDescription>{post.assets.length} file{post.assets.length !== 1 ? 's' : ''}</CardDescription>
                                )}
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="sm" variant="outline"><Plus className="h-4 w-4" /></Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Asset</DialogTitle>
                                        <DialogDescription>Link media to this post.</DialogDescription>
                                    </DialogHeader>
                                    <form action={addAssetToSocialPost} className="space-y-4 pt-4">
                                        <input type="hidden" name="socialPostId" value={post.id} />
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input name="name" required placeholder="Asset name" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select name="type" required defaultValue="image">
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="image">Image</SelectItem>
                                                    <SelectItem value="video">Video</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>URL</Label>
                                            <Input name="url" required placeholder="https://..." />
                                        </div>
                                        <Button type="submit" className="w-full">Add Asset</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {post.assets.length === 0 ? (
                                <div className="text-center py-10 px-4 text-sm text-muted-foreground border border-dashed rounded-lg bg-slate-50/50">
                                    No assets attached to this post yet.
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    {post.assets.map((asset: any) => (
                                        <div key={asset.id} className="group relative border rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-slate-200">
                                            <div className="aspect-video bg-slate-100 flex items-center justify-center overflow-hidden">
                                                {asset.type === 'image' ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={asset.url} alt={asset.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                ) : (
                                                    <div className="text-slate-400">
                                                        <Video className="h-10 w-10 text-red-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 flex justify-between items-center text-xs">
                                                <div className="font-medium truncate flex-1 pr-2">{asset.name}</div>
                                                <form action={deleteSocialPostAsset.bind(null, asset.id, post.id)}>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </form>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
