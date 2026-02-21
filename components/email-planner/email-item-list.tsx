'use client'

import { useState, useEffect } from 'react'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { EmailItemCard } from './email-item-card'
import { reorderEmailItems } from '@/app/actions/email-item'
import { startTransition } from 'react'
import { Product } from '@/app/actions/external-db'

interface Event {
    id: string
    title: string
    startTime: Date
}

interface EmailItem {
    id: string
    title: string
    description: string | null
    order: number
    events: Event[]
    products: { id: string, upc: string }[]
}

interface EmailItemListProps {
    items: EmailItem[]
    availableEvents: { id: string, title: string, startTime: Date }[]
    availableProducts: Product[]
}

export function EmailItemList({ items: initialItems, availableEvents, availableProducts }: EmailItemListProps) {
    // Local state for optimistic updates
    const [items, setItems] = useState(initialItems)

    // Sync with props when they change (e.g. from server revalidation)
    useEffect(() => {
        setItems(initialItems)
    }, [initialItems])

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id)
                const newIndex = items.findIndex((item) => item.id === over.id)

                const newItems = arrayMove(items, oldIndex, newIndex)

                // Calculate new orders
                const updates = newItems.map((item, index) => ({
                    id: item.id,
                    order: index,
                }))

                // Call server action
                startTransition(async () => {
                    await reorderEmailItems(updates)
                })

                return newItems
            })
        }
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
            >
                <div className="space-y-4">
                    {items.map((item) => (
                        <EmailItemCard
                            key={item.id}
                            item={item}
                            availableEvents={availableEvents}
                            availableProducts={availableProducts}
                            sortable={true}
                        />
                    ))}
                    {items.length === 0 && (
                        <div className="text-center p-8 border border-dashed rounded-lg text-stone-500">
                            No items yet. Add one to get started.
                        </div>
                    )}
                </div>
            </SortableContext>
        </DndContext>
    )
}
