import { render, screen } from '@testing-library/react'
import { UserAvatar } from '@/components/ui/user-avatar'
import { getGravatarUrl } from '@/lib/gravatar'

jest.mock('@/lib/gravatar', () => ({
    getGravatarUrl: jest.fn()
}))

// Need to mock UI components from Radix as described in memory
jest.mock('@/components/ui/avatar', () => ({
    Avatar: ({ children, className }: any) => <div data-testid="avatar" className={className}>{children}</div>,
    AvatarImage: ({ src, alt }: any) => src ? <img data-testid="avatar-image" src={src} alt={alt} /> : null,
    AvatarFallback: ({ children }: any) => <div data-testid="avatar-fallback">{children}</div>
}))

describe('UserAvatar', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('renders with default props', () => {
        render(<UserAvatar />)
        expect(screen.getByTestId('avatar')).toBeInTheDocument()
        expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('??')
    })

    it('displays initials when name is provided', () => {
        render(<UserAvatar name="John Doe" />)
        expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD')
    })

    it('uses avatarUrl when provided', () => {
        render(<UserAvatar avatarUrl="http://example.com/avatar.png" name="John Doe" />)
        const image = screen.getByTestId('avatar-image')
        expect(image).toHaveAttribute('src', 'http://example.com/avatar.png')
        expect(image).toHaveAttribute('alt', 'John Doe')
    })

    it('uses gravatar when email is provided but no avatarUrl', () => {
        ;(getGravatarUrl as jest.Mock).mockReturnValue('http://gravatar.com/avatar/hash')
        render(<UserAvatar email="test@example.com" name="John Doe" />)

        expect(getGravatarUrl).toHaveBeenCalledWith('test@example.com', 200)

        const image = screen.getByTestId('avatar-image')
        expect(image).toHaveAttribute('src', 'http://gravatar.com/avatar/hash')
    })

    it('prefers avatarUrl over gravatar when both are provided', () => {
        ;(getGravatarUrl as jest.Mock).mockReturnValue('http://gravatar.com/avatar/hash')
        render(<UserAvatar email="test@example.com" avatarUrl="http://example.com/avatar.png" name="John Doe" />)

        const image = screen.getByTestId('avatar-image')
        expect(image).toHaveAttribute('src', 'http://example.com/avatar.png')
    })

    it('handles single name for initials', () => {
        render(<UserAvatar name="John" />)
        expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('J')
    })

    it('handles lowercase names for initials', () => {
        render(<UserAvatar name="john doe" />)
        expect(screen.getByTestId('avatar-fallback')).toHaveTextContent('JD')
    })
})
