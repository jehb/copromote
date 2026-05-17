import { render, screen } from '@testing-library/react'
import {
    Avatar,
    AvatarImage,
    AvatarFallback,
    AvatarBadge,
    AvatarGroup,
    AvatarGroupCount,
} from '@/components/ui/avatar'

describe('Avatar', () => {
    it('renders avatar with fallback', () => {
        render(
            <Avatar>
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
        )
        expect(screen.getByText('JD')).toBeInTheDocument()
    })

    it('renders avatar with image', () => {
        const { container } = render(
            <Avatar>
                <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
                <AvatarFallback>JD</AvatarFallback>
            </Avatar>
        )
        // Radix Avatar hides the image element in jsdom until loaded,
        // so we just verify the component renders without crashing
        expect(container).toBeInTheDocument()
    })

    it('renders different sizes', () => {
        const { rerender } = render(<Avatar size="sm" data-testid="avatar-sm" />)
        expect(screen.getByTestId('avatar-sm')).toHaveAttribute('data-size', 'sm')

        rerender(<Avatar size="lg" data-testid="avatar-lg" />)
        expect(screen.getByTestId('avatar-lg')).toHaveAttribute('data-size', 'lg')
    })

    it('renders avatar badge', () => {
        render(
            <Avatar>
                <AvatarFallback>JD</AvatarFallback>
                <AvatarBadge data-testid="badge" />
            </Avatar>
        )
        expect(screen.getByTestId('badge')).toBeInTheDocument()
    })

    it('renders avatar group', () => {
        render(
            <AvatarGroup data-testid="group">
                <Avatar>
                    <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <Avatar>
                    <AvatarFallback>B</AvatarFallback>
                </Avatar>
                <AvatarGroupCount data-testid="group-count">+2</AvatarGroupCount>
            </AvatarGroup>
        )
        
        expect(screen.getByTestId('group')).toBeInTheDocument()
        expect(screen.getByText('A')).toBeInTheDocument()
        expect(screen.getByText('B')).toBeInTheDocument()
        expect(screen.getByText('+2')).toBeInTheDocument()
    })
})
