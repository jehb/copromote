'use client'

import { LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'

export function ViewToggle() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const view = searchParams.get('view') || 'list'

    const setView = (newView: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('view', newView)
        router.push(`?${params.toString()}`)
    }

    return (
        <div className="flex items-center bg-muted p-1 rounded-lg">
            <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView('list')}
                title="List View"
            >
                <List className="h-4 w-4" />
            </Button>
            <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setView('grid')}
                title="Grid View"
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
        </div>
    )
}
