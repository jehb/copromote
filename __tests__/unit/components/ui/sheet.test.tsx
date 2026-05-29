import { render, screen, waitFor } from '@testing-library/react'
import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetFooter,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import userEvent from '@testing-library/user-event'

describe('Sheet', () => {
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

    it('renders full sheet hierarchy', async () => {
        const user = userEvent.setup()
        
        render(
            <Sheet>
                <SheetTrigger>Open Sheet</SheetTrigger>
                <SheetContent side="left">
                    <SheetHeader>
                        <SheetTitle>Sheet Title</SheetTitle>
                        <SheetDescription>Sheet Description</SheetDescription>
                    </SheetHeader>
                    <div>Sheet Content</div>
                    <SheetFooter>
                        <button>Save</button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        )
        
        // Initially closed
        expect(screen.queryByText('Sheet Title')).not.toBeInTheDocument()
        
        // Open sheet
        await user.click(screen.getByText('Open Sheet'))
        
        await waitFor(() => {
            expect(screen.getByText('Sheet Title')).toBeInTheDocument()
            expect(screen.getByText('Sheet Description')).toBeInTheDocument()
            expect(screen.getByText('Sheet Content')).toBeInTheDocument()
            expect(screen.getByText('Save')).toBeInTheDocument()
            expect(screen.getByText('Close')).toBeInTheDocument() // The X icon has sr-only Close
        })
    })
})
