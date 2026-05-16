import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'
import React from 'react'

jest.mock('@/components/providers/offline-sync-provider', () => ({
  useOfflineSync: jest.fn()
}))

describe('useOfflineMutation', () => {
    let queryClient: QueryClient
    let wrapper: React.FC<{children: React.ReactNode}>
    let mockAddToQueue: jest.Mock
    let mockMutationFn: jest.Mock
    let originalNavigatorOnLine: boolean

    beforeAll(() => {
        originalNavigatorOnLine = navigator.onLine
    })

    afterAll(() => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: originalNavigatorOnLine
        })
    })

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: {
                queries: { retry: false },
                mutations: { retry: false }
            }
        })
        wrapper = ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        )

        mockAddToQueue = jest.fn().mockResolvedValue('test-id')
        mockMutationFn = jest.fn().mockResolvedValue({ success: true })

        ;(useOfflineSync as jest.Mock).mockReturnValue({
            addToQueue: mockAddToQueue,
            isOnline: true,
            isSyncing: false,
            pendingCount: 0
        })

        jest.spyOn(console, 'log').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.clearAllMocks()
        queryClient.clear()
        ;(console.log as jest.Mock).mockRestore()
    })

    const setOnline = (isOnline: boolean) => {
        Object.defineProperty(navigator, 'onLine', {
            configurable: true,
            value: isOnline
        })
    }

    const defaultOptions = {
        actionName: 'testAction',
        queryKey: ['testKey']
    }

    it('should execute mutation directly when online', async () => {
        setOnline(true)

        const { result } = renderHook(() => useOfflineMutation(mockMutationFn, defaultOptions), { wrapper })

        await act(async () => {
            await result.current.mutateAsync({ test: 'data' })
        })

        expect(mockMutationFn).toHaveBeenCalledWith({ test: 'data' })
        expect(mockAddToQueue).not.toHaveBeenCalled()
    })

    it('should queue mutation when offline', async () => {
        setOnline(false)

        const { result } = renderHook(() => useOfflineMutation(mockMutationFn, defaultOptions), { wrapper })

        let mutationResult: any;
        await act(async () => {
            mutationResult = await result.current.mutateAsync({ test: 'data' })
        })

        expect(mockMutationFn).not.toHaveBeenCalled()
        expect(mockAddToQueue).toHaveBeenCalledWith({
            actionName: 'testAction',
            payload: { test: 'data' }
        })
        expect(mutationResult).toEqual({ offline: true })
    })

    it('should perform optimistic update and rollback on error', async () => {
        setOnline(true)

        // Setup initial data
        queryClient.setQueryData(defaultOptions.queryKey, { data: 'initial' })

        const optimisticUpdate = jest.fn((old, variables) => ({ data: 'optimistic' }))
        const onError = jest.fn()

        mockMutationFn.mockRejectedValueOnce(new Error('Mutation failed'))

        const options = {
            ...defaultOptions,
            optimisticUpdate,
            onError
        }

        const { result } = renderHook(() => useOfflineMutation(mockMutationFn, options), { wrapper })

        try {
            await act(async () => {
                await result.current.mutateAsync({ test: 'data' })
            })
        } catch (e) {
            // expected error
        }

        // Verify optimistic update was called
        expect(optimisticUpdate).toHaveBeenCalledWith({ data: 'initial' }, { test: 'data' })

        // Verify onError callback was called
        expect(onError).toHaveBeenCalledWith(expect.any(Error))

        // Verify rollback happened - data should be back to 'initial'
        expect(queryClient.getQueryData(defaultOptions.queryKey)).toEqual({ data: 'initial' })
    })

    it('should call onSuccess and invalidate queries when online execution succeeds', async () => {
        setOnline(true)

        const onSuccess = jest.fn()
        const options = {
            ...defaultOptions,
            onSuccess
        }

        const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

        const { result } = renderHook(() => useOfflineMutation(mockMutationFn, options), { wrapper })

        await act(async () => {
            await result.current.mutateAsync({ test: 'data' })
        })

        // Verify onSuccess called
        expect(onSuccess).toHaveBeenCalledWith({ success: true })

        // Verify invalidate queries was called
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({ queryKey: defaultOptions.queryKey })
    })

    it('should log notification and not invalidate queries when offline queueing succeeds', async () => {
        setOnline(false)

        const onSuccess = jest.fn()
        const options = {
            ...defaultOptions,
            onSuccess
        }

        const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries')

        const { result } = renderHook(() => useOfflineMutation(mockMutationFn, options), { wrapper })

        await act(async () => {
            await result.current.mutateAsync({ test: 'data' })
        })

        // Verify custom onSuccess not called for offline queueing
        expect(onSuccess).not.toHaveBeenCalled()

        // Verify invalidate queries was NOT called
        expect(invalidateQueriesSpy).not.toHaveBeenCalled()
    })
})
