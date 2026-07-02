'use client'

import { useState, useEffect } from 'react'
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
import { Save, Loader2, Building2, Globe, FileText, UserPlus, Users, Tag } from 'lucide-react'

interface OrganizationFormProps {
    organization?: any
    contacts: any[]
    externalBrands?: string[]
    action: (formData: FormData) => Promise<void>
    defaultPrimaryContactId?: string
}

export function OrganizationForm({ organization, contacts, externalBrands = [], action, defaultPrimaryContactId }: OrganizationFormProps) {
    const [isSaving, setIsSaving] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState(organization?.category || 'Community Partner')


    return (
        <form action={action} onSubmit={() => setIsSaving(true)} className="space-y-8">
            {organization?.id && <input type="hidden" name="id" value={organization.id} />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2 mb-4">
                        <Building2 className="h-4 w-4 text-primary" /> General Information
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Organization Name <span className="text-red-500">*</span></Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={organization?.name}
                            required
                            placeholder="e.g. Downtown Alliance"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Community Partner">Community Partner</SelectItem>
                                <SelectItem value="Brand">Brand</SelectItem>
                                <SelectItem value="Band">Band</SelectItem>
                                <SelectItem value="Non-Profit">Non-Profit</SelectItem>
                                <SelectItem value="Government">Government</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCategory === 'Brand' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="externalBrand" className="flex items-center gap-2">
                                <Tag className="h-3.5 w-3.5 text-orange-400" /> Linked Product Brand
                            </Label>
                            <Select name="externalBrand" defaultValue={organization?.externalBrand || 'none'}>
                                <SelectTrigger className="bg-orange-50/30 border-orange-200 focus:ring-orange-500/20">
                                    <SelectValue placeholder="Select a brand from database..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    <SelectItem value="none">No external brand linked</SelectItem>
                                    {externalBrands.map((brand) => (
                                        <SelectItem key={brand} value={brand}>
                                            {brand}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-slate-500 italic">
                                Links this organization to products in the external database.
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="website" className="flex items-center gap-2">
                            <Globe className="h-3.5 w-3.5 text-slate-400" /> Website
                        </Label>
                        <Input
                            id="website"
                            name="website"
                            defaultValue={organization?.website}
                            placeholder="https://example.com"
                            className="bg-slate-50/50 border-slate-200"
                        />
                    </div>
                </div>

                {/* Relationships */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-slate-900 font-bold border-b pb-2 mb-4">
                        <UserPlus className="h-4 w-4 text-primary" /> Key Relationships
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="primaryContactId" className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-slate-400" /> Primary Contact
                        </Label>
                        <Select name="primaryContactId" defaultValue={organization?.primaryContactId || defaultPrimaryContactId || 'none'}>
                            <SelectTrigger className="bg-slate-50/50 border-slate-200">
                                <SelectValue placeholder="Assign primary contact" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No Primary Contact</SelectItem>
                                {contacts.map(contact => (
                                    <SelectItem key={contact.id} value={contact.id}>
                                        {contact.firstName} {contact.lastName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-slate-500 italic">
                            Tip: Only contacts added to this system can be assigned as primary.
                        </p>
                    </div>
                </div>
            </div>

            {/* Description */}
            <div className="space-y-2 pt-4 border-t">
                <Label htmlFor="description" className="flex items-center gap-2 font-bold text-slate-900">
                    <FileText className="h-4 w-4 text-primary" /> Description & Mission
                </Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={organization?.description}
                    placeholder="Provide a brief overview of the organization, its mission, or your history with them..."
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
                            {organization?.id ? 'Update Organization' : 'Create Organization'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
