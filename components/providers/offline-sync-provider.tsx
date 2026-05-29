'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { get, set } from 'idb-keyval'

// Define the shape of a pending mutation
export interface PendingMutation {
    id: string
    actionName: string
    payload: any
    timestamp: number
}

interface OfflineSyncContextType {
    isOnline: boolean
    pendingCount: number
    isSyncing: boolean
    addToQueue: (mutation: Omit<PendingMutation, 'timestamp' | 'id'>) => Promise<string>
}

const OfflineSyncContext = createContext<OfflineSyncContextType | undefined>(undefined)

const QUEUE_KEY = 'copromote-offline-queue'

export function OfflineSyncProvider({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState(true)
    const [isSyncing] = useState(false)
    const [queue, setQueue] = useState<PendingMutation[]>([])

    // Load queue from IndexedDB on mount
    useEffect(() => {
        const loadQueue = async () => {
            const storedQueue = await get<PendingMutation[]>(QUEUE_KEY)
            if (storedQueue) setQueue(storedQueue)
        }
        loadQueue()

        setIsOnline(navigator.onLine)

        const handleOnline = () => setIsOnline(true)
        const handleOffline = () => setIsOnline(false)

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    const addToQueue = async (m: Omit<PendingMutation, 'timestamp' | 'id'>) => {
        const newMutation: PendingMutation = {
            ...m,
            id: crypto.randomUUID(),
            timestamp: Date.now()
        }

        const currentQueue = (await get<PendingMutation[]>(QUEUE_KEY)) || []
        const updatedQueue = [...currentQueue, newMutation]

        await set(QUEUE_KEY, updatedQueue)
        setQueue(updatedQueue)

        return newMutation.id
    }

    return (
        <OfflineSyncContext.Provider value={{
            isOnline,
            pendingCount: queue.length,
            isSyncing,
            addToQueue
        }}>
            {children}
        </OfflineSyncContext.Provider>
    )
}

export const useOfflineSync = () => {
    const context = useContext(OfflineSyncContext)
    if (!context) throw new Error('useOfflineSync must be used within OfflineSyncProvider')
    return context
}
