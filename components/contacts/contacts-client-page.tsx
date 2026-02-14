'use client'

import { useQuery } from '@tanstack/react-query'
import { getContacts, deleteContact } from '@/app/actions/contacts'
import { useOfflineMutation } from '@/hooks/use-offline-mutation'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Trash2, User, Building2, Mail, Phone, MoreHorizontal, Pencil, Search, Users, Loader2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState } from 'react'

interface ContactsClientPageProps {
    initialContacts: any[]
}

export function ContactsClientPage({ initialContacts }: ContactsClientPageProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const { data: contacts = initialContacts, isLoading } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => getContacts(),
        initialData: initialContacts,
    })

    const deleteMutation = useOfflineMutation(
        (id: string) => deleteContact(id),
        {
            actionName: 'deleteContact',
            queryKey: ['contacts'],
            optimisticUpdate: (old: any, id: string) => old?.filter((c: any) => c.id !== id)
        }
    )

    const filteredContacts = contacts.filter((contact: any) =>
        `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="p-4 md:p-8 space-y-4 md:space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold">Contacts</h1>
                    <p className="text-muted-foreground text-sm md:text-base">Manage your relationships and professional network</p>
                </div>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                    <Link href="/contacts/new">
                        <Plus className="h-4 w-4 md:mr-2" />
                        <span className="md:inline">Add Contact</span>
                    </Link>
                </Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search contacts..."
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-sm md:text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <Card className="overflow-hidden border-slate-200 shadow-sm rounded-xl">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">All Contacts</CardTitle>
                            <CardDescription>{filteredContacts.length} professional relationships</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/30">
                                <TableHead className="pl-6 h-12 font-bold text-slate-600">Contact Name</TableHead>
                                <TableHead className="h-12 font-bold text-slate-600">Type</TableHead>
                                <TableHead className="h-12 font-bold text-slate-600">Organization</TableHead>
                                <TableHead className="h-12 font-bold text-slate-600">Contact Info</TableHead>
                                <TableHead className="text-right pr-6 h-12 font-bold text-slate-600">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContacts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            {isLoading ? (
                                                <Loader2 className="h-10 w-10 text-slate-300 animate-spin" />
                                            ) : (
                                                <>
                                                    <Users className="h-10 w-10 text-slate-300" />
                                                    <p>No contacts found.</p>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredContacts.map((contact: any) => (
                                    <TableRow key={contact.id} className="group hover:bg-slate-50/50 transition-colors border-slate-100">
                                        <TableCell className="pl-6 py-4">
                                            <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 group/link w-fit">
                                                <UserAvatar
                                                    name={`${contact.firstName} ${contact.lastName}`}
                                                    email={contact.email}
                                                    size={40}
                                                    className="h-10 w-10 border border-white shadow-sm"
                                                />
                                                <div>
                                                    <div className="font-bold text-slate-900 leading-none mb-1 group-hover/link:text-blue-600 transition-colors">
                                                        {contact.firstName} {contact.lastName}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">{contact.jobTitle || 'Professional'}</div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "capitalize font-bold py-1 px-3 rounded-md border-transparent ring-1 ring-inset shadow-sm",
                                                contact.type === 'Client' && "bg-blue-50 text-blue-700 ring-blue-100",
                                                contact.type === 'Vendor' && "bg-orange-50 text-orange-700 ring-orange-100",
                                                contact.type === 'Performer' && "bg-purple-50 text-purple-700 ring-purple-100",
                                                contact.type === 'Internal' && "bg-emerald-50 text-emerald-700 ring-emerald-100"
                                            )}>
                                                {contact.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {contact.company ? (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                                    <div className="p-1 rounded bg-slate-100 border border-slate-200">
                                                        <Building2 className="h-3.5 w-3.5 text-slate-500" />
                                                    </div>
                                                    {contact.company}
                                                </div>
                                            ) : (
                                                <span className="text-slate-300">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                {contact.email && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors cursor-default">
                                                        <Mail className="h-3 w-3" />
                                                        {contact.email}
                                                    </div>
                                                )}
                                                {contact.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 hover:text-emerald-600 transition-colors cursor-default">
                                                        <Phone className="h-3 w-3" />
                                                        {contact.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 transition-all rounded-full">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-xl border-slate-100">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/contacts/${contact.id}`} className="flex items-center gap-2.5 py-2 px-3 focus:bg-slate-50 rounded-lg cursor-pointer">
                                                            <div className="p-1 rounded bg-slate-100"><User className="h-3.5 w-3.5 text-slate-500" /></div>
                                                            <span className="text-sm font-semibold">View Details</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/contacts/edit/${contact.id}`} className="flex items-center gap-2.5 py-2 px-3 focus:bg-slate-50 rounded-lg cursor-pointer">
                                                            <div className="p-1 rounded bg-blue-50 text-blue-600"><Pencil className="h-3.5 w-3.5" /></div>
                                                            <span className="text-sm font-semibold">Edit Contact</span>
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete this contact?')) {
                                                                deleteMutation.mutate(contact.id)
                                                            }
                                                        }}
                                                        className="flex items-center gap-2.5 py-2 px-3 text-red-600 focus:text-red-700 focus:bg-red-50 rounded-lg cursor-pointer group/item"
                                                    >
                                                        <div className="p-1 rounded bg-red-100 group-hover/item:bg-red-200 transition-colors"><Trash2 className="h-3.5 w-3.5 text-red-600" /></div>
                                                        <span className="text-sm font-bold">Delete Contact</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
