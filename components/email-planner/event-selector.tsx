'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { getCalendarEvents } from '@/app/actions/calendar' // Assuming this exists or I'll need to fetch events somehow
// Wait, I need to check if getCalendarEvents exists or if I should create an action to fetch events for the selector.
// For now I will assume I can fetch events. Actually, let's create a simple action in this file or use a prop.
// Better to use a prop or fetch inside the component with useEffect if it's client side, or pass server component data.
// Let's make it accept a list of events as a prop to keep it simple and reusable.

interface Event {
    id: string
    title: string
    date: Date
}

interface EventSelectorProps {
    events: Event[]
    onSelect: (eventId: string) => void
    disabled?: boolean
}

export function EventSelector({ events, onSelect, disabled }: EventSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [value, setValue] = React.useState('')

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    {value
                        ? events.find((event) => event.id === value)?.title
                        : "Select event..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Search events..." />
                    <CommandList>
                        <CommandEmpty>No event found.</CommandEmpty>
                        <CommandGroup>
                            {events.map((event) => (
                                <CommandItem
                                    key={event.id}
                                    value={event.title} // Search by title
                                    onSelect={() => {
                                        setValue(event.id)
                                        onSelect(event.id)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === event.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{event.title}</span>
                                        <span className="text-xs text-stone-500">
                                            {new Date(event.date).toLocaleDateString()}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
