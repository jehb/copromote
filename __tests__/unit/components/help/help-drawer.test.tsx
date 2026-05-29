import { render, screen, waitFor, act } from '@testing-library/react'
import { HelpDrawer } from '@/components/help/help-drawer'
import { usePathname } from 'next/navigation'
import userEvent from '@testing-library/user-event'

jest.mock('next/navigation', () => ({
    usePathname: jest.fn()
}))

// Mock ReactMarkdown since it can be problematic in JSDOM sometimes
jest.mock('react-markdown', () => {
    return {
        __esModule: true,
        default: ({ children }: { children: any }) => <div data-testid="markdown">{children}</div>
    }
})

jest.mock('remark-gfm', () => {
    return {
        __esModule: true,
        default: jest.fn()
    }
})

describe('HelpDrawer', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        global.fetch = jest.fn()
    })

    it('renders the help button closed initially', () => {
        ;(usePathname as jest.Mock).mockReturnValue('/')
        render(<HelpDrawer />)
        
        const button = screen.getByTitle('Help (Press ? or Ctrl+/)')
        expect(button).toBeInTheDocument()
        
        const drawerHeading = screen.getByRole('heading', { name: 'Help & Documentation' })
        const drawer = drawerHeading.closest('.fixed.top-0')
        expect(drawer).toHaveClass('translate-x-full')
    })

    it('opens drawer and fetches content on click', async () => {
        ;(usePathname as jest.Mock).mockReturnValue('/projects')
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue('# Projects Help Content')
        })

        render(<HelpDrawer />)
        
        const button = screen.getByTitle('Help (Press ? or Ctrl+/)')
        await userEvent.click(button)

        const drawerHeading = screen.getByRole('heading', { name: 'Help & Documentation' })
        const drawer = drawerHeading.closest('.fixed.top-0')
        expect(drawer).toHaveClass('translate-x-0')
        
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/docs/help/projects.md')
            expect(screen.getByTestId('markdown')).toHaveTextContent('# Projects Help Content')
        })
    })

    it('handles fetch error gracefully', async () => {
        ;(usePathname as jest.Mock).mockReturnValue('/unknown')
        ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

        render(<HelpDrawer />)
        
        await userEvent.click(screen.getByTitle('Help (Press ? or Ctrl+/)'))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/docs/help/general.md')
            expect(screen.getByTestId('markdown')).toHaveTextContent('Could not load help content')
        })
    })

    it('toggles drawer with ? shortcut', async () => {
        ;(usePathname as jest.Mock).mockReturnValue('/')
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue('Dashboard Help')
        })

        render(<HelpDrawer />)

        // Press ?
        await userEvent.keyboard('?')

        const drawerHeading = screen.getByRole('heading', { name: 'Help & Documentation' })
        const drawer = drawerHeading.closest('.fixed.top-0')
        expect(drawer).toHaveClass('translate-x-0')
        
        // Press ? again to close
        await userEvent.keyboard('?')
        expect(drawer).toHaveClass('translate-x-full')
    })

    it('toggles drawer with Esc shortcut when open', async () => {
        ;(usePathname as jest.Mock).mockReturnValue('/')
        ;(global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            text: jest.fn().mockResolvedValue('Dashboard Help')
        })

        render(<HelpDrawer />)

        await userEvent.click(screen.getByTitle('Help (Press ? or Ctrl+/)'))
        const drawerHeading = screen.getByRole('heading', { name: 'Help & Documentation' })
        const drawer = drawerHeading.closest('.fixed.top-0')
        expect(drawer).toHaveClass('translate-x-0')

        // Press Escape
        await userEvent.keyboard('{Escape}')
        expect(drawer).toHaveClass('translate-x-full')
    })

    it('does not toggle with shortcut when typing in input', async () => {
        ;(usePathname as jest.Mock).mockReturnValue('/')
        render(
            <div>
                <input data-testid="test-input" type="text" />
                <HelpDrawer />
            </div>
        )

        const input = screen.getByTestId('test-input')
        input.focus()
        
        await userEvent.keyboard('?')

        const drawerHeading = screen.getByRole('heading', { name: 'Help & Documentation' })
        const drawer = drawerHeading.closest('.fixed.top-0')
        expect(drawer).toHaveClass('translate-x-full')
    })
})
