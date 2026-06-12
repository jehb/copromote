'use client'

import React, { useState, useMemo, useTransition } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save, X, AlertCircle, RefreshCw } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { bulkUpdateEvents } from '@/app/actions/events'
import { cn } from '@/lib/utils'

const TIMEZONE = 'America/New_York'

interface EventBulkEditViewProps {
    events: any[]
    locations: any[]
    users: any[]
    eventSeries: any[]
    onCancel: () => void
    onSaveSuccess: () => void
}

export function EventBulkEditView({
    events,
    locations,
    users,
    eventSeries,
    onCancel,
    onSaveSuccess
}: EventBulkEditViewProps) {
    const queryClient = useQueryClient()
    const [isSaving, startSavingTransition] = useTransition()
    const [changes, setChanges] = useState<Record<string, any>>({})
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)

    // Format helpers
    const formatDateForInput = (dateVal: any) => {
        if (!dateVal) return ''
        try {
            return formatInTimeZone(new Date(dateVal), TIMEZONE, "yyyy-MM-dd'T'HH:mm")
        } catch (e) {
            return ''
        }
    }

    const isCellChanged = (eventId: string, field: string) => {
        return changes[eventId] && changes[eventId].hasOwnProperty(field)
    }

    const handleCellChange = (eventId: string, field: string, value: any) => {
        const originalEvent = events.find(e => e.id === eventId)
        if (!originalEvent) return

        let originalValue = originalEvent[field]
        let normalizedValue = value

        // Date normalization for comparison
        if (field === 'startTime' || field === 'endTime') {
            originalValue = originalValue ? new Date(originalValue).getTime() : 0
            normalizedValue = value ? new Date(value).getTime() : 0
        } else if (field === 'primaryContactId' || field === 'seriesId') {
            originalValue = originalValue || null
            normalizedValue = value === 'none' || !value ? null : value
        } else if (field === 'description' || field === 'internalNotes') {
            originalValue = originalValue || ''
            normalizedValue = value || ''
        }

        setChanges(prev => {
            const eventChanges = { ...(prev[eventId] || {}) }

            if (originalValue === normalizedValue) {
                delete eventChanges[field]
            } else {
                eventChanges[field] = value === 'none' ? null : value
            }

            const newChanges = { ...prev }
            if (Object.keys(eventChanges).length === 0) {
                delete newChanges[eventId]
            } else {
                newChanges[eventId] = eventChanges
            }
            return newChanges
        })
    }

    // Validation
    const validationErrors = useMemo(() => {
        const errors: Record<string, string> = {}

        events.forEach(event => {
            const eventChanges = changes[event.id] || {}
            
            const title = eventChanges.hasOwnProperty('title') ? eventChanges.title : event.title
            const startTimeVal = eventChanges.hasOwnProperty('startTime') ? eventChanges.startTime : event.startTime
            const endTimeVal = eventChanges.hasOwnProperty('endTime') ? eventChanges.endTime : event.endTime

            if (!title || title.trim() === '') {
                errors[`${event.id}-title`] = 'Title is required'
            }

            if (!startTimeVal) {
                errors[`${event.id}-startTime`] = 'Start time is required'
            }

            if (!endTimeVal) {
                errors[`${event.id}-endTime`] = 'End time is required'
            }

            if (startTimeVal && endTimeVal) {
                const start = new Date(startTimeVal)
                const end = new Date(endTimeVal)
                if (isNaN(start.getTime()) || isNaN(end.getTime())) {
                    errors[`${event.id}-date`] = 'Invalid Date'
                } else if (end < start) {
                    errors[`${event.id}-endTime`] = 'End time must be after start time'
                }
            }
        })

        return errors
    }, [events, changes])

    const hasValidationErrors = Object.keys(validationErrors).length > 0
    const hasChanges = Object.keys(changes).length > 0

    // Prepare updates for saving
    const updatesPayload = useMemo(() => {
        return Object.entries(changes).map(([id, eventChanges]) => ({
            id,
            ...eventChanges
        }))
    }, [changes])

    // Generate changes summary details for confirmation
    const changeSummary = useMemo(() => {
        return Object.entries(changes).map(([id, eventChanges]) => {
            const originalEvent = events.find(e => e.id === id)
            if (!originalEvent) return null

            const fieldsSummary = Object.entries(eventChanges).map(([field, rawValue]) => {
                let newValue = rawValue as any
                let originalValue = originalEvent[field]
                let fieldLabel = field.charAt(0).toUpperCase() + field.slice(1)

                // Human-friendly representation
                if (field === 'startTime' || field === 'endTime') {
                    originalValue = originalValue ? formatInTimeZone(new Date(originalValue), TIMEZONE, 'MMM d, yyyy h:mm a') : 'Not Set'
                    newValue = newValue ? formatInTimeZone(new Date(newValue), TIMEZONE, 'MMM d, yyyy h:mm a') : 'Not Set'
                    fieldLabel = field === 'startTime' ? 'Start Time' : 'End Time'
                } else if (field === 'locationId') {
                    originalValue = locations.find(l => l.id === originalValue)?.name || 'None'
                    newValue = locations.find(l => l.id === newValue)?.name || 'None'
                    fieldLabel = 'Location'
                } else if (field === 'primaryContactId') {
                    originalValue = users.find(u => u.id === originalValue)?.name || 'None'
                    newValue = users.find(u => u.id === newValue)?.name || 'None'
                    fieldLabel = 'Primary Contact'
                } else if (field === 'seriesId') {
                    originalValue = eventSeries.find(s => s.id === originalValue)?.title || 'None'
                    newValue = eventSeries.find(s => s.id === newValue)?.title || 'None'
                    fieldLabel = 'Event Series'
                } else if (field === 'description') {
                    originalValue = originalValue ? (originalValue.replace(/<[^>]*>/g, '').substring(0, 30) + '...') : 'None'
                    newValue = newValue ? (newValue.replace(/<[^>]*>/g, '').substring(0, 30) + '...') : 'None'
                    fieldLabel = 'Description'
                } else if (field === 'internalNotes') {
                    originalValue = originalValue ? (originalValue.replace(/<[^>]*>/g, '').substring(0, 30) + '...') : 'None'
                    newValue = newValue ? (newValue.replace(/<[^>]*>/g, '').substring(0, 30) + '...') : 'None'
                    fieldLabel = 'Internal Notes'
                }

                return {
                    field: fieldLabel,
                    from: String(originalValue || 'Empty'),
                    to: String(newValue || 'Empty')
                }
            })

            return {
                title: originalEvent.title,
                fields: fieldsSummary
            }
        }).filter(Boolean)
    }, [changes, events, locations, users, eventSeries])

    const handleSave = () => {
        if (hasValidationErrors) {
            toast.error('Please correct the validation errors before saving.')
            return
        }
        setShowConfirmDialog(true)
    }

    const confirmSave = () => {
        setShowConfirmDialog(false)
        startSavingTransition(async () => {
            try {
                await bulkUpdateEvents(updatesPayload)
                toast.success('Successfully saved event changes!')
                await queryClient.invalidateQueries({ queryKey: ['events'] })
                onSaveSuccess()
            } catch (error: any) {
                console.error(error)
                toast.error(error.message || 'An error occurred while saving.')
            }
        })
    }

    const handleCancel = () => {
        if (hasChanges) {
            if (confirm('You have unsaved changes. Are you sure you want to cancel and discard them?')) {
                onCancel()
            }
        } else {
            onCancel()
        }
    }

    return (
        <div className="space-y-6 flex flex-col h-full w-full">
            {/* Header info bar */}
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 rounded-lg text-white">
                        <Save className="h-4 w-4" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-slate-800">Bulk Editing Mode</h4>
                        <p className="text-xs text-slate-500">
                            Modify fields inline. Changed values will show a blue border.
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <span className="text-xs font-semibold text-blue-600 bg-blue-100/60 px-2.5 py-1 rounded-full border border-blue-200">
                            {Object.keys(changes).length} event(s) modified
                        </span>
                    )}
                    {hasValidationErrors && (
                        <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> Errors detected
                        </span>
                    )}
                </div>
            </div>

            {/* Scrollable table container */}
            <div className="border rounded-xl bg-white overflow-hidden shadow-sm flex-1">
                <div className="overflow-x-auto w-full max-h-[600px] custom-scrollbar">
                    <Table className="min-w-[1800px] relative border-collapse">
                        <TableHeader className="bg-slate-50/70 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <TableRow>
                                <TableHead className="w-[280px] font-bold text-slate-700 bg-slate-50/70">Event Title</TableHead>
                                <TableHead className="w-[160px] font-bold text-slate-700 bg-slate-50/70">Status</TableHead>
                                <TableHead className="w-[220px] font-bold text-slate-700 bg-slate-50/70">Start Time</TableHead>
                                <TableHead className="w-[220px] font-bold text-slate-700 bg-slate-50/70">End Time</TableHead>
                                <TableHead className="w-[200px] font-bold text-slate-700 bg-slate-50/70">Location</TableHead>
                                <TableHead className="w-[200px] font-bold text-slate-700 bg-slate-50/70">Primary Contact</TableHead>
                                <TableHead className="w-[200px] font-bold text-slate-700 bg-slate-50/70">Event Series</TableHead>
                                <TableHead className="w-[280px] font-bold text-slate-700 bg-slate-50/70">Description</TableHead>
                                <TableHead className="w-[280px] font-bold text-slate-700 bg-slate-50/70">Internal Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {events.map((event) => {
                                const eventChanges = changes[event.id] || {}
                                const currentTitle = eventChanges.hasOwnProperty('title') ? eventChanges.title : event.title
                                const currentStatus = eventChanges.hasOwnProperty('status') ? eventChanges.status : event.status
                                const currentStartTime = eventChanges.hasOwnProperty('startTime') ? eventChanges.startTime : formatDateForInput(event.startTime)
                                const currentEndTime = eventChanges.hasOwnProperty('endTime') ? eventChanges.endTime : formatDateForInput(event.endTime)
                                const currentLocationId = eventChanges.hasOwnProperty('locationId') ? eventChanges.locationId : event.locationId
                                const currentPrimaryContactId = eventChanges.hasOwnProperty('primaryContactId') ? eventChanges.primaryContactId : (event.primaryContactId || 'none')
                                const currentSeriesId = eventChanges.hasOwnProperty('seriesId') ? eventChanges.seriesId : (event.seriesId || 'none')
                                const currentDescription = eventChanges.hasOwnProperty('description') ? eventChanges.description : (event.description || '')
                                const currentInternalNotes = eventChanges.hasOwnProperty('internalNotes') ? eventChanges.internalNotes : (event.internalNotes || '')

                                const titleErr = validationErrors[`${event.id}-title`]
                                const startErr = validationErrors[`${event.id}-startTime`] || validationErrors[`${event.id}-date`]
                                const endErr = validationErrors[`${event.id}-endTime`]

                                return (
                                    <TableRow key={event.id} className="hover:bg-slate-50/30 transition-colors">
                                        {/* Title Cell */}
                                        <TableCell className="align-middle">
                                            <div className="space-y-1">
                                                <Input
                                                    value={currentTitle || ''}
                                                    onChange={(e) => handleCellChange(event.id, 'title', e.target.value)}
                                                    className={cn(
                                                        "h-9 focus-visible:ring-1",
                                                        isCellChanged(event.id, 'title') 
                                                            ? "border-blue-500 bg-blue-50/30 focus-visible:ring-blue-500 text-slate-900 font-medium" 
                                                            : "border-slate-200 bg-transparent",
                                                        titleErr && "border-red-500 focus-visible:ring-red-500 bg-red-50/20"
                                                    )}
                                                />
                                                {titleErr && (
                                                    <span className="text-[10px] text-red-500 font-bold block flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> {titleErr}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Status Cell */}
                                        <TableCell className="align-middle">
                                            <Select
                                                value={currentStatus}
                                                onValueChange={(val) => handleCellChange(event.id, 'status', val)}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 focus:ring-1",
                                                        isCellChanged(event.id, 'status')
                                                            ? "border-blue-500 bg-blue-50/30 focus:ring-blue-500 font-medium text-slate-900"
                                                            : "border-slate-200 bg-transparent"
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="TENTATIVE">Tentative</SelectItem>
                                                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                                                    <SelectItem value="PAST">Past</SelectItem>
                                                    <SelectItem value="CANCELED">Canceled</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Start Time Cell */}
                                        <TableCell className="align-middle">
                                            <div className="space-y-1">
                                                <Input
                                                    type="datetime-local"
                                                    value={currentStartTime || ''}
                                                    onChange={(e) => handleCellChange(event.id, 'startTime', e.target.value)}
                                                    className={cn(
                                                        "h-9 focus-visible:ring-1",
                                                        isCellChanged(event.id, 'startTime')
                                                            ? "border-blue-500 bg-blue-50/30 focus-visible:ring-blue-500 text-slate-900 font-medium"
                                                            : "border-slate-200 bg-transparent",
                                                        startErr && "border-red-500 focus-visible:ring-red-500 bg-red-50/20"
                                                    )}
                                                />
                                                {startErr && (
                                                    <span className="text-[10px] text-red-500 font-bold block flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> {startErr}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* End Time Cell */}
                                        <TableCell className="align-middle">
                                            <div className="space-y-1">
                                                <Input
                                                    type="datetime-local"
                                                    value={currentEndTime || ''}
                                                    onChange={(e) => handleCellChange(event.id, 'endTime', e.target.value)}
                                                    className={cn(
                                                        "h-9 focus-visible:ring-1",
                                                        isCellChanged(event.id, 'endTime')
                                                            ? "border-blue-500 bg-blue-50/30 focus-visible:ring-blue-500 text-slate-900 font-medium"
                                                            : "border-slate-200 bg-transparent",
                                                        endErr && "border-red-500 focus-visible:ring-red-500 bg-red-50/20"
                                                    )}
                                                />
                                                {endErr && (
                                                    <span className="text-[10px] text-red-500 font-bold block flex items-center gap-1">
                                                        <AlertCircle className="h-3 w-3" /> {endErr}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>

                                        {/* Location Cell */}
                                        <TableCell className="align-middle">
                                            <Select
                                                value={currentLocationId}
                                                onValueChange={(val) => handleCellChange(event.id, 'locationId', val)}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 focus:ring-1",
                                                        isCellChanged(event.id, 'locationId')
                                                            ? "border-blue-500 bg-blue-50/30 focus:ring-blue-500 font-medium text-slate-900"
                                                            : "border-slate-200 bg-transparent"
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select location" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {locations.map((loc) => (
                                                        <SelectItem key={loc.id} value={loc.id}>
                                                            {loc.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Primary Contact Cell */}
                                        <TableCell className="align-middle">
                                            <Select
                                                value={currentPrimaryContactId}
                                                onValueChange={(val) => handleCellChange(event.id, 'primaryContactId', val)}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 focus:ring-1",
                                                        isCellChanged(event.id, 'primaryContactId')
                                                            ? "border-blue-500 bg-blue-50/30 focus:ring-blue-500 font-medium text-slate-900"
                                                            : "border-slate-200 bg-transparent"
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select liaison" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {users.map((user) => (
                                                        <SelectItem key={user.id} value={user.id}>
                                                            {user.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Series Cell */}
                                        <TableCell className="align-middle">
                                            <Select
                                                value={currentSeriesId}
                                                onValueChange={(val) => handleCellChange(event.id, 'seriesId', val)}
                                            >
                                                <SelectTrigger
                                                    className={cn(
                                                        "h-9 focus:ring-1",
                                                        isCellChanged(event.id, 'seriesId')
                                                            ? "border-blue-500 bg-blue-50/30 focus:ring-blue-500 font-medium text-slate-900"
                                                            : "border-slate-200 bg-transparent"
                                                    )}
                                                >
                                                    <SelectValue placeholder="Select series" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {eventSeries.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.title}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>

                                        {/* Description Cell */}
                                        <TableCell className="align-middle">
                                            <Input
                                                value={currentDescription}
                                                onChange={(e) => handleCellChange(event.id, 'description', e.target.value)}
                                                placeholder="Description..."
                                                className={cn(
                                                    "h-9 focus-visible:ring-1",
                                                    isCellChanged(event.id, 'description')
                                                        ? "border-blue-500 bg-blue-50/30 focus-visible:ring-blue-500 text-slate-900 font-medium"
                                                        : "border-slate-200 bg-transparent"
                                                )}
                                            />
                                        </TableCell>

                                        {/* Internal Notes Cell */}
                                        <TableCell className="align-middle">
                                            <Input
                                                value={currentInternalNotes}
                                                onChange={(e) => handleCellChange(event.id, 'internalNotes', e.target.value)}
                                                placeholder="Notes..."
                                                className={cn(
                                                    "h-9 focus-visible:ring-1",
                                                    isCellChanged(event.id, 'internalNotes')
                                                        ? "border-blue-500 bg-blue-50/30 focus-visible:ring-blue-500 text-slate-900 font-medium"
                                                        : "border-slate-200 bg-transparent"
                                                )}
                                            />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" type="button" onClick={handleCancel} disabled={isSaving}>
                    Cancel
                </Button>
                <Button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasChanges || hasValidationErrors || isSaving}
                    className="min-w-[150px] gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>

            {/* Summary / Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="max-w-xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Save className="h-5 w-5 text-blue-600" />
                            Confirm Changes
                        </DialogTitle>
                        <DialogDescription>
                            Please review the summary of modified events below before saving.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Change list summary */}
                    <div className="flex-1 overflow-y-auto space-y-4 py-4 pr-1 border-t border-b custom-scrollbar">
                        {changeSummary.map((item, idx) => {
                            if (!item) return null
                            return (
                                <div key={idx} className="space-y-2 pb-3 border-b last:border-b-0">
                                    <h5 className="font-bold text-sm text-slate-800">{item.title}</h5>
                                    <div className="pl-3 border-l-2 border-blue-500 space-y-1">
                                        {item.fields.map((f, fieldIdx) => (
                                            <div key={fieldIdx} className="text-xs flex flex-wrap gap-1 items-center">
                                                <span className="font-semibold text-slate-600">{f.field}:</span>
                                                <span className="text-slate-400 italic line-through truncate max-w-[150px]">{f.from}</span>
                                                <span className="text-slate-500 font-bold">→</span>
                                                <span className="text-blue-600 font-semibold truncate max-w-[180px]">{f.to}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                            Keep Editing
                        </Button>
                        <Button onClick={confirmSave} className="bg-blue-600 hover:bg-blue-700">
                            Confirm and Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
