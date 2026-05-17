'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { UserPlus, Users, ArrowRight, Search, Building2, Check } from 'lucide-react'
import Link from 'next/link'
import { linkContactToOrganization } from '@/app/actions/contacts'
import { Input } from '@/components/ui/input'

interface AddPersonChoiceProps {
    organizationId: string
    organizationName: string
    availableContacts: any[]
}

export function AddPersonChoice({ organizationId, organizationName, availableContacts }: AddPersonChoiceProps) {
    const [view, setView] = useState<'choice' | 'existing'>('choice')
    const [search, setSearch] = useState('')
    const [isLinking, setIsLinking] = useState(false)
    const [open, setOpen] = useState(false)

    const filteredContacts = availableContacts.filter(contact => {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase()
        return fullName.includes(search.toLowerCase()) && contact.organizationId !== organizationId
    })

    const handleLink = async (contactId: string) => {
        setIsLinking(true)
        try {
            await linkContactToOrganization(contactId, organizationId)
            setOpen(false)
            setView('choice')
        } catch (error) {
            /* istanbul ignore next */
            console.error('Failed to link contact:', error)
        } finally {
            setIsLinking(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) setTimeout(() => setView('choice'), 300)
        }}>
            <DialogTrigger asChild>
                <Button className="w-full gap-2 shadow-sm py-6 rounded-xl" size="lg">
                    <UserPlus className="h-4 w-4" /> Add Person to Org
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-50/50 border-b">
                    <DialogTitle className="text-2xl font-bold text-slate-900">Add Person</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Choose how you want to add a contact to **{organizationName}**
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    {view === 'choice' ? (
                        <div className="grid gap-4">
                            <Link
                                href={`/contacts/new?organizationId=${organizationId}`}
                                className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <UserPlus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Create New Contact</p>
                                        <p className="text-xs text-slate-500">Register a brand new person in the system</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </Link>

                            <button
                                onClick={() => setView('existing')}
                                className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-left w-full"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Choose Existing Contact</p>
                                        <p className="text-xs text-slate-500">Select someone already in your database</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search by name..."
                                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {filteredContacts.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-sm text-slate-400 italic">No available contacts found.</p>
                                    </div>
                                ) : (
                                    filteredContacts.map(contact => (
                                        <button
                                            key={contact.id}
                                            disabled={isLinking}
                                            onClick={() => handleLink(contact.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 group-hover:bg-primary/10 group-hover:text-primary">
                                                    {contact.firstName[0]}{contact.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{contact.firstName} {contact.lastName}</p>
                                                    <p className="text-[10px] text-slate-500 flex items-center gap-1 uppercase tracking-tight font-medium">
                                                        <Building2 className="h-2.5 w-2.5" />
                                                        {contact.organization?.name || 'Independent'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Check className="h-4 w-4 text-primary" />
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                className="w-full text-slate-500 hover:text-slate-900"
                                onClick={() => setView('choice')}
                            >
                                Back to options
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
