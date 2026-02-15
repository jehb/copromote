'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import { useState, useEffect } from 'react'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 0,
            refetchOnWindowFocus: false,
        },
    },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [isPersisted, setIsPersisted] = useState(false)

    useEffect(() => {
        const persister = createAsyncStoragePersister({
            storage: {
                getItem: (key) => get(key),
                setItem: (key, value) => set(key, value),
                removeItem: (key) => del(key),
            },
            serialize: (data) => JSON.stringify(data),
            deserialize: (data) => {
                try {
                    return JSON.parse(data as string)
                } catch (error) {
                    console.warn('Failed to parse cached data, clearing cache:', error)
                    return null
                }
            },
        })

        const persist = async () => {
            try {
                await persistQueryClient({
                    queryClient,
                    persister,
                    maxAge: 1000 * 60 * 60 * 24, // 24 hours
                })
                setIsPersisted(true)
            } catch (error) {
                console.error('Failed to persist query client:', error)
                setIsPersisted(true)
            }
        }

        persist()
    }, [])

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
