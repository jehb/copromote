'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Save,
    Loader2,
    Building2,
    UserCircle2,
    X,
    Search,
    Calendar,
    MapPin,
    Info,
    Plus,
    UserPlus,
    Building
} from 'lucide-react'

interface EventFormProps {
    event?: any
    locations: any[]
    users: any[]
    contacts: any[]
    organizations: any[]
    action: (formData: FormData) => Promise<void>
}

export function EventForm({ event, locations, users, contacts, organizations, action }: EventFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [selectedContacts, setSelectedContacts] = useState<string[]>(
        event?.contacts?.map((c: any) => c.id) || []
    )
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
        event?.organizations?.map((o: any) => o.id) || []
    )

    // Search states for modals
    const [contactSearch, setContactSearch] = useState('')
    const [orgSearch, setOrgSearch] = useState('')

    const toggleContact = (id: string) => {
        setSelectedContacts(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    const toggleOrg = (id: string) => {
        setSelectedOrgs(prev =>
            prev.includes(id) ? prev.filter(o => o !== id) : [...prev, id]
        )
    }

    const filteredContacts = useMemo(() =>
        contacts.filter(c =>
            `${c.firstName} ${c.lastName}`.toLowerCase().includes(contactSearch.toLowerCase()) ||
            c.company?.toLowerCase().includes(contactSearch.toLowerCase()) ||
            c.type?.toLowerCase().includes(contactSearch.toLowerCase())
        ),
        [contacts, contactSearch])

    const filteredOrgs = useMemo(() =>
        organizations.filter(o =>
            o.name.toLowerCase().includes(orgSearch.toLowerCase()) ||
            o.category?.toLowerCase().includes(orgSearch.toLowerCase())
        ),
        [organizations, orgSearch])

    const selectedContactObjects = useMemo(() =>
        contacts.filter(c => selectedContacts.includes(c.id)),
        [contacts, selectedContacts])

    const selectedOrgObjects = useMemo(() =>
        organizations.filter(o => selectedOrgs.includes(o.id)),
        [organizations, selectedOrgs])

    return (
        <form action={action} onSubmit={() => setIsSaving(true)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Basic Info */}
                <div className="space-y-8">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
                            <Info className="h-4 w-4 text-primary" /> Basic Information
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="title">Event Title</Label>
                            <Input
                                id="title"
                                name="title"
                                defaultValue={event?.title}
                                required
                                placeholder="e.g., Summer Solstice Concert"
                                className="bg-slate-50/50 border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="datetime-local"
                                    defaultValue={event?.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : ''}
                                    required
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="datetime-local"
                                    defaultValue={event?.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : ''}
                                    required
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="locationId">Venue / Location</Label>
                            <Select name="locationId" defaultValue={event?.locationId} required>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="Select a location" />
                                </SelectTrigger>
                                <SelectContent>
                                    {locations.map((location: any) => (
                                        <SelectItem key={location.id} value={location.id}>
                                            <div className="flex items-center gap-2">
                                                <MapPin className="h-3 w-3 text-slate-400" />
                                                {location.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="primaryContactId">Point Person (Liaison)</Label>
                            <Select name="primaryContactId" defaultValue={event?.primaryContactId}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                    <SelectValue placeholder="Assign a staff member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {users.map((user: any) => (
                                        <SelectItem key={user.id} value={user.id}>
                                            <div className="flex items-center gap-2">
                                                <UserCircle2 className="h-3 w-3 text-slate-400" />
                                                {user.name}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
                            <Calendar className="h-4 w-4 text-primary" /> Logistics & Notes
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Event Description & Internal Notes</Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={event?.description}
                                placeholder="Add agenda items, loading details, or general notes..."
                                className="min-h-[150px] bg-slate-50/50 border-slate-200 resize-none focus:ring-primary/20"
                            />
                        </div>
                    </section>
                </div>

                {/* Right Column: Relationships */}
                <div className="space-y-8">
                    {/* Involved People */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <UserCircle2 className="h-4 w-4 text-primary" /> Involved People
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider px-2 gap-1.5">
                                        <UserPlus className="h-3 w-3" /> Add Person
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add Involved People</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search contacts by name, company, or type..."
                                                className="pl-9"
                                                value={contactSearch}
                                                onChange={(e) => setContactSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {filteredContacts.map(contact => (
                                                <label
                                                    key={contact.id}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer group transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            id={`modal-contact-${contact.id}`}
                                                            checked={selectedContacts.includes(contact.id)}
                                                            onCheckedChange={() => toggleContact(contact.id)}
                                                        />
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-900 leading-none">
                                                                {contact.firstName} {contact.lastName}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-medium">
                                                                {contact.type} {contact.company ? `• ${contact.company}` : ''}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" onClick={(e) => {
                                            const closeButton = (e.target as HTMLElement).closest('.fixed')?.querySelector('[data-radix-collection-item]') as HTMLElement;
                                            // Close handled by DialogTrigger
                                        }}>
                                            Done
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[100px] p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                            {selectedContactObjects.length === 0 ? (
                                <div className="w-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-4">
                                    <UserPlus className="h-5 w-5 opacity-50" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">No People Selected</p>
                                </div>
                            ) : (
                                selectedContactObjects.map(contact => (
                                    <Badge
                                        key={contact.id}
                                        variant="secondary"
                                        className="py-1 px-3 bg-white border-slate-200 shadow-sm text-slate-700 font-bold flex items-center gap-2 group hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all cursor-default"
                                    >
                                        <span className="text-xs">{contact.firstName} {contact.lastName}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleContact(contact.id)}
                                            className="opacity-50 group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <input type="hidden" name="contactIds" value={contact.id} />
                                    </Badge>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Involved Organizations */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Building2 className="h-4 w-4 text-primary" /> Involved Organizations
                            </div>

                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold tracking-wider px-2 gap-1.5">
                                        <Plus className="h-3 w-3" /> Add Organization
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md">
                                    <DialogHeader>
                                        <DialogTitle>Add Involved Organizations</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <Input
                                                placeholder="Search organizations by name or category..."
                                                className="pl-9"
                                                value={orgSearch}
                                                onChange={(e) => setOrgSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                            {filteredOrgs.map(org => (
                                                <label
                                                    key={org.id}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 cursor-pointer group transition-all"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            id={`modal-org-${org.id}`}
                                                            checked={selectedOrgs.includes(org.id)}
                                                            onCheckedChange={() => toggleOrg(org.id)}
                                                        />
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-900 leading-none">
                                                                {org.name}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-medium">
                                                                {org.category}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex flex-wrap gap-2 min-h-[100px] p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                            {selectedOrgObjects.length === 0 ? (
                                <div className="w-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-4">
                                    <Building className="h-5 w-5 opacity-50" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">No Organizations Selected</p>
                                </div>
                            ) : (
                                selectedOrgObjects.map(org => (
                                    <Badge
                                        key={org.id}
                                        variant="secondary"
                                        className="py-1 px-3 bg-blue-50/50 border-blue-100 shadow-sm text-blue-700 font-bold flex items-center gap-2 group hover:border-red-200 hover:bg-red-50 hover:text-red-700 transition-all cursor-default"
                                    >
                                        <span className="text-xs">{org.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => toggleOrg(org.id)}
                                            className="opacity-50 group-hover:opacity-100"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <input type="hidden" name="organizationIds" value={org.id} />
                                    </Badge>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </div>

            <div className="pt-8 border-t flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="min-w-[150px] gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm">
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving Event...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {event?.id ? 'Update Event' : 'Create Event'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
