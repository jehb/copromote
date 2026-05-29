import { render, screen } from '@testing-library/react'
import RootLayout, { metadata, viewport } from '@/app/layout'

// Mock the child components to avoid complex rendering trees
jest.mock('@/components/layout/sidebar', () => ({
    Sidebar: ({ disabledPages }: any) => <div data-testid="sidebar">Sidebar {JSON.stringify(disabledPages)}</div>
}))

jest.mock('@/components/providers/query-provider', () => ({
    QueryProvider: ({ children }: any) => <div data-testid="query-provider">{children}</div>
}))

jest.mock('@/components/providers/offline-sync-provider', () => ({
    OfflineSyncProvider: ({ children }: any) => <div data-testid="offline-sync-provider">{children}</div>
}))

jest.mock('@/components/layout/connection-status', () => ({
    ConnectionStatus: () => <div data-testid="connection-status" />
}))

jest.mock('@/components/help/help-drawer', () => ({
    HelpDrawer: () => <div data-testid="help-drawer" />
}))

jest.mock('@/components/ui/sonner', () => ({
    Toaster: () => <div data-testid="toaster" />
}))

// Mock utils
jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn()
}))

jest.mock('@/app/actions/admin-permissions', () => ({
    getDisabledPages: jest.fn()
}))

import { getCurrentUser } from '@/lib/user-util'
import { getDisabledPages } from '@/app/actions/admin-permissions'

describe('RootLayout', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('exports metadata and viewport', () => {
        expect(metadata).toBeDefined()
        expect(viewport).toBeDefined()
        expect(metadata.title).toBe('Co+promote - Marketing Management')
    })

    it('renders layout components and children correctly with user role', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue({ role: 'ADMIN' })
        ;(getDisabledPages as jest.Mock).mockResolvedValue(['settings'])

        const children = <div data-testid="test-child">Child Content</div>
        
        // Since RootLayout is an async component, we await it
        const LayoutElement = await RootLayout({ children })
        
        render(LayoutElement as any)

        // Verify HTML elements and providers
        expect(screen.getByTestId('offline-sync-provider')).toBeInTheDocument()
        expect(screen.getByTestId('query-provider')).toBeInTheDocument()
        expect(screen.getByTestId('connection-status')).toBeInTheDocument()
        expect(screen.getByTestId('sidebar')).toBeInTheDocument()
        expect(screen.getByTestId('sidebar')).toHaveTextContent('["settings"]')
        expect(screen.getByTestId('help-drawer')).toBeInTheDocument()
        expect(screen.getByTestId('toaster')).toBeInTheDocument()
        expect(screen.getByTestId('test-child')).toBeInTheDocument()
    })

    it('falls back to USER role if no user found', async () => {
        ;(getCurrentUser as jest.Mock).mockResolvedValue(null)
        ;(getDisabledPages as jest.Mock).mockResolvedValue([])

        const children = <div data-testid="test-child">Child Content</div>
        
        const LayoutElement = await RootLayout({ children })
        
        render(LayoutElement as any)

        expect(getDisabledPages).toHaveBeenCalledWith('USER')
        expect(screen.getByTestId('sidebar')).toHaveTextContent('[]')
    })
})
