'use client'

import { formatDateUTC } from '@/lib/date-utils'
import { Calendar, Trash2, ArrowRight, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { deletePromotion } from '@/app/actions/promotions'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Promotion {
    id: string
    name: string
    startDate: Date
    endDate: Date
    _count: {
        posts: number
        assets: number
    }
}

interface PromotionListViewProps {
    promotions: Promotion[]
}

export function PromotionListView({ promotions }: PromotionListViewProps) {
    if (promotions.length === 0) {
        return (
            <div className="py-12 text-center bg-slate-50 border border-dashed rounded-lg">
                <h3 className="text-lg font-medium text-slate-900">No promotions yet</h3>
                <p className="text-slate-500 mb-4">Create your first promotion period to start organizing content.</p>
                <Button asChild variant="outline">
                    <Link href="/promotions/new">Create Promotion</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[300px]">Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead className="text-right">Content</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {promotions.map((promo) => {
                        const now = new Date()
                        const isActive = now >= promo.startDate && now <= promo.endDate
                        const isUpcoming = now < promo.startDate
                        const isPast = now > promo.endDate

                        return (
                            <TableRow key={promo.id}>
                                <TableCell className="font-medium">
                                    <Link href={`/promotions/${promo.id}`} className="hover:underline">
                                        {promo.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={isActive ? "default" : (isUpcoming ? "outline" : "secondary")}>
                                        {isActive ? "Active Now" : (isUpcoming ? "Upcoming" : "Past")}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {formatDateUTC(promo.startDate, 'MMM d')} - {formatDateUTC(promo.endDate, 'MMM d, yyyy')}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="text-xs text-muted-foreground">
                                        {promo._count.posts} posts, {promo._count.assets} assets
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <form action={deletePromotion.bind(null, promo.id)}>
                                            <Button variant="ghost" size="icon" aria-label="Delete Promotion" className="h-8 w-8 text-muted-foreground hover:text-red-500">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </form>
                                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0">
                                            <Link href={`/promotions/${promo.id}`}>
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
