'use client'

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useRouter, useSearchParams } from 'next/navigation'

export function PageSizeSelector() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pageSize = searchParams.get('pageSize') || '10'

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        params.set('pageSize', value)
        params.set('page', '1') // Reset to page 1
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Rows per page</span>
            <Select value={pageSize} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[70px] h-8">
                    <SelectValue placeholder={pageSize} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )
}
