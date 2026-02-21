'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Pencil, Trash2, X, Plus, GripVertical } from 'lucide-react'
import { updateEmailItem, deleteEmailItem, addItemEvent, removeItemEvent } from '@/app/actions/email-item'
import { EventSelector } from './event-selector'
import { Loader2 } from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'
import { ProductSelector } from './product-selector'
import { Product } from '@/app/actions/external-db'
import { addItemProduct, removeItemProduct } from '@/app/actions/email-item'

interface Event {
    id: string
    title: string
    startTime: Date  // Changed from date to startTime to match Prisma Event model
}

interface EmailItem {
    id: string
    title: string
    description: string | null
    order: number
    events: Event[]
    products: { id: string, upc: string }[]
}

interface EmailItemCardProps {
    item: EmailItem
    availableEvents: { id: string, title: string, startTime: Date }[]
    availableProducts: Product[]
    sortable?: boolean
}

export function EmailItemCard({ item, availableEvents, availableProducts, sortable }: EmailItemCardProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: item.title,
        description: item.description || '',
    })

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: item.id, disabled: !sortable })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    // Normalize event dates for the selector
    const selectorEvents = availableEvents.map(e => ({
        id: e.id,
        title: e.title,
        date: e.startTime
    }))

    const handleUpdate = async () => {
        setLoading(true)
        try {
            await updateEmailItem(item.id, {
                title: formData.title,
                description: formData.description,
            })
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update item:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this item?')) return
        setLoading(true)
        try {
            await deleteEmailItem(item.id)
        } catch (error) {
            console.error('Failed to delete item:', error)
            setLoading(false)
        }
    }

    const handleAddEvent = async (eventId: string) => {
        try {
            await addItemEvent(item.id, eventId)
        } catch (error) {
            console.error('Failed to add event:', error)
        }
    }

    const handleRemoveEvent = async (eventId: string) => {
        try {
            await removeItemEvent(item.id, eventId)
        } catch (error) {
            console.error('Failed to remove event:', error)
        }
    }

    const handleAddProduct = async (upc: string) => {
        try {
            await addItemProduct(item.id, upc)
        } catch (error) {
            console.error('Failed to add product:', error)
        }
    }

    const handleRemoveProduct = async (upc: string) => {
        try {
            await removeItemProduct(item.id, upc)
        } catch (error) {
            console.error('Failed to remove product:', error)
        }
    }

    return (
        <div ref={setNodeRef} style={style}>
            <Card className="mb-4">
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        {isEditing ? (
                            <div className="w-full space-y-2">
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Item Title"
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                {sortable && (
                                    <button {...attributes} {...listeners} className="cursor-grab hover:text-stone-600 text-stone-400">
                                        <GripVertical className="h-5 w-5" />
                                    </button>
                                )}
                                <div className="flex flex-col">
                                    <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                                </div>
                            </div>
                        )}

                        <div className="flex space-x-1 ml-4">
                            {!isEditing && (
                                <>
                                    <Button size="icon" variant="ghost" onClick={() => setIsEditing(true)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="text-red-500" onClick={handleDelete}>
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </>
                            )}
                            {isEditing && (
                                <>
                                    <Button size="sm" onClick={handleUpdate} disabled={loading}>Save</Button>
                                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                </>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isEditing ? (
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description..."
                            className="mb-4"
                        />
                    ) : (
                        <p className="text-sm text-gray-500 mb-4 whitespace-pre-wrap">{item.description}</p>
                    )}

                    {(isEditing || item.events.length > 0) && (
                        <div className="space-y-2 mb-4">
                            <h4 className="text-sm font-semibold">Attached Events</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {item.events.map(event => (
                                    <Badge key={event.id} variant="secondary" className="flex items-center gap-1">
                                        <Link href={`/events/${event.id}`} className="hover:underline">
                                            {event.title}
                                        </Link>
                                        {isEditing && (
                                            <button
                                                onClick={() => handleRemoveEvent(event.id)}
                                                className="ml-1 hover:text-red-500"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </Badge>
                                ))}
                                {item.events.length === 0 && isEditing && <span className="text-xs text-stone-500">No events attached</span>}
                            </div>

                            {isEditing && (
                                <div className="w-[300px]">
                                    <EventSelector
                                        events={selectorEvents.filter(e => !item.events.find(ie => ie.id === e.id))}
                                        onSelect={handleAddEvent}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {(isEditing || (item.products && item.products.length > 0)) && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">Attached Products</h4>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {item.products?.map(prod => {
                                    const fullProduct = availableProducts.find(ap => ap.upc === prod.upc)
                                    return (
                                        <Badge key={prod.id} variant="outline" className="flex items-center gap-1 bg-blue-50/50">
                                            <Link href={`/product/${prod.upc}`} className="hover:underline truncate max-w-[200px]" title={fullProduct?.name || prod.upc}>
                                                {fullProduct ? `${fullProduct.brand} - ${fullProduct.name}` : prod.upc}
                                            </Link>
                                            {isEditing && (
                                                <button
                                                    onClick={() => handleRemoveProduct(prod.upc)}
                                                    className="ml-1 hover:text-red-500"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </Badge>
                                    )
                                })}
                                {(!item.products || item.products.length === 0) && isEditing && <span className="text-xs text-stone-500">No products attached</span>}
                            </div>

                            {isEditing && (
                                <div className="w-[300px]">
                                    <ProductSelector
                                        availableProducts={item.products?.map(p => availableProducts.find(ap => ap.upc === p.upc)).filter(Boolean) as Product[]}
                                        onSelect={handleAddProduct}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
