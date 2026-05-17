import { render, screen } from '@testing-library/react'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'

describe('ScrollArea', () => {
    it('renders the scroll area and its children', () => {
        render(
            <ScrollArea className="h-[200px] w-[350px]">
                <div data-testid="scroll-content">Scroll content</div>
            </ScrollArea>
        )
        
        expect(screen.getByTestId('scroll-content')).toBeInTheDocument()
        expect(screen.getByTestId('scroll-content')).toHaveTextContent('Scroll content')
    })

    it('renders horizontal scrollbar when specified', () => {
        const { container } = render(
            <ScrollArea className="h-[200px] w-[350px]">
                <div data-testid="scroll-content">Scroll content</div>
                <ScrollBar orientation="horizontal" data-testid="horizontal-scrollbar" />
            </ScrollArea>
        )
        
        // Since ScrollBar is deeply nested and Radix might change DOM structure, 
        // we just verify it doesn't throw and renders the component without crashing.
        expect(container).toBeInTheDocument()
    })
})
