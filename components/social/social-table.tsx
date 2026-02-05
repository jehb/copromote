'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Instagram, Facebook, Linkedin, Twitter, MessageSquare, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { deleteSocialPost } from "@/app/actions/social"
import { useRouter } from "next/navigation"

interface SocialTableProps {
    posts: any[]
}

export function SocialTable({ posts }: SocialTableProps) {
    const router = useRouter()
    if (posts.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                <MessageSquare className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <h3 className="text-lg font-medium text-slate-900">No posts yet</h3>
                <p className="text-slate-500">Create your first social media post to get started.</p>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50/50">
                        <TableHead className="w-[150px]">Platform</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Scheduled</TableHead>
                        <TableHead>Promotion</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {posts.map((post) => (
                        <TableRow
                            key={post.id}
                            className="group cursor-pointer hover:bg-slate-50/50"
                            onClick={() => router.push(`/social/${post.id}`)}
                        >
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                    {post.platform === 'Instagram' && <Instagram className="h-4 w-4 text-pink-600" />}
                                    {post.platform === 'Facebook' && <Facebook className="h-4 w-4 text-blue-600" />}
                                    {post.platform === 'LinkedIn' && <Linkedin className="h-4 w-4 text-blue-800" />}
                                    {post.platform === 'Twitter' && <Twitter className="h-4 w-4 text-slate-900" />}
                                    {post.platform}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-[300px] truncate text-slate-600" title={post.content}>
                                    {post.content}
                                </div>
                                <div className="flex gap-1 mt-1">
                                    {post.tags.slice(0, 2).map((tag: any) => (
                                        <span key={tag.id} className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                            #{tag.name}
                                        </span>
                                    ))}
                                    {post.tags.length > 2 && <span className="text-[10px] text-slate-400">+{post.tags.length - 2} more</span>}
                                </div>
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                                {post.scheduledDate ? (
                                    <div className="flex flex-col">
                                        <span>{format(new Date(post.scheduledDate), 'MMM d, yyyy')}</span>
                                        <span className="text-[10px] text-muted-foreground">{format(new Date(post.scheduledDate), 'h:mm a')}</span>
                                    </div>
                                ) : (
                                    <span className="text-slate-400 italic">Unscheduled</span>
                                )}
                            </TableCell>
                            <TableCell>
                                {post.promotionPeriod ? (
                                    <Link
                                        href={`/promotions/${post.promotionPeriod.id}`}
                                        className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 hover:bg-purple-100 transition-colors inline-block max-w-[120px] truncate"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {post.promotionPeriod.name}
                                    </Link>
                                ) : (
                                    <span className="text-slate-300">-</span>
                                )}
                            </TableCell>
                            <TableCell>
                                <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="capitalize text-[10px] py-0 h-5">
                                    {post.status.replace(/-/g, ' ')}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                        <Link href={`/social/${post.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <form action={deleteSocialPost.bind(null, post.id)} onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" type="submit">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
