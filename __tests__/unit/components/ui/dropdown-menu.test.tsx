import { render, screen, waitFor } from '@testing-library/react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioItem,
    DropdownMenuRadioGroup,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu'
import userEvent from '@testing-library/user-event'

describe('DropdownMenu', () => {
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

    it('renders full dropdown menu hierarchy', async () => {
        const user = userEvent.setup()
        
        render(
            <DropdownMenu>
                <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Profile <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut></DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Delete Account</DropdownMenuItem>
                    <DropdownMenuCheckboxItem checked={true}>Status</DropdownMenuCheckboxItem>
                    
                    <DropdownMenuRadioGroup value="top">
                        <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>

                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent>
                            <DropdownMenuItem>Settings</DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>
                </DropdownMenuContent>
            </DropdownMenu>
        )
        
        // Initially closed
        expect(screen.queryByText('My Account')).not.toBeInTheDocument()
        
        // Open main menu
        await user.click(screen.getByText('Open Menu'))
        
        await waitFor(() => {
            expect(screen.getByText('My Account')).toBeInTheDocument()
            expect(screen.getByText('Profile')).toBeInTheDocument()
            expect(screen.getByText('Delete Account')).toBeInTheDocument()
            expect(screen.getByText('Status')).toBeInTheDocument()
            expect(screen.getByText('Top')).toBeInTheDocument()
            expect(screen.getByText('Bottom')).toBeInTheDocument()
            expect(screen.getByText('More')).toBeInTheDocument()
            expect(screen.getByText('⇧⌘P')).toBeInTheDocument()
        })
        
        // Open submenu
        await user.hover(screen.getByText('More'))
        
        await waitFor(() => {
            expect(screen.getByText('Settings')).toBeInTheDocument()
        })
    })
})
