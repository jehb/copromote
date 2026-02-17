export const dynamic = "force-dynamic"
import { getPromotions } from '@/app/actions/promotions'
import { Button } from '@/components/ui/button'
import { Plus, Megaphone } from 'lucide-react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/page-header'
import { PromotionGridView } from '@/components/promotions/PromotionGridView'
import { PromotionListView } from '@/components/promotions/PromotionListView'
import { ViewToggle } from '@/components/promotions/ViewToggle'

export default async function PromotionsPage({
    searchParams,
}: {
    searchParams: Promise<{ view?: string }>
}) {
    const { view = 'list' } = await searchParams
    const promotions = await getPromotions()

    return (
        <div className="p-8 space-y-8">
            <PageHeader
                title={
                    <span className="flex items-center gap-2">
                        <Megaphone className="h-6 w-6" />
                        Promotions
                    </span>
                }
                description="Manage marketing campaigns and seasonal events."
                actions={
                    <div className="flex items-center gap-4">
                        <ViewToggle />
                        <Button asChild>
                            <Link href="/promotions/new">
                                <Plus className="mr-2 h-4 w-4" /> New Promotion
                            </Link>
                        </Button>
                    </div>
                }
            />

            {view === 'grid' ? (
                <PromotionGridView promotions={promotions} />
            ) : (
                <PromotionListView promotions={promotions} />
            )}
        </div>
    )
}
