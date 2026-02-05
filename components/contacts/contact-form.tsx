'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Save, Loader2, User, Building2, Mail, Phone, Briefcase, FileText } from 'lucide-react'

interface ContactFormProps {
    contact?: any
    organizations: any[]
    action: (formData: FormData) => Promise<void>
}

export function ContactForm({ contact, organizations, action }: ContactFormProps) {
    const [isSaving, setIsSaving] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setIsSaving(true)
    }

    return (
        <form action={action} onSubmit={() => setIsSaving(true)} className="space-y-8">
            {contact?.id && <input type="hidden" name="id" value={contact.id} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2 mb-4">
                        <User className="h-4 w-4 text-primary" /> Personal Information
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                defaultValue={contact?.firstName}
                                required
                                placeholder="e.g. Jane"
                                className="bg-slate-50/50 border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                defaultValue={contact?.lastName}
                                required
                                placeholder="e.g. Doe"
                                className="bg-slate-50/50 border-slate-200"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400" /> Primary Email
                        </Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={contact?.email}
                            placeholder="jane.doe@example.com"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> Primary Phone
                        </Label>
                        <Input
                            id="phone"
                            name="phone"
                            defaultValue={contact?.phone}
                            placeholder="+1 (555) 000-0000"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>
                </div>

                {/* Professional Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2 mb-4">
                        <Building2 className="h-4 w-4 text-primary" /> Professional Details
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="company" className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" /> Company / Organization
                        </Label>
                        <Input
                            id="company"
                            name="company"
                            defaultValue={contact?.company}
                            placeholder="e.g. Acme Corp"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jobTitle" className="flex items-center gap-2">
                            <Briefcase className="h-3.5 w-3.5 text-slate-400" /> Job Title
                        </Label>
                        <Input
                            id="jobTitle"
                            name="jobTitle"
                            defaultValue={contact?.jobTitle}
                            placeholder="e.g. Marketing Director"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="organizationId">Organization</Label>
                        <Select name="organizationId" defaultValue={contact?.organizationId || (new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '').get('organizationId')) || 'none'}>
                            <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Organization (Individual)</SelectItem>
                                {organizations.map(org => (
                                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">Contact Type</Label>
                        <Select name="type" defaultValue={contact?.type || 'Client'}>
                            <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Client">Client</SelectItem>
                                <SelectItem value="Vendor">Vendor</SelectItem>
                                <SelectItem value="Performer">Performer</SelectItem>
                                <SelectItem value="Internal">Internal</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="notes" className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText className="h-4 w-4 text-primary" /> Notes & Memos
                </Label>
                <Textarea
                    id="notes"
                    name="notes"
                    defaultValue={contact?.notes}
                    placeholder="Add any additional context, preferences, or important details about this contact..."
                    rows={5}
                    className="bg-slate-50/50 border-slate-200 resize-none focus:ring-primary/20"
                />
            </div>

            <div className="pt-6 flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => window.history.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSaving} className="min-w-[140px] gap-2">
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            {contact?.id ? 'Update Contact' : 'Create Contact'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
