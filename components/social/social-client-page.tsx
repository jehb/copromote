'use client'

import { useQuery } from '@tanstack/react-query'
import { getSocialPosts, deleteSocialPost } from '@/app/actions/social'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import Link from 'next/link'
import { Plus, Trash2, Instagram, Facebook, Linkedin, Twitter, MessageSquare, LayoutGrid, List, Loader2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/page-header'
import { SocialTable } from '@/components/social/social-table'
import { SocialFilterBar } from '@/components/social/social-filter-bar'
import { useState, useMemo } from 'react'

interface SocialClientPageProps {
    initialData: {
        posts: any[]
        promotions: any[]
        events: any[]
    }
    initialFilters: {
        platform?: string
        view: 'table' | 'grid'
        status?: string
        startDate?: string
        endDate?: string
        promotionPeriodId?: string
        eventId?: string
    }
}

export function SocialClientPage({ initialData, initialFilters }: SocialClientPageProps) {
    const [view, setView] = useState<'table' | 'grid'>(initialFilters.view || 'table')
    const [platform, setPlatform] = useState(initialFilters.platform || 'all')

    const { data: posts = initialData.posts, isLoading } = useQuery({
        queryKey: ['social-posts', { ...initialFilters, platform }],
        queryFn: () => getSocialPosts({ ...initialFilters, platform: platform === 'all' ? undefined : platform }),
        initialData: initialData.posts,
    })

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 h-full flex flex-col w-full">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <MessageSquare className="h-6 w-6" />
                        Social Media
                    </span>
                }
                description="Manage your social content pipeline"
                actions={
                    <>
                        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-sm">
                            <Button
                                variant={view === 'table' ? 'secondary' : 'ghost'}
                                size="sm"
                                className={`h-8 w-8 p-0 rounded-lg transition-all ${view === 'table' ? 'bg-white shadow-sm' : ''}`}
                                onClick={() => setView('table')}
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={view === 'grid' ? 'secondary' : 'ghost'}
                                size="sm"
                                className={`h-8 w-8 p-0 rounded-lg transition-all ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}
                                onClick={() => setView('grid')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                            <Link href="/social/new">
                                <Plus className="h-4 w-4 md:mr-2" />
                                <span className="hidden md:inline">Create Post</span>
                            </Link>
                        </Button>
                    </>
                }
            />

            <div className="flex gap-2 pb-4 border-b border-slate-100 overflow-x-auto pb-4 scrollbar-hide">
                {['all', 'Instagram', 'Facebook', 'LinkedIn', 'Twitter'].map((p) => (
                    <Badge
                        key={p}
                        variant={platform === p ? 'default' : 'outline'}
                        className={`cursor-pointer px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-wider transition-all hover:scale-105 active:scale-95 ${platform === p ? 'bg-slate-900 border-transparent shadow-md' : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                        onClick={() => setPlatform(p)}
                    >
                        {p}
                    </Badge>
                ))}
            </div>

            <SocialFilterBar promotions={initialData.promotions} events={initialData.events} />

            {isLoading && posts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                </div>
            ) : view === 'table' ? (
                <SocialTable posts={posts} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map((post: any) => (
                        <Card key={post.id} className="hover:shadow-xl transition-all relative group overflow-hidden border-slate-200 shadow-sm rounded-2xl bg-white">
                            <Link href={`/social/${post.id}`} className="absolute inset-0 z-0">
                                <span className="sr-only">View Post</span>
                            </Link>

                            {(post.photos && post.photos.length > 0) && (
                                <div className="h-48 w-full overflow-hidden border-b bg-slate-50 relative z-10">
                                    <img
                                        src={post.photos[0].url}
                                        alt={post.photos[0].name || 'Post preview'}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    {post.photos.length > 1 && (
                                        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md border border-white/20 shadow-lg">
                                            +{post.photos.length - 1} more
                                        </div>
                                    )}
                                </div>
                            )}

                            <CardContent className="p-6 space-y-4 relative z-10 pointer-events-none">
                                <div className="flex justify-between items-start pointer-events-auto">
                                    <Badge variant="secondary" className="gap-2 bg-slate-100 hover:bg-slate-200 border-none px-3 py-1 font-bold text-[10px] text-slate-700">
                                        {post.platform === 'Instagram' && <Instagram className="h-3 w-3 text-pink-600" />}
                                        {post.platform === 'Facebook' && <Facebook className="h-3 w-3 text-blue-600" />}
                                        {post.platform === 'LinkedIn' && <Linkedin className="h-3 w-3 text-blue-800" />}
                                        {post.platform === 'Twitter' && <Twitter className="h-3 w-3 text-sky-500" />}
                                        {post.platform}
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full pointer-events-auto"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            if (confirm('Delete this post?')) {
                                                deleteSocialPost(post.id)
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                <div className="min-h-[4rem] text-[13px] text-slate-600 whitespace-pre-wrap line-clamp-3 font-medium leading-relaxed">
                                    {post.content}
                                </div>

                                {post.promotionPeriod && (
                                    <div className="pointer-events-auto relative z-20 w-fit">
                                        <Link href={`/promotions/${post.promotionPeriod.id}`} className="block">
                                            <div className="text-[10px] bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg border border-indigo-100 font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all shadow-sm">
                                                Promo: {post.promotionPeriod.name}
                                            </div>
                                        </Link>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-1.5">
                                    {post.tags.map((tag: any) => (
                                        <span key={tag.id} className="text-[10px] font-bold text-blue-600 bg-blue-50/50 px-2.5 py-1 rounded-lg border border-blue-100/50 hover:bg-blue-100 transition-colors">#{tag.name}</span>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-slate-50 text-[11px] text-slate-400 flex justify-between items-center font-bold uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                        {post.scheduledDate ? format(new Date(post.scheduledDate), 'MMM d, yyyy') : 'Queue'}
                                    </div>
                                    <Badge
                                        variant={post.status === 'published' ? 'default' : 'outline'}
                                        className={`text-[9px] h-5 capitalize px-2 font-black ${post.status === 'published' ? 'bg-emerald-500 hover:bg-emerald-600' : 'text-slate-500 border-slate-200'
                                            }`}
                                    >
                                        {post.status.replace(/-/g, ' ')}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {posts.length === 0 && !isLoading && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-slate-100">
                                <MessageSquare className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No posts in target pipeline</h3>
                            <p className="text-slate-500 text-sm mb-6">Start planning your social reach today.</p>
                            <Button asChild className="bg-blue-600 hover:bg-blue-700 h-10 px-6 rounded-xl font-bold">
                                <Link href="/social/new">Create First Post</Link>
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
