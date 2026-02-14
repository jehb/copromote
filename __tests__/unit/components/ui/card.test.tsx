
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'

describe('Card', () => {
    it('renders card components', () => {
        render(
            <Card>
                <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>Card Desc</CardDescription>
                </CardHeader>
                <CardContent>Content</CardContent>
                <CardFooter>Footer</CardFooter>
            </Card>
        )

        expect(screen.getByText('Card Title')).toBeInTheDocument()
        expect(screen.getByText('Card Desc')).toBeInTheDocument()
        expect(screen.getByText('Content')).toBeInTheDocument()
        expect(screen.getByText('Footer')).toBeInTheDocument()
    })

    it('applies custom class names', () => {
        const { container } = render(<Card className="custom-class">Content</Card>)
        expect(container.firstChild).toHaveClass('custom-class')
    })
})
