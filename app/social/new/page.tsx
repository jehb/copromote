import { createSocialPost } from '@/app/actions/social'
import { getPromotionPeriods } from '@/app/actions/promotion-select'
import { getUsers, getEvents } from '@/app/actions/events'
import { SocialPostForm } from '@/components/social/social-post-form'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function NewPostPage() {
    const promotions = await getPromotionPeriods()
    const users = await getUsers()
    const events = await getEvents()

    return (
        <div className="p-8 max-w-2xl mx-auto space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/social" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
                <h1 className="text-3xl font-bold">New Post</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Post Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <SocialPostForm
                        promotions={promotions}
                        users={users}
                        events={events}
                        action={createSocialPost}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
