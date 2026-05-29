import { render, screen, act, waitFor } from '@testing-library/react'
import { OfflineSyncProvider, useOfflineSync } from '@/components/providers/offline-sync-provider'
import { get, set } from 'idb-keyval'
import userEvent from '@testing-library/user-event'

jest.mock('idb-keyval', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined)
}))

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
    value: {
        randomUUID: () => 'test-uuid-123'
    }
})

const TestComponent = () => {
    const { isOnline, pendingCount, addToQueue } = useOfflineSync()
    
    return (
        <div>
            <div data-testid="is-online">{isOnline ? 'Online' : 'Offline'}</div>
            <div data-testid="pending-count">{pendingCount}</div>
            <button onClick={() => addToQueue({ actionName: 'testAction', payload: { foo: 'bar' } })}>
                Add to queue
            </button>
        </div>
    )
}

describe('OfflineSyncProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        // Reset navigator.onLine mock
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    })

    it('throws error if useOfflineSync is used outside provider', () => {
        // Prevent console.error from polluting test output
        jest.spyOn(console, 'error').mockImplementation(() => {})
        expect(() => render(<TestComponent />)).toThrow('useOfflineSync must be used within OfflineSyncProvider')
        jest.restoreAllMocks()
    })

    it('initializes with online state and empty queue', async () => {
        render(
            <OfflineSyncProvider>
                <TestComponent />
            </OfflineSyncProvider>
        )
        
        await waitFor(() => {
            expect(screen.getByTestId('is-online')).toHaveTextContent('Online')
            expect(screen.getByTestId('pending-count')).toHaveTextContent('0')
        })
    })

    it('loads queue from idb on mount', async () => {
        const mockQueue = [
            { id: '1', actionName: 'a', payload: {}, timestamp: 123 }
        ]
        ;(get as jest.Mock).mockResolvedValueOnce(mockQueue)
        
        render(
            <OfflineSyncProvider>
                <TestComponent />
            </OfflineSyncProvider>
        )
        
        await waitFor(() => {
            expect(screen.getByTestId('pending-count')).toHaveTextContent('1')
        })
    })

    it('updates online state when window events fire', async () => {
        render(
            <OfflineSyncProvider>
                <TestComponent />
            </OfflineSyncProvider>
        )
        
        expect(screen.getByTestId('is-online')).toHaveTextContent('Online')
        
        act(() => {
            window.dispatchEvent(new Event('offline'))
        })
        expect(screen.getByTestId('is-online')).toHaveTextContent('Offline')
        
        act(() => {
            window.dispatchEvent(new Event('online'))
        })
        expect(screen.getByTestId('is-online')).toHaveTextContent('Online')
    })

    it('adds item to queue and persists to idb', async () => {
        const user = userEvent.setup()
        
        render(
            <OfflineSyncProvider>
                <TestComponent />
            </OfflineSyncProvider>
        )
        
        await user.click(screen.getByText('Add to queue'))
        
        await waitFor(() => {
            expect(screen.getByTestId('pending-count')).toHaveTextContent('1')
            expect(set).toHaveBeenCalledWith('copromote-offline-queue', [
                expect.objectContaining({
                    id: 'test-uuid-123',
                    actionName: 'testAction',
                    payload: { foo: 'bar' },
                    timestamp: expect.any(Number)
                })
            ])
        })
    })
})
