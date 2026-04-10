export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getEmailPlans } from '@/app/actions/email-plan'
import { Button } from '@/components/ui/button'

import { Plus, Mail } from 'lucide-react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { EmailPlannerTable } from './email-planner-table'

export default async function EmailPlannerPage() {
    const { data: plans } = await getEmailPlans()

    return (
        <ProtectedRoute pageName="email-planner">
            <div className="p-4 md:p-8 space-y-4 md:space-y-8 h-full flex flex-col w-full">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3 border-b pb-4 w-full justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="h-8 w-8 text-neutral-500" />
                            <h1 className="text-2xl font-bold tracking-tight text-neutral-800">Email Planner</h1>
                        </div>
                        <Link href="/email-planner/new">
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Plan
                            </Button>
                        </Link>
                    </div>
                </div>

                <EmailPlannerTable plans={plans || []} />
            </div>
        </ProtectedRoute>
    )
}
