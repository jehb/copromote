'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { format } from 'date-fns'
import { Pencil, Calendar, MapPin, User, X, Clock, MessageSquare, Building2, UserCircle2 } from 'lucide-react'
import { updateEvent } from '@/app/actions/events'
import { EventForm } from './event-form'

interface EventDetailsDialogProps {
    event: any
    isOpen: boolean
    onClose: () => void
    locations: any[]
    users: any[]
    contacts: any[]
    organizations: any[]
}

export function EventDetailsDialog({ event, isOpen, onClose, locations, users, contacts, organizations }: EventDetailsDialogProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Form state
    // We can initialize state from props, assuming the dialog remounts or updates when event changes.
    // Actually, better to use the form action directly but for controlled inputs (if we need specific UI behavior like date pickers or strict validation) we might need state.
    // Ideally, use formData directly or controlled inputs. Given the plan mentioned "Edit Mode: Form inputs", let's use a form with `action` but validation/default values need care.
    // For simplicity with server actions, we can just use `name` attributes for standard inputs, or hidden inputs for Select components if needed. 
    // However,shadcn Select doesn't expose a simple native select easily for FormData. We'll use controlled state for Selects or just hidden inputs.

    // Let's use controlled state for everything to be safe and responsive in "Edit Mode" toggling.
    // Wait, if we just want to submit, we can use `defaultValue`.

    const [locationId, setLocationId] = useState(event.locationId)
    const [contactId, setContactId] = useState(event.primaryContactId || 'none')

    // Format dates for datetime-local input
    const formatForInput = (date: Date) => {
        return format(new Date(date), "yyyy-MM-dd'T'HH:mm")
    }

    const handleUpdate = async (formData: FormData) => {
        setIsLoading(true)
        try {
            // Appending standard fields is handled by browser for native inputs.
            // For Select components (shadcn), we need to ensure the value is in the formData.
            // The easiest way is to add hidden inputs that sync with the Select state.

            await updateEvent(event.id, formData)
            setIsEditing(false)
            onClose() // Optional: close on save, or just switch back to view mode?
            // Plan said: "Verify the modal switches back to View mode with updated info." -> So setIsEditing(false)
        } catch (error) {
            console.error("Failed to update event", error)
        } finally {
            setIsLoading(false)
        }
    }

    const onCancelEdit = () => {
        setIsEditing(false)
        // Reset local state if needed (though next open will reset if component unmounts, or we can rely on parent to pass fresh data if we closed it)
        // If we stay open, we might need to reset. For now, assuming relatively simple flow.
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex justify-between items-start pr-8">
                        <DialogTitle className="text-xl">
                            {isEditing ? 'Edit Event' : event.title}
                        </DialogTitle>
                        {!isEditing && (
                            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)} aria-label="Edit">
                                <Pencil className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                    {!isEditing && event.description && (
                        <DialogDescription className="mt-2 text-slate-600">
                            {event.description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                {!isEditing ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-[20px_1fr] items-start gap-3">
                            <Calendar className="h-5 w-5 text-slate-400 mt-0.5" />
                            <div>
                                <div className="font-medium">{format(new Date(event.startTime), 'EEEE, MMMM do, yyyy')}</div>
                                <div className="text-sm text-slate-500">
                                    {format(new Date(event.startTime), 'h:mm a')} - {format(new Date(event.endTime), 'h:mm a')}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-[20px_1fr] items-center gap-3">
                            <MapPin className="h-5 w-5 text-slate-400" />
                            <div className="font-medium">{event.location?.name || 'No Location'}</div>
                        </div>

                        {event.primaryContact && (
                            <div className="grid grid-cols-[20px_1fr] items-center gap-3">
                                <User className="h-5 w-5 text-slate-400" />
                                <div className="font-medium">{event.primaryContact.name}</div>
                            </div>
                        )}

                        {event.contacts?.length > 0 && (
                            <div className="pt-4 border-t space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <UserCircle2 className="h-3 w-3" /> Involved People
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {event.contacts.map((contact: any) => (
                                        <Badge key={contact.id} variant="secondary" className="bg-slate-100/50 hover:bg-slate-100 transition-colors">
                                            {contact.firstName} {contact.lastName}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {event.organizations?.length > 0 && (
                            <div className="pt-4 border-t space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <Building2 className="h-3 w-3" /> Involved Organizations
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {event.organizations.map((org: any) => (
                                        <Badge key={org.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                                            {org.name}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {event.socialPosts?.length > 0 && (
                            <div className="pt-4 border-t space-y-3">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                                    <MessageSquare className="h-3 w-3" /> Social Media Coverage
                                </h4>
                                <div className="grid gap-2">
                                    {event.socialPosts.map((post: any) => (
                                        <Link
                                            key={post.id}
                                            href={`/social/${post.id}`}
                                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold">{post.platform}</span>
                                                <span className="text-[10px] text-slate-500 line-clamp-1">{post.content}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] h-5 capitalize">
                                                {post.status.replace(/-/g, ' ')}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="py-4">
                        <EventForm
                            event={event}
                            locations={locations}
                            users={users}
                            contacts={contacts}
                            organizations={organizations}
                            action={async (formData) => {
                                await updateEvent(event.id, formData)
                                setIsEditing(false)
                                onClose()
                            }}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
