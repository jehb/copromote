import { render, screen, waitFor } from '@testing-library/react'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverTitle,
    PopoverDescription,
} from '@/components/ui/popover'
import userEvent from '@testing-library/user-event'

describe('Popover', () => {
    beforeEach(() => {
        if (typeof window !== 'undefined') {
            window.PointerEvent = class PointerEvent extends Event {
                button: number;
                ctrlKey: boolean;
                pointerType: string;
                constructor(type: string, props: PointerEventInit = {}) {
                    super(type, props);
                    this.button = props.button ?? 0;
                    this.ctrlKey = props.ctrlKey ?? false;
                    this.pointerType = props.pointerType ?? 'mouse';
                }
            } as any;
        }
    })

    it('renders trigger and opens popover content on click', async () => {
        const user = userEvent.setup()
        
        render(
            <Popover>
                <PopoverTrigger>Open Popover</PopoverTrigger>
                <PopoverContent>
                    <PopoverHeader>
                        <PopoverTitle>Title</PopoverTitle>
                        <PopoverDescription>Description</PopoverDescription>
                    </PopoverHeader>
                    <div>Content</div>
                </PopoverContent>
            </Popover>
        )
        
        expect(screen.getByText('Open Popover')).toBeInTheDocument()
        expect(screen.queryByText('Title')).not.toBeInTheDocument()
        
        await user.click(screen.getByText('Open Popover'))
        
        await waitFor(() => {
            expect(screen.getByText('Title')).toBeInTheDocument()
            expect(screen.getByText('Description')).toBeInTheDocument()
            expect(screen.getByText('Content')).toBeInTheDocument()
        })
    })
})
