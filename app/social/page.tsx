import { getSocialPosts } from '@/app/actions/social'
import { getPromotions } from '@/app/actions/promotions'
import { getEvents } from '@/app/actions/events'
import { SocialClientPage } from '@/components/social/social-client-page'

export default async function SocialPage({
    searchParams
}: {
    searchParams: {
        platform?: string,
        view?: 'table' | 'grid',
        status?: string,
        startDate?: string,
        endDate?: string,
        promotionPeriodId?: string,
        eventId?: string
    }
}) {
    const params = await searchParams
    const {
        platform,
        view = 'table',
        status,
        startDate,
        endDate,
        promotionPeriodId,
        eventId
    } = params

    const [posts, promotions, events] = await Promise.all([
        getSocialPosts({
            platform,
            status,
            startDate,
            endDate,
            promotionPeriodId,
            eventId
        }),
        getPromotions(),
        getEvents()
    ])

    return (
        <SocialClientPage
            initialData={{ posts, promotions, events }}
            initialFilters={{
                platform,
                view: view as 'table' | 'grid',
                status,
                startDate,
                endDate,
                promotionPeriodId,
                eventId
            }}
        />
    )
}

