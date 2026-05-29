'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Calendar, Mail, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { DeletePlanButton } from './delete-plan-button'

type SortKey = 'date' | 'subject' | 'items' | 'notes'
type SortDir = 'asc' | 'desc'

export function EmailPlannerTable({ plans }: { plans: any[] }) {
    const [sortKey, setSortKey] = useState<SortKey>('date')
    const [sortDir, setSortDir] = useState<SortDir>('desc')

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortDir(key === 'date' ? 'desc' : 'asc')
        }
    }

    const sortedPlans = [...(plans || [])].sort((a, b) => {
        let valA
        let valB
        
        switch (sortKey) {
            case 'date':
                valA = new Date(a.sendDate).getTime()
                valB = new Date(b.sendDate).getTime()
                break
            case 'subject':
                valA = a.subject?.toLowerCase() || ''
                valB = b.subject?.toLowerCase() || ''
                break
            case 'items':
                valA = a._count?.items || 0
                valB = b._count?.items || 0
                break
            case 'notes':
                valA = a.notes?.toLowerCase() || ''
                valB = b.notes?.toLowerCase() || ''
                break
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
    })

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortKey !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4 text-stone-300" />
        return sortDir === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
    }

    return (
        <div className="border rounded-md bg-white">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="cursor-pointer select-none whitespace-nowrap hover:bg-stone-50" onClick={() => toggleSort('date')}>
                            <div className="flex items-center">Planned Send Date <SortIcon columnKey="date" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none whitespace-nowrap hover:bg-stone-50" onClick={() => toggleSort('subject')}>
                            <div className="flex items-center">Subject <SortIcon columnKey="subject" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none whitespace-nowrap hover:bg-stone-50" onClick={() => toggleSort('items')}>
                            <div className="flex items-center">Items <SortIcon columnKey="items" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer select-none whitespace-nowrap hover:bg-stone-50" onClick={() => toggleSort('notes')}>
                            <div className="flex items-center">Notes <SortIcon columnKey="notes" /></div>
                        </TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedPlans.map((plan) => (
                        <TableRow key={plan.id}>
                            <TableCell>
                                <div className="flex items-center text-sm font-medium">
                                    <Calendar className="mr-2 h-4 w-4 text-stone-500" />
                                    {new Date(plan.sendDate).toLocaleDateString(undefined, { timeZone: 'UTC' })}
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
                                    {plan._count?.items || 0}
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
                    {sortedPlans.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No email plans found. Create one to get started.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    )
}
