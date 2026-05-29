import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { checkPageAccess } from '@/app/actions/admin-permissions'

jest.mock('@/app/actions/admin-permissions', () => ({
    checkPageAccess: jest.fn()
}))

describe('ProtectedRoute', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders children if access is granted', async () => {
        ;(checkPageAccess as jest.Mock).mockResolvedValue(true)

        const Element = await ProtectedRoute({
            pageName: 'Dashboard',
            children: <div data-testid="protected-content">Secret Content</div>
        })

        render(Element as any)

        expect(screen.getByTestId('protected-content')).toBeInTheDocument()
        expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
        expect(checkPageAccess).toHaveBeenCalledWith('Dashboard')
    })

    it('renders access denied message if access is not granted', async () => {
        ;(checkPageAccess as jest.Mock).mockResolvedValue(false)

        const Element = await ProtectedRoute({
            pageName: 'Settings',
            children: <div data-testid="protected-content">Secret Content</div>
        })

        render(Element as any)

        expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
        expect(screen.getByText('Access Denied')).toBeInTheDocument()
        expect(screen.getByText(/You do not have permission to access the/)).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
        expect(checkPageAccess).toHaveBeenCalledWith('Settings')
    })
})
