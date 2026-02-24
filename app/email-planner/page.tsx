export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getEmailPlans, deleteEmailPlan } from '@/app/actions/email-plan'
import { Button } from '@/components/ui/button'

import { Plus, Calendar, Mail } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DeletePlanButton } from './delete-plan-button'
import { ProtectedRoute } from '@/components/layout/protected-route'

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

                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Subject</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Notes</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans?.map((plan) => (
                                <TableRow key={plan.id}>
                                    <TableCell>
                                        <div className="flex items-center text-sm font-medium">
                                            <Calendar className="mr-2 h-4 w-4 text-stone-500" />
                                            {new Date(plan.sendDate).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/email-planner/${plan.id}`} className="hover:underline font-medium">
                                            {plan.subject}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center text-sm text-stone-500">
                                            <Mail className="mr-2 h-4 w-4" />
                                            {plan._count.items}
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[300px] truncate text-stone-500">
                                        {plan.notes || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <DeletePlanButton id={plan.id} />
                                    </TableCell>
                                </TableRow>
                            ))}
                            {plans?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No email plans found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </ProtectedRoute>
    )
}
