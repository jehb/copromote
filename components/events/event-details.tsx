/* istanbul ignore file */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'
import { Pencil, Calendar, MapPin, User, ArrowLeft, MessageSquare, Building2, UserCircle2, Trash2, Clock, Library, Copy } from 'lucide-react'
import { updateEvent, deleteEvent } from '@/app/actions/events'
import { EventForm } from './event-form'
import { Product } from '@/app/actions/external-db'
import DOMPurify from 'isomorphic-dompurify'

const TIMEZONE = 'America/New_York'
import { AuditInfo } from '@/components/common/audit-info'
import { useRouter } from 'next/navigation'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EventCommonProps } from '@/types/events'

interface EventDetailsProps extends EventCommonProps {
    event: any
    eventSeries: any[]
    availableProducts?: Product[]
    isAdmin: boolean
}

export function EventDetails({
    event,
    locations,
    users,
    contacts,
    organizations,
    eventSeries,
    availableProducts = [],
    isAdmin
}: EventDetailsProps) {
    const [isEditing, setIsEditing] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        await deleteEvent(event.id)
        router.push('/events')
        router.refresh()
    }

    if (isEditing) {
        return (
            <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} className="gap-2">
                        <ArrowLeft className="h-4 w-4" /> Back to View
                    </Button>
                    <h1 className="text-2xl font-bold">Edit Event</h1>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <EventForm
                            event={event}
                            locations={locations}
                            users={users}
                            contacts={contacts}
                            organizations={organizations}
                            eventSeries={eventSeries}
                            availableProducts={availableProducts}
                            action={async (formData) => {
                                await updateEvent(event.id, formData)
                                setIsEditing(false)
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" aria-label="Back to events" asChild>
                        <Link href="/events">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{event.title}</h1>
                        {event.series && (
                            <div className="flex items-center gap-2 text-sm text-primary font-medium mt-1">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span>Part of Series: {event.series.title}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none gap-2" onClick={() => router.push(`/events/new?clone=${event.id}`)}>
                        <Copy className="h-4 w-4" /> Clone
                    </Button>
                    <Button variant="outline" className="flex-1 md:flex-none gap-2" onClick={() => setIsEditing(true)}>
                        <Pencil className="h-4 w-4" /> Edit Event
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild className="flex-1 md:flex-none">
                            <Button variant="outline" className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200" suppressHydrationWarning>
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the event
                                    and remove it from our servers.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Left Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Event Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {event.description && (
                                <div className="space-y-2 overflow-hidden">
                                    <div className="text-xs font-bold uppercase text-slate-400">Public-facing Description</div>
                                    <div 
                                        className="prose prose-sm max-w-none text-slate-600 break-words [&_p]:whitespace-break-spaces [&_*]:break-words" 
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description) }}
                                    />
                                </div>
                            )}
                            
                            {event.internalNotes && (
                                <div className="space-y-2 pt-4 border-t overflow-hidden">
                                    <div className="text-xs font-bold uppercase text-slate-400">Internal Notes</div>
                                    <div 
                                        className="prose prose-sm max-w-none text-slate-600 bg-yellow-50 p-4 rounded-md border border-yellow-200 break-words [&_p]:whitespace-break-spaces [&_*]:break-words" 
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.internalNotes) }}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase text-slate-400">Date & Time</div>
                                    <div className="font-medium text-slate-900">{formatInTimeZone(new Date(event.startTime), TIMEZONE, 'EEEE, MMMM do, yyyy')}</div>
                                    <div className="text-sm text-slate-500 flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {formatInTimeZone(new Date(event.startTime), TIMEZONE, 'h:mm a')} - {formatInTimeZone(new Date(event.endTime), TIMEZONE, 'h:mm a')}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase text-slate-400">Location</div>
                                    <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-slate-400" />
                                        {event.location?.name || 'No Location Assigned'}
                                    </div>
                                </div>
                            </div>

                            {event.primaryContact && (
                                <div className="pt-4 border-t space-y-2">
                                    <div className="text-xs font-bold uppercase text-slate-400">Primary Contact (Liaison)</div>
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                                            {event.primaryContact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{event.primaryContact.name}</div>
                                            <div className="text-xs text-slate-500">{event.primaryContact.email}</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Meta / Audit Info */}
                    {isAdmin && (
                        <Card>
                            <CardContent className="pt-6">
                                <AuditInfo
                                    createdAt={event.createdAt}
                                    updatedAt={event.updatedAt}
                                    createdBy={event.createdBy}
                                    updatedBy={event.updatedBy}
                                />
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                    {/* Involved People */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <UserCircle2 className="h-4 w-4" /> Involved People
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {event.contacts?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {event.contacts.map((contact: any) => (
                                        <Badge key={contact.id} variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                            <Link href={`/contacts/${contact.id}`} className="hover:underline">
                                                {contact.firstName} {contact.lastName}
                                            </Link>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No people assigned directly.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Involved Organizations */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <Building2 className="h-4 w-4" /> Involved Organizations
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {event.organizations?.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {event.organizations.map((org: any) => (
                                        <Badge key={org.id} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                                            <Link href={`/organizations/${org.id}`} className="hover:underline">
                                                {org.name}
                                            </Link>
                                        </Badge>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No organizations linked.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Linked Products */}
                    {event.products && event.products.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                    <Library className="h-4 w-4" /> Linked Products
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {event.products.map((prod: any) => {
                                        const fullProduct = availableProducts.find(ap => ap.upc === prod.upc)
                                        return (
                                            <Badge key={prod.upc} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                                                <Link href={`/product/${prod.upc}`} className="hover:underline flex items-center">
                                                    <span className="truncate max-w-[200px]" title={fullProduct?.name || prod.upc}>
                                                        {fullProduct ? `${fullProduct.brand} - ${fullProduct.name}` : prod.upc}
                                                    </span>
                                                </Link>
                                            </Badge>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Social Media */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" /> Social Media
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {event.socialPosts?.length > 0 ? (
                                <div className="space-y-2">
                                    {event.socialPosts.map((post: any) => (
                                        <Link
                                            key={post.id}
                                            href={`/social/${post.id}`}
                                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors group"
                                        >
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-bold truncate">{post.platform}</span>
                                                <span className="text-[10px] text-slate-500 line-clamp-1">{post.content}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[10px] h-5 capitalize ml-2 whitespace-nowrap">
                                                {post.status.replace(/-/g, ' ')}
                                            </Badge>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400 italic">No social posts linked.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* WordPress Link */}
                    {event.wordpressId && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="space-y-1">
                                    <div className="text-xs font-bold uppercase text-slate-400">WordPress Link</div>
                                    <Link
                                        href={event.wordpressUrl || '#'}
                                        target="_blank"
                                        className="text-sm text-blue-600 hover:underline break-all block"
                                    >
                                        Visit WP Event #{event.wordpressId}
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
