'use client'

import { deleteEmailPlan } from '@/app/actions/email-plan'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function DeletePlanButton({ id }: { id: string }) {
    const [loading, setLoading] = useState(false)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this plan?')) return
        setLoading(true)
        try {
            await deleteEmailPlan(id)
        } catch (error) {
            console.error('Failed to delete plan:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-500 hover:text-red-500" onClick={handleDelete} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
    )
}
