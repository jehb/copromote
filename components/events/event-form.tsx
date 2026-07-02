'use client'

import { useState, useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
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
    DialogClose,
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
    Building,
    Library
} from 'lucide-react'
import { createEventSeries } from '@/app/actions/event-series'
import { ProductSelector } from '@/components/email-planner/product-selector'
import { Product } from '@/app/actions/external-db'
import { EventCommonProps } from '@/types/events'

interface EventFormProps extends EventCommonProps {
    event?: any
    eventSeries?: any[]
    availableProducts?: Product[]
    action: (formData: FormData) => Promise<void>
}

const TIMEZONE = 'America/New_York'

export function EventForm({ event, locations, users, contacts, organizations, eventSeries = [], availableProducts = [], action }: EventFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [selectedContacts, setSelectedContacts] = useState<string[]>(
        event?.contacts?.map((c: any) => c.id) || []
    )
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>(
        event?.organizations?.map((o: any) => o.id) || []
    )
    const [selectedProducts, setSelectedProducts] = useState<string[]>(
        event?.products?.map((p: any) => p.upc) || []
    )
    const [description, setDescription] = useState(event?.description || '')
    const [internalNotes, setInternalNotes] = useState(event?.internalNotes || '')

    // Series state
    const [localEventSeries, setLocalEventSeries] = useState(eventSeries)
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>(event?.seriesId || '')
    const [isCreatingSeries, setIsCreatingSeries] = useState(false)
    const [newSeriesTitle, setNewSeriesTitle] = useState('')
    const [isCreatingSeriesLoading, setIsCreatingSeriesLoading] = useState(false)

    // Search states for modals
    const [contactSearch, setContactSearch] = useState('')
    const [orgSearch, setOrgSearch] = useState('')

    // WordPress state
    const [wordpressId, setWordPressId] = useState<number | undefined>(event?.wordpressId || undefined)
    const [wordpressUrl, setWordPressUrl] = useState<string | undefined>(event?.wordpressUrl || undefined)
    const [wpSearchQuery, setWpSearchQuery] = useState('')
    const [wpSearchResults, setWpSearchResults] = useState<any[]>([])
    const [isSearchingWP, setIsSearchingWP] = useState(false)

    const handleWpSearch = async () => {
        if (!wpSearchQuery) return
        setIsSearchingWP(true)
        try {
            const { searchWordPressEvents } = await import('@/app/actions/wordpress')
            const results = await searchWordPressEvents(wpSearchQuery)
            setWpSearchResults(results)
        } catch (error) {
            /* istanbul ignore next */ 
            console.error(error)
        } finally {
            setIsSearchingWP(false)
        }
    }


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

    const handleAddProduct = (upc: string) => {
        if (!selectedProducts.includes(upc)) {
            setSelectedProducts(prev => [...prev, upc])
        }
    }

    const removeProduct = (upc: string) => {
        setSelectedProducts(prev => prev.filter(p => p !== upc))
    }

    const handleCreateSeries = async () => {
        if (!newSeriesTitle.trim()) return

        setIsCreatingSeriesLoading(true)
        try {
            const result = await createEventSeries(newSeriesTitle)
            if (result.success && result.series) {
                setLocalEventSeries(prev => [...prev, result.series].sort((a, b) => a.title.localeCompare(b.title)))
                setSelectedSeriesId(result.series.id)
                setNewSeriesTitle('')
                setIsCreatingSeries(false)
            } else {
                /* istanbul ignore next */ 
                console.error(result.message || 'Failed to create series')
            }
        } catch (error) {
            /* istanbul ignore next */ 
            console.error('Failed to create series:', error)
        } finally {
            setIsCreatingSeriesLoading(false)
        }
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Event Title <span className="text-red-500">*</span></Label>
                                <Input
                                    id="title"
                                    name="title"
                                    defaultValue={event?.title}
                                    required
                                    placeholder="e.g., Summer Solstice Concert"
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Event Status</Label>
                                <Select name="status" defaultValue={event?.status || 'SCHEDULED'} required>
                                    <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="TENTATIVE">Tentative</SelectItem>
                                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                        <SelectItem value="PAST">Past</SelectItem>
                                        <SelectItem value="CANCELED">Canceled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time <span className="text-red-500">*</span></Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="datetime-local"
                                    defaultValue={event?.startTime ? formatInTimeZone(new Date(event.startTime), TIMEZONE, "yyyy-MM-dd'T'HH:mm") : ''}
                                    required
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time <span className="text-red-500">*</span></Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="datetime-local"
                                    defaultValue={event?.endTime ? formatInTimeZone(new Date(event.endTime), TIMEZONE, "yyyy-MM-dd'T'HH:mm") : ''}
                                    required
                                    className="bg-slate-50/50 border-slate-200"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="locationId">Venue / Location <span className="text-red-500">*</span></Label>
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
                            <Library className="h-4 w-4 text-primary" /> Event Series
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="seriesId">Series (Optional)</Label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <Select
                                        name="seriesId"
                                        value={selectedSeriesId}
                                        onValueChange={setSelectedSeriesId}
                                    >
                                        <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                            <SelectValue placeholder="Select a series..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem> {/* Handle unselect in action if "none" passed or use undefined */}
                                            {localEventSeries.map((series: any) => (
                                                <SelectItem key={series.id} value={series.id}>
                                                    {series.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {/* Select doesn't support "none" clearing easily if "none" isn't a valid ID. 
                                        Logic: If "none" is selected, we should submit empty string or handle it in action.
                                        I'll make sure the hidden input (if used) handles it, but here the name="seriesId" is on Select.
                                        If "none" is the value, the server action will see "none". 
                                        I should update action to handle "none" or just use a clearable approach.
                                        Actually, simpler: use a hidden input for the real value and let Select control it.
                                    */}
                                    <input type="hidden" name="seriesId" value={selectedSeriesId === 'none' ? '' : selectedSeriesId} />
                                </div>
                                <Dialog open={isCreatingSeries} onOpenChange={setIsCreatingSeries}>
                                    <DialogTrigger asChild>
                                        <Button type="button" variant="outline" size="icon" aria-label="Create New Series" title="Create New Series">
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                            <DialogTitle>Create Event Series</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="seriesName">Series Title</Label>
                                                <Input
                                                    id="seriesName"
                                                    value={newSeriesTitle}
                                                    onChange={(e) => setNewSeriesTitle(e.target.value)}
                                                    placeholder="e.g., Summer Concert Series 2024"
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsCreatingSeries(false)}>Cancel</Button>
                                            <Button onClick={handleCreateSeries} disabled={isCreatingSeriesLoading || !newSeriesTitle.trim()}>
                                                {isCreatingSeriesLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Create Series
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Link this event to a series to group related events together.
                            </p>
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
                            <Calendar className="h-4 w-4 text-primary" /> Logistics & Notes
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Public-facing Description</Label>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Public description of the event..."
                            />
                            <input type="hidden" name="description" value={description} />
                        </div>
                        <div className="space-y-2 pt-4">
                            <Label htmlFor="internalNotes">Internal Notes</Label>
                            <RichTextEditor
                                value={internalNotes}
                                onChange={setInternalNotes}
                                placeholder="Add agenda items, loading details, or general notes..."
                            />
                            <input type="hidden" name="internalNotes" value={internalNotes} />
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
                                        <DialogClose asChild>
                                            <Button type="button">
                                                Done
                                            </Button>
                                        </DialogClose>
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
                                            aria-label={`Remove contact ${contact.firstName} ${contact.lastName}`}
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
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button type="button">
                                                Done
                                            </Button>
                                        </DialogClose>
                                    </DialogFooter>
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
                                            aria-label={`Remove organization ${org.name}`}
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                        <input type="hidden" name="organizationIds" value={org.id} />
                                    </Badge>
                                ))
                            )}
                        </div>
                    </section>

                    {/* Linked Products */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                                <Library className="h-4 w-4 text-primary" /> Linked Products
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30">
                            {selectedProducts.length === 0 ? (
                                <div className="w-full flex flex-col items-center justify-center text-slate-400 space-y-1 py-4">
                                    <Library className="h-5 w-5 opacity-50" />
                                    <p className="text-[10px] uppercase font-bold tracking-widest">No Products Selected</p>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {selectedProducts.map(upc => {
                                        const fullProduct = availableProducts.find(ap => ap.upc === upc)
                                        return (
                                            <Badge
                                                key={upc}
                                                variant="outline"
                                                className="py-1 px-3 bg-blue-50/50 border-blue-100 shadow-sm text-blue-700 font-medium flex items-center gap-2 group cursor-default"
                                            >
                                                <span className="truncate max-w-[200px]" title={fullProduct?.name || upc}>
                                                    {fullProduct ? `${fullProduct.brand} - ${fullProduct.name}` : upc}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeProduct(upc)}
                                                    className="opacity-50 hover:text-red-600 hover:opacity-100 transition-colors"
                                                    aria-label={`Remove product ${fullProduct ? fullProduct.name : upc}`}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                                <input type="hidden" name="productUpcs" value={upc} />
                                            </Badge>
                                        )
                                    })}
                                </div>
                            )}

                            <div className="mt-2 w-full">
                                <ProductSelector
                                    selectedUpcs={selectedProducts}
                                    onSelect={handleAddProduct}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* WordPress Association */}
                <div className="md:col-span-2 space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2">
                        <Building className="h-4 w-4 text-primary" /> WordPress Association
                    </div>

                    <input type="hidden" name="wordpressId" value={wordpressId || ''} />
                    <input type="hidden" name="wordpressUrl" value={wordpressUrl || ''} />

                    {wordpressId ? (
                        <div className="flex items-center gap-4 p-4 border rounded-md bg-slate-50">
                            <div className="flex-1">
                                <p className="font-medium">Linked to WordPress Event #{wordpressId}</p>
                                <a href={wordpressUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline truncate block">
                                    {wordpressUrl}
                                </a>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setWordPressId(undefined)
                                    setWordPressUrl(undefined)
                                }}
                            >
                                Unlink
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 max-w-xl">
                            <div className="space-y-2">
                                <Label>Search WordPress Events</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search events by title..."
                                        value={wpSearchQuery}
                                        onChange={(e) => setWpSearchQuery(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleWpSearch()
                                            }
                                        }}
                                    />
                                    <Button type="button" onClick={handleWpSearch} disabled={isSearchingWP}>
                                        {isSearchingWP ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>

                            {wpSearchResults.length > 0 && (
                                <div className="max-h-60 overflow-y-auto border rounded-md divide-y bg-white shadow-sm">
                                    {wpSearchResults.map((post) => (
                                        <button
                                            key={post.id}
                                            type="button"
                                            className="w-full text-left p-3 hover:bg-slate-50 flex flex-col gap-1 transition-colors"
                                            onClick={() => {
                                                setWordPressId(post.id)
                                                setWordPressUrl(post.url)
                                                setWpSearchResults([])
                                                setWpSearchQuery('')
                                            }}
                                        >
                                            <span className="font-medium text-sm">{post.title}</span>
                                            <div className="flex justify-between items-center text-xs text-muted-foreground">
                                                <span className="truncate">{post.url}</span>
                                                {post.start_date && <span>{new Date(post.start_date).toLocaleDateString()}</span>}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {wpSearchQuery && wpSearchResults.length === 0 && !isSearchingWP && (
                                <p className="text-sm text-muted-foreground">No results found.</p>
                            )}
                        </div>
                    )}
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
