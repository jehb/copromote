'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Change Password Page Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-slate-50">
            <div className="p-6 bg-white rounded-lg shadow-lg max-w-md w-full text-center space-y-4">
                <h2 className="text-xl font-bold text-red-600">Something went wrong!</h2>
                <p className="text-sm text-slate-600 font-mono bg-slate-100 p-2 rounded overflow-auto text-left">
                    {error.message || 'Unknown error occcured'}
                </p>
                <div className="pt-2">
                    <Button
                        onClick={() => reset()}
                        variant="outline"
                    >
                        Try again
                    </Button>
                </div>
            </div>
        </div>
    )
}
