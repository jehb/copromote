import { render, screen } from '@testing-library/react'
import { QuickLinks } from '@/components/dashboard/quick-links'
import { Hyperlink } from '@prisma/client'

// Mock icons to verify rendering
jest.mock('lucide-react', () => {
    const actual = jest.requireActual('lucide-react')
    return {
        ...actual,
        icons: {
            ...actual.icons,
            Twitter: () => <div data-testid="icon-twitter" />,
            Github: () => <div data-testid="icon-github" />,
        },
        Twitter: () => <div data-testid="icon-twitter" />,
        Github: () => <div data-testid="icon-github" />,
        ExternalLink: () => <div data-testid="icon-external" />,
        Link2: () => <div data-testid="icon-link2" />,
    }
})

describe('QuickLinks', () => {
    const mockHyperlinks: Hyperlink[] = [
        {
            id: '1',
            title: 'Twitter',
            url: 'https://twitter.com',
            description: 'Follow us on Twitter',
            icon: 'Twitter',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '2',
            title: 'GitHub',
            url: 'https://github.com',
            description: 'Check out our code',
            icon: 'Github',
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '3',
            title: 'Documentation',
            url: 'https://docs.example.com',
            description: null,
            icon: null, // Should use fallback
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: '4',
            title: 'Invalid Icon',
            url: 'https://example.com',
            description: 'Link with invalid icon',
            icon: 'NonExistentIconXYZ', // Should use fallback
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ]

    it('renders null when hyperlinks array is empty', () => {
        const { container } = render(<QuickLinks hyperlinks={[]} />)
        expect(container.firstChild).toBeNull()
    })

    // To test undefined we need to cast it since the prop type doesn't explicitly allow undefined
    it('renders null when hyperlinks is undefined', () => {
        const { container } = render(<QuickLinks hyperlinks={undefined as unknown as Hyperlink[]} />)
        expect(container.firstChild).toBeNull()
    })

    it('renders the correct number of links with titles and descriptions', () => {
        render(<QuickLinks hyperlinks={mockHyperlinks} />)

        // Verify Quick Links header
        expect(screen.getByText('Quick Links')).toBeInTheDocument()

        // Verify links are rendered as anchor tags
        const links = screen.getAllByRole('link')
        expect(links).toHaveLength(4)

        // Verify content
        expect(screen.getByText('Twitter')).toBeInTheDocument()
        expect(screen.getByText('Follow us on Twitter')).toBeInTheDocument()
        expect(screen.getByText('GitHub')).toBeInTheDocument()
        expect(screen.getByText('Documentation')).toBeInTheDocument()

        // Verify URLs
        expect(links[0]).toHaveAttribute('href', 'https://twitter.com')
        expect(links[1]).toHaveAttribute('href', 'https://github.com')
    })

    it('dynamically renders valid icons', () => {
        render(<QuickLinks hyperlinks={mockHyperlinks} />)

        expect(screen.getByTestId('icon-twitter')).toBeInTheDocument()
        expect(screen.getByTestId('icon-github')).toBeInTheDocument()
    })

    it('falls back to default icon when icon is null or invalid', () => {
        render(<QuickLinks hyperlinks={mockHyperlinks} />)

        const externalIcons = screen.getAllByTestId('icon-external')

        // DynamicIcon uses <ExternalLink> when an IconComponent is not found.
        // There are 4 `ExternalLink` icons explicitly added at the end of each link row.
        // The invalid icon ('NonExistentIconXYZ') falls back to <ExternalLink>, adding 1 more.
        expect(externalIcons).toHaveLength(5)
    })
})
