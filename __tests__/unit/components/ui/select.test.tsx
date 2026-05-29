import { render, screen, waitFor } from '@testing-library/react'
import {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
} from '@/components/ui/select'
import userEvent from '@testing-library/user-event'

describe('Select', () => {
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

    it('renders full select hierarchy', async () => {
        const user = userEvent.setup()
        
        render(
            <Select>
                <SelectTrigger>
                    <SelectValue placeholder="Select a fruit" />
                </SelectTrigger>
                <SelectContent>
                    <SelectScrollUpButton />
                    <SelectGroup>
                        <SelectLabel>Fruits</SelectLabel>
                        <SelectItem value="apple">Apple</SelectItem>
                        <SelectItem value="banana">Banana</SelectItem>
                        <SelectItem value="blueberry">Blueberry</SelectItem>
                    </SelectGroup>
                    <SelectSeparator />
                    <SelectGroup>
                        <SelectLabel>Meat</SelectLabel>
                        <SelectItem value="beef">Beef</SelectItem>
                    </SelectGroup>
                    <SelectScrollDownButton />
                </SelectContent>
            </Select>
        )
        
        // Initially closed
        expect(screen.getByText('Select a fruit')).toBeInTheDocument()
        expect(screen.queryByText('Apple')).not.toBeInTheDocument()
        
        // Open
        await user.click(screen.getByRole('combobox'))
        
        await waitFor(() => {
            expect(screen.getByText('Fruits')).toBeInTheDocument()
            expect(screen.getByText('Apple')).toBeInTheDocument()
            expect(screen.getByText('Banana')).toBeInTheDocument()
            expect(screen.getByText('Meat')).toBeInTheDocument()
            expect(screen.getByText('Beef')).toBeInTheDocument()
        })
    })
})
