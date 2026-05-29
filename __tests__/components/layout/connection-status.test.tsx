import { render, screen } from '@testing-library/react'
import { ConnectionStatus } from '@/components/layout/connection-status'
import { useOfflineSync } from '@/components/providers/offline-sync-provider'

// Mock the offline sync hook
jest.mock('@/components/providers/offline-sync-provider', () => ({
    useOfflineSync: jest.fn(),
}))

const mockUseOfflineSync = useOfflineSync as jest.MockedFunction<typeof useOfflineSync>

describe('ConnectionStatus Component', () => {
    it('should show online status when connected', () => {
        mockUseOfflineSync.mockReturnValue({
            isOnline: true,
            pendingCount: 0,
            isSyncing: false,
            addToQueue: jest.fn(),
        })

        const { container } = render(<ConnectionStatus />)
        expect(container).toBeEmptyDOMElement()
    })

    it('should show offline status when disconnected', () => {
        mockUseOfflineSync.mockReturnValue({
            isOnline: false,
            pendingCount: 0,
            isSyncing: false,
            addToQueue: jest.fn(),
        })

        render(<ConnectionStatus />)

        expect(screen.getByText('Working Offline')).toBeInTheDocument()
    })

    it('should show pending count when offline with queued items', () => {
        mockUseOfflineSync.mockReturnValue({
            isOnline: false,
            pendingCount: 3,
            isSyncing: false,
            addToQueue: jest.fn(),
        })

        render(<ConnectionStatus />)

        expect(screen.getByText(/3/)).toBeInTheDocument()
    })

    it('should show syncing status', () => {
        mockUseOfflineSync.mockReturnValue({
            isOnline: true,
            pendingCount: 2,
            isSyncing: true,
            addToQueue: jest.fn(),
        })

        render(<ConnectionStatus />)

        expect(screen.getByText(/Syncing/i)).toBeInTheDocument()
    })

    it('should not show pending count when online and queue is empty', () => {
        mockUseOfflineSync.mockReturnValue({
            isOnline: true,
            pendingCount: 0,
            isSyncing: false,
            addToQueue: jest.fn(),
        })

        render(<ConnectionStatus />)

        expect(screen.queryByText(/pending/i)).not.toBeInTheDocument()
    })
})
