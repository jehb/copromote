'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'

interface OfflineMutationOptions {
    actionName: string
    queryKey: any[]
    onSuccess?: (data: any) => void
    onError?: (error: any) => void
    optimisticUpdate?: (oldData: any, variables: any) => any
}

/**
 * useOfflineMutation
 * 
 * A wrapper around TanStack Query's useMutation that automatically
 * queues actions if the user is offline.
 */
export function useOfflineMutation(mutationFn: (variables: any) => Promise<any>, options: OfflineMutationOptions) {
    const queryClient = useQueryClient()
    const { addToQueue } = useOfflineSync()

    return useMutation({
        mutationFn: async (variables: any) => {
            if (!navigator.onLine) {
                // If offline, add to the persistent sync queue
                await addToQueue({
                    actionName: options.actionName,
                    payload: variables
                })
                return { offline: true }
            }
            // If online, execute the server action directly
            return mutationFn(variables)
        },
        onMutate: async (variables) => {
            // 1. Cancel outgoing refetches
            await queryClient.cancelQueries({ queryKey: options.queryKey })

            // 2. Snapshot the previous value
            const previousData = queryClient.getQueryData(options.queryKey)

            // 3. Optimistically update the cache
            if (options.optimisticUpdate) {
                queryClient.setQueryData(options.queryKey, (old: any) =>
                    options.optimisticUpdate!(old, variables)
                )
            }

            return { previousData }
        },
        onError: (err, variables, context) => {
            // Rollback on error
            if (context?.previousData) {
                queryClient.setQueryData(options.queryKey, context.previousData)
            }
            if (options.onError) options.onError(err)
        },
        onSuccess: (data) => {
            // Notification of offline queueing vs online success
            if (data?.offline) {
                console.log(`[OfflineSync] Queued ${options.actionName}`)
            } else if (options.onSuccess) {
                options.onSuccess(data)
            }
        },
        onSettled: (data) => {
            // If it was an online success, invalidate.
            // If offline, we keep the optimistic data as "truth" until sync.
            if (!data?.offline) {
                queryClient.invalidateQueries({ queryKey: options.queryKey })
            }
        }
    })
}
