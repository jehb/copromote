'use client'

import { useState } from 'react'
import { ProductSelector } from '@/components/email-planner/product-selector'
import { assignProductTagToPhoto } from '@/app/actions/photos'
import { toast } from 'sonner'
import { Loader2, Package } from 'lucide-react'

interface ProductTagAssignerProps {
    photoId: string
    existingUpcs: string[]
}

export function ProductTagAssigner({ photoId, existingUpcs }: ProductTagAssignerProps) {
    const [isAssigning, setIsAssigning] = useState(false)

    async function handleSelect(upc: string) {
        setIsAssigning(true)
        try {
            await assignProductTagToPhoto(photoId, upc)
            toast.success(`Successfully linked product UPC ${upc} to this photo.`)
        } catch (error: any) {
            toast.error(error.message || 'There was a problem tagging this photo.')
        } finally {
            setIsAssigning(false)
        }
    }

    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" /> Link a Product
            </div>

            <div className="relative">
                <ProductSelector
                    selectedUpcs={existingUpcs}
                    onSelect={handleSelect}
                    disabled={isAssigning}
                />

                {isAssigning && (
                    <div className="absolute inset-y-0 right-10 flex items-center pointer-events-none">
                        <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                )}
            </div>
            {existingUpcs.length > 0 && (
                <div className="text-xs text-slate-500 mt-2">
                    Already linked: {existingUpcs.join(', ')}
                </div>
            )}
        </div>
    )
}
