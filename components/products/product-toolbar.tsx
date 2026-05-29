'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/lib/hooks/use-debounce'

export function ProductToolbar() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialSearch = searchParams.get('search') || ''
    const [search, setSearch] = useState(initialSearch)
    const debouncedSearch = useDebounce(search, 500)

    useEffect(() => {
        const currentSearch = searchParams.get('search') || ''
        if (debouncedSearch === currentSearch) return

        const params = new URLSearchParams(searchParams)
        if (debouncedSearch) {
            params.set('search', debouncedSearch)
        } else {
            params.delete('search')
        }
        // Reset to page 1 on new search
        params.set('page', '1')

        router.push(`?${params.toString()}`)
    }, [debouncedSearch, router, searchParams])

    return (
        <div className="flex gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search products..."
                    className="pl-10 bg-white"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
            </Button>
        </div>
    )
}
