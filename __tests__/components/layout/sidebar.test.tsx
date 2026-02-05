import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from '@/components/layout/sidebar'

// Mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: any) => {
        return <a href={href}>{children}</a>
    }
})

describe('Sidebar Component', () => {
    it('should render navigation links', () => {
        render(<Sidebar />)

        expect(screen.getByText('Social Media')).toBeInTheDocument()
        expect(screen.getByText('Contacts')).toBeInTheDocument()
        expect(screen.getByText('Events')).toBeInTheDocument()
        expect(screen.getByText('Projects')).toBeInTheDocument()
    })

    it('should show hamburger menu on mobile', () => {
        render(<Sidebar />)

        // Hamburger button should be present (hidden on desktop via CSS)
        const hamburgerButton = screen.getByRole('button')
        expect(hamburgerButton).toBeInTheDocument()
    })

    it('should toggle mobile menu when hamburger is clicked', () => {
        render(<Sidebar />)

        const hamburgerButton = screen.getByRole('button')

        // Click to open
        fireEvent.click(hamburgerButton)

        // Sidebar should have translate-x-0 class (visible)
        const sidebar = screen.getByText('Social Media').closest('div')
        expect(sidebar?.className).toContain('translate-x-0')

        // Click to close
        fireEvent.click(hamburgerButton)

        // Sidebar should have -translate-x-full class (hidden)
        expect(sidebar?.className).toContain('-translate-x-full')
    })

    it('should close mobile menu when navigation link is clicked', () => {
        render(<Sidebar />)

        const hamburgerButton = screen.getByRole('button')

        // Open menu
        fireEvent.click(hamburgerButton)

        // Click a navigation link
        const socialLink = screen.getByText('Social Media')
        fireEvent.click(socialLink)

        // Menu should be closed
        const sidebar = socialLink.closest('div')
        expect(sidebar?.className).toContain('-translate-x-full')
    })

    it('should render connection status', () => {
        render(<Sidebar />)

        // ConnectionStatus component should be rendered
        expect(screen.getByText(/Connection/i) || screen.getByText(/Online/i) || screen.getByText(/Offline/i)).toBeTruthy()
    })
})
