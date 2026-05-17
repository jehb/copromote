import { render, screen, act, waitFor } from '@testing-library/react'
import { QueryProvider } from '@/components/providers/query-provider'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { useQuery } from '@tanstack/react-query'

jest.mock('idb-keyval', () => ({
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('@tanstack/react-query-persist-client', () => ({
    persistQueryClient: jest.fn().mockResolvedValue(undefined)
}))

const TestComponent = () => {
    const { data } = useQuery({ queryKey: ['test'], queryFn: () => 'test data' })
    return <div data-testid="test-data">{data}</div>
}

describe('QueryProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => {})
        jest.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
        jest.restoreAllMocks()
    })

    it('renders children with QueryClient context', async () => {
        render(
            <QueryProvider>
                <TestComponent />
            </QueryProvider>
        )
        
        await waitFor(() => {
            expect(screen.getByTestId('test-data')).toHaveTextContent('test data')
        })
    })

    it('calls persistQueryClient on mount', async () => {
        render(
            <QueryProvider>
                <div />
            </QueryProvider>
        )
        
        await waitFor(() => {
            expect(persistQueryClient).toHaveBeenCalled()
        })
    })

    it('handles persistence failure gracefully', async () => {
        ;(persistQueryClient as jest.Mock).mockRejectedValue(new Error('Persistence failed'))
        
        render(
            <QueryProvider>
                <TestComponent />
            </QueryProvider>
        )
        
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith('Failed to persist query client:', expect.any(Error))
            expect(screen.getByTestId('test-data')).toHaveTextContent('test data')
        })
    })
})
