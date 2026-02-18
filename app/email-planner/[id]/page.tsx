import { notFound } from 'next/navigation'
import { getEmailPlan } from '@/app/actions/email-plan'
import { EmailPlanForm } from '@/components/email-planner/email-plan-form'
import { EmailItemList } from '@/components/email-planner/email-item-list'
import { getCalendarEvents } from '@/app/actions/calendar'
import { Button } from '@/components/ui/button'
import { createEmailItem } from '@/app/actions/email-item'
import { Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'

export default async function EmailPlanDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const { data: plan, success } = await getEmailPlan(id)

    if (!success || !plan) {
        notFound()
    }

    // Fetch all events for the selector
    // We need to fetch 'Event' model, not the transformed calendar events, 
    // because the relation is on Event model.
    // Although getCalendarEvents gives us a nice list, relation is strict.
    // But wait, the previous code in calendar.ts returns { id, title, type, date } 
    // where id might be modified (e.g. _start).
    // We need real Event relations.
    // So we should fetch prisma.event.findMany() directly here or create a new action.
    // Using prisma directly in server component is fine.

    const events = await prisma.event.findMany({
        select: {
            id: true,
            title: true,
            startTime: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    })

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <section>
                    <EmailPlanForm
                        initialData={{
                            id: plan.id,
                            subject: plan.subject,
                            sendDate: plan.sendDate,
                            notes: plan.notes,
                        }}
                    />
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Email Items</h2>
                        <form action={async () => {
                            'use server'
                            await createEmailItem(plan.id, {
                                title: 'New Item',
                                description: '',
                                order: plan.items.length,
                            })
                        }}>
                            <Button type="submit" size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-4">
                        <EmailItemList items={plan.items} availableEvents={events} />
                    </div>
                </section>
            </div>
        </div>
    )
}
