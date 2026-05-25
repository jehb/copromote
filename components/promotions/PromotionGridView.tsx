'use client'

import { formatDateUTC } from '@/lib/date-utils'
import { Calendar, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { deletePromotion } from '@/app/actions/promotions'

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

interface PromotionGridViewProps {
    promotions: Promotion[]
}

export function PromotionGridView({ promotions }: PromotionGridViewProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {promotions.map((promo) => {
                const now = new Date()
                const isActive = now >= promo.startDate && now <= promo.endDate
                const isUpcoming = now < promo.startDate
                const isPast = now > promo.endDate

                return (
                    <Card key={promo.id} className="hover:shadow-md transition-shadow group flex flex-col">
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                                <Badge variant={isActive ? "default" : (isUpcoming ? "outline" : "secondary")} className="mb-2">
                                    {isActive ? "Active Now" : (isUpcoming ? "Upcoming" : "Past")}
                                </Badge>
                            </div>
                            <CardTitle className="leading-snug">{promo.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col gap-4">
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>
                                    {formatDateUTC(promo.startDate, 'MMM d')} - {formatDateUTC(promo.endDate, 'MMM d, yyyy')}
                                </span>
                            </div>

                            <div className="mt-auto pt-4 border-t flex items-center justify-between">
                                <div className="text-xs text-muted-foreground flex gap-3">
                                    <span>{promo._count.posts} posts</span>
                                    <span>{promo._count.assets} assets</span>
                                </div>
                                <div className="flex gap-2">
                                    <form action={deletePromotion.bind(null, promo.id)}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" aria-label="Delete promotion">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </form>
                                    <Button asChild size="sm" variant="secondary" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Link href={`/promotions/${promo.id}`}>
                                            View <ArrowRight className="ml-1 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}

            {promotions.length === 0 && (
                <div className="col-span-full py-12 text-center bg-slate-50 border border-dashed rounded-lg">
                    <h3 className="text-lg font-medium text-slate-900">No promotions yet</h3>
                    <p className="text-slate-500 mb-4">Create your first promotion period to start organizing content.</p>
                    <Button asChild variant="outline">
                        <Link href="/promotions/new">Create Promotion</Link>
                    </Button>
                </div>
            )}
        </div>
    )
}
