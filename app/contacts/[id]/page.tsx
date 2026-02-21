import { getContact, deleteContact } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { getCurrentUser } from '@/lib/user-util'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Trash2, Building2, Mail, Phone, Briefcase, FileText, Calendar, User, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { AddOrganizationChoice } from '@/components/contacts/add-organization-choice'
import { AuditInfo } from '@/components/common/audit-info'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function ContactDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params

    const [contact, organizations, currentUser] = await Promise.all([
        getContact(id),
        getOrganizations(),
        getCurrentUser()
    ])

    if (!contact) {
        notFound()
    }

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="flex flex-col gap-4">
                <Link href="/contacts" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to Contacts
                </Link>

                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shadow-inner">
                            {contact.firstName[0]}{contact.lastName[0]}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{contact.firstName} {contact.lastName}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <p className="text-lg text-slate-500 font-medium">{contact.jobTitle || 'No Title'}</p>
                                <Badge variant="outline" className={cn(
                                    "capitalize font-semibold",
                                    contact.type === 'Client' && "bg-blue-50 text-blue-700 border-blue-100",
                                    contact.type === 'Brand' && "bg-orange-50 text-orange-700 border-orange-100",
                                    contact.type === 'Performer' && "bg-purple-50 text-purple-700 border-purple-100",
                                    contact.type === 'Internal' && "bg-green-50 text-green-700 border-green-100"
                                )}>
                                    {contact.type}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="gap-2">
                            <Link href={`/contacts/edit/${contact.id}`}>
                                <Pencil className="h-4 w-4" /> Edit Profile
                            </Link>
                        </Button>
                        <form action={deleteContact.bind(null, contact.id)}>
                            <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-100 gap-2">
                                <Trash2 className="h-4 w-4" /> Delete
                            </Button>
                        </form>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-4 w-4 text-primary" /> Notes & Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {contact.notes ? (
                                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {contact.notes}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 italic">
                                    No notes provided for this contact.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" /> Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 text-center text-slate-400">
                            <p className="text-sm">Activity history feature coming soon.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="border-slate-200 shadow-sm">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Contact Interface</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Mail className="h-4 w-4 text-slate-400 mt-1" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Email</p>
                                        <p className="text-sm font-medium text-slate-900">{contact.email || 'None'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 text-slate-400 mt-1" />
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">Phone</p>
                                        <p className="text-sm font-medium text-slate-900">{contact.phone || 'None'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <Building2 className="h-5 w-5 text-slate-400 mt-1" />
                                    <div className="space-y-2 w-full">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organization</p>
                                        {contact.organization ? (
                                            <div className="space-y-3">
                                                <Link
                                                    href={`/organizations/${contact.organization.id}`}
                                                    className="flex items-center justify-between p-3 rounded-xl border border-blue-100 bg-blue-50/30 hover:bg-blue-50 transition-colors group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">{contact.organization.name}</p>
                                                        <Badge variant="secondary" className="mt-1 text-[9px] h-4 py-0 font-bold uppercase tracking-tighter opacity-70">
                                                            {contact.organization.category}
                                                        </Badge>
                                                    </div>
                                                    <ArrowLeft className="h-4 w-4 rotate-180 text-blue-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                                </Link>
                                                {contact.primaryFor && (
                                                    <div className="flex items-center gap-2 px-1">
                                                        <div className="h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                                                        <span className="text-[10px] font-bold text-yellow-700 uppercase tracking-wider">Primary Liaison</span>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-sm font-medium text-slate-900">{contact.company || 'Private Record'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t">
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Added</span>
                                    <span>{format(contact.createdAt, 'MMM d, yyyy')}</span>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">
                                    <span>Last Updated</span>
                                    <span>{format(contact.updatedAt, 'MMM d, yyyy')}</span>
                                </div>
                                {currentUser?.role === 'ADMIN' && (
                                    <AuditInfo
                                        createdAt={contact.createdAt}
                                        updatedAt={contact.updatedAt}
                                        createdBy={contact.createdBy}
                                        updatedBy={contact.updatedBy}
                                    />
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <AddOrganizationChoice
                        contactId={contact.id}
                        contactName={`${contact.firstName} ${contact.lastName}`}
                        availableOrganizations={organizations}
                    />
                </div>
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
