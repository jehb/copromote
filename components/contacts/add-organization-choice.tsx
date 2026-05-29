'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from '@/components/ui/dialog'
import { Building2, Plus, ArrowRight, Search, Check, Globe } from 'lucide-react'
import Link from 'next/link'
import { linkContactToOrganization } from '@/app/actions/contacts'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

interface AddOrganizationChoiceProps {
    contactId: string
    contactName: string
    availableOrganizations: any[]
}

export function AddOrganizationChoice({ contactId, contactName, availableOrganizations }: AddOrganizationChoiceProps) {
    const [view, setView] = useState<'choice' | 'existing'>('choice')
    const [search, setSearch] = useState('')
    const [isLinking, setIsLinking] = useState(false)
    const [open, setOpen] = useState(false)

    // ⚡ Bolt: Memoized array filtering to avoid redundant O(N) operations on render
    const filteredOrgs = useMemo(() => {
        return availableOrganizations.filter(org => {
            return org.name.toLowerCase().includes(search.toLowerCase())
        })
    }, [availableOrganizations, search])

    const handleLink = async (orgId: string) => {
        setIsLinking(true)
        try {
            await linkContactToOrganization(contactId, orgId)
            setOpen(false)
            setView('choice')
        } catch (error) {
            /* istanbul ignore next */
            console.error('Failed to link organization:', error)
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
                <Button className="w-full gap-2 shadow-sm py-6 rounded-xl bg-blue-600 hover:bg-blue-700" size="lg">
                    <Building2 className="h-4 w-4" /> Link to Organization
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="p-8 bg-slate-50/50 border-b">
                    <DialogTitle className="text-2xl font-bold text-slate-900">Link Organization</DialogTitle>
                    <DialogDescription className="text-slate-500">
                        Connect **{contactName}** to an organization in your database
                    </DialogDescription>
                </DialogHeader>

                <div className="p-8">
                    {view === 'choice' ? (
                        <div className="grid gap-4">
                            <Link
                                href={`/organizations/new?primaryContactId=${contactId}`}
                                className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all text-left"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Register New Organization</p>
                                        <p className="text-xs text-slate-500">Create a new entity with this contact as primary</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                            </Link>

                            <button
                                onClick={() => setView('existing')}
                                className="group flex items-center justify-between p-5 rounded-2xl border-2 border-slate-100 hover:border-primary/20 hover:bg-primary/5 transition-all text-left w-full"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                        <Building2 className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">Select Existing Organization</p>
                                        <p className="text-xs text-slate-500">Choose from entities already in the system</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    placeholder="Search organizations..."
                                    className="pl-10 h-12 rounded-xl border-slate-200 focus:ring-primary/20"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="max-h-[300px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                                {filteredOrgs.length === 0 ? (
                                    <div className="text-center py-10">
                                        <p className="text-sm text-slate-400 italic">No organizations found.</p>
                                    </div>
                                ) : (
                                    filteredOrgs.map(org => (
                                        <button
                                            key={org.id}
                                            disabled={isLinking}
                                            onClick={() => handleLink(org.id)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group border border-transparent hover:border-slate-100 transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{org.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-[9px] h-4 py-0 uppercase tracking-tighter opacity-60">
                                                            {org.category}
                                                        </Badge>
                                                        {org.website && (
                                                            <div className="text-[9px] text-slate-400 flex items-center gap-1">
                                                                <Globe className="h-2 w-2" />
                                                                {new URL(org.website.startsWith('http') ? org.website : `https://${org.website}`).hostname}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-transparent group-hover:border-blue-100">
                                                <Check className="h-4 w-4 text-blue-600" />
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
