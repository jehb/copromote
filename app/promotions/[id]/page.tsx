import { getPromotion, addAssetToPromotion, deletePromotionAsset } from '@/app/actions/promotions'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
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
import { Trash2, Link as LinkIcon, FileText, Image as ImageIcon, Video, ArrowLeft, Plus, Instagram, Facebook, Linkedin, Twitter, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default async function PromotionDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const promotion = await getPromotion(id)

    if (!promotion) notFound()

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/calendar" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" /> Back to Calendar
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <Badge className="mb-2 uppercase tracking-wider bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200" variant="outline">
                            Promotion Period
                        </Badge>
                        <h1 className="text-4xl font-bold">{promotion.name}</h1>
                    </div>
                    <div className="text-right text-sm text-muted-foreground bg-slate-100 p-3 rounded-md">
                        <div className="font-semibold text-slate-700">Duration</div>
                        <div>{format(promotion.startDate, 'PPP')}</div>
                        <div className="text-center font-bold text-slate-400">to</div>
                        <div>{format(promotion.endDate, 'PPP')}</div>
                    </div>
                </div>
            </div>

            {/* Assets Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Promotion Assets</CardTitle>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button>Add Asset</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add Asset to Promotion</DialogTitle>
                                <DialogDescription>Link an asset specifically for this promotion period.</DialogDescription>
                            </DialogHeader>
                            <form action={addAssetToPromotion} className="space-y-4 pt-4">
                                <input type="hidden" name="promotionPeriodId" value={promotion.id} />
                                <div className="space-y-2">
                                    <Label htmlFor="name">Asset Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Social Media Banner" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="type">Type</Label>
                                    <Select name="type" required defaultValue="image">
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="image">Image</SelectItem>
                                            <SelectItem value="video">Video</SelectItem>
                                            <SelectItem value="document">Document</SelectItem>
                                            <SelectItem value="link">External Link</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="url">URL / Path</Label>
                                    <Input id="url" name="url" required placeholder="https://..." />
                                </div>
                                <Button type="submit" className="w-full">Add Asset</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {promotion.assets.map((asset) => (
                            <div key={asset.id} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-white rounded-md border">
                                        {asset.type === 'image' && <ImageIcon className="h-5 w-5 text-blue-500" />}
                                        {asset.type === 'video' && <Video className="h-5 w-5 text-red-500" />}
                                        {asset.type === 'document' && <FileText className="h-5 w-5 text-orange-500" />}
                                        {asset.type === 'link' && <LinkIcon className="h-5 w-5 text-slate-500" />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium truncate">{asset.name}</div>
                                        <div className="text-xs text-muted-foreground truncate">{asset.url}</div>
                                    </div>
                                </div>
                                <form action={deletePromotionAsset.bind(null, asset.id, promotion.id)}>
                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </form>
                            </div>
                        ))}
                        {promotion.assets.length === 0 && (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                No assets linked to this promotion yet.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Social Posts Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Social Media Posts</h2>
                    <Button asChild variant="outline" size="sm">
                        <Link href="/social/new"><Plus className="mr-2 h-4 w-4" /> Create Post</Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {promotion.posts.map((post) => (
                        <Card key={post.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-5 space-y-4">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="gap-1">
                                        {post.platform === 'Instagram' && <Instagram className="h-3 w-3" />}
                                        {post.platform === 'Facebook' && <Facebook className="h-3 w-3" />}
                                        {post.platform === 'LinkedIn' && <Linkedin className="h-3 w-3" />}
                                        {post.platform === 'Twitter' && <Twitter className="h-3 w-3" />}
                                        {post.platform}
                                    </Badge>
                                    <Badge variant={post.status === 'published' ? 'default' : 'outline'} className="text-[10px] h-5">
                                        {post.status}
                                    </Badge>
                                </div>
                                <div className="min-h-[3rem] text-sm text-slate-700 whitespace-pre-wrap line-clamp-3">
                                    {post.content}
                                </div>
                                <div className="text-xs text-slate-500">
                                    {post.scheduledDate ? format(post.scheduledDate, 'PPP p') : 'Unscheduled'}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {promotion.posts.length === 0 && (
                        <div className="col-span-full text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                            <p>No social posts linked to this promotion.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
