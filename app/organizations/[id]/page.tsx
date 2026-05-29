import { getOrganization, deleteOrganization } from '@/app/actions/organizations'
import { getContacts } from '@/app/actions/contacts'
import { getExternalProductsByBrand, type Product } from '@/app/actions/external-db'
import { getCurrentUser } from '@/lib/user-util'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Pencil, Trash2, Building2, Globe, FileText, Users, User, ExternalLink, Eye, MoreHorizontal, Mail, Phone, Calendar, Package } from 'lucide-react'
import Link from 'next/link'
import { AddPersonChoice } from '@/components/organizations/add-person-choice'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { AuditInfo } from '@/components/common/audit-info'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export default async function OrganizationDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [organization, allContacts, currentUser] = await Promise.all([
        getOrganization(id),
        getContacts(),
        getCurrentUser()
    ])

    if (!organization) {
        notFound()
    }

    let externalProducts: Product[] = []
    if (organization.category === 'Brand' && organization.externalBrand) {
        externalProducts = await getExternalProductsByBrand(organization.externalBrand)
    }

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            <div className="flex flex-col gap-4">
                <Link href="/organizations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                    <ArrowLeft className="h-4 w-4" /> Back to Organizations
                </Link>

                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-5">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl shadow-inner">
                            <Building2 className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{organization.name}</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <Badge variant="secondary" className={cn(
                                    "capitalize font-bold text-[10px] py-0.5",
                                    organization.category === 'Community Partner' && "bg-blue-50 text-blue-700",
                                    organization.category === 'Brand' && "bg-orange-50 text-orange-700",
                                    organization.category === 'Band' && "bg-purple-50 text-purple-700"
                                )}>
                                    {organization.category}
                                </Badge>
                                {organization.website && (
                                    <a
                                        href={organization.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                                    >
                                        <Globe className="h-3 w-3" />
                                        {organization.website}
                                        <ExternalLink className="h-2.5 w-2.5" />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button asChild variant="outline" className="gap-2 border-slate-200">
                            <Link href={`/organizations/edit/${organization.id}`}>
                                <Pencil className="h-4 w-4" /> Edit Details
                            </Link>
                        </Button>
                        <form action={deleteOrganization.bind(null, organization.id)}>
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
                    {organization.category === 'Brand' && organization.externalBrand && (
                        <Card className="border-slate-200 overflow-hidden shadow-sm">
                            <CardHeader className="bg-orange-50/30 border-b border-orange-100 flex flex-row items-center justify-between pb-3">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-lg text-orange-900">
                                        <Package className="h-5 w-5 text-orange-500" /> Associated Products
                                    </CardTitle>
                                    <CardDescription className="text-orange-700/70 mt-1">
                                        Products linked from {organization.externalBrand}
                                    </CardDescription>
                                </div>
                                <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
                                    {externalProducts.length} Items
                                </Badge>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                            <TableHead className="pl-6 w-[120px]">UPC</TableHead>
                                            <TableHead>Product Name</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Department</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {externalProducts.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                                                    No products found for this brand.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            externalProducts.map((product) => (
                                                <TableRow key={product.upc} className="hover:bg-slate-50/80 transition-colors">
                                                    <TableCell className="pl-6 font-mono text-xs text-slate-500">
                                                        {product.upc}
                                                    </TableCell>
                                                    <TableCell className="font-medium text-slate-900">
                                                        {product.name}
                                                    </TableCell>
                                                    <TableCell className="text-slate-600">
                                                        <Badge variant="outline" className="font-normal bg-white">
                                                            {product.size || 'N/A'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-slate-600 text-sm">
                                                        {product.department}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <FileText className="h-4 w-4 text-primary" /> About {organization.name}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            {organization.description ? (
                                <div className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {organization.description}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-400 italic">
                                    No description provided for this organization.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200 overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" /> Associated Contacts
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/10">
                                        <TableHead className="pl-6">Name</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right pr-6">Contact</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organization.contacts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-10 text-slate-400 text-sm">
                                                No contacts are currently linked to this organization.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        organization.contacts.map((contact: any) => (
                                            <TableRow key={contact.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <TableCell className="pl-6 py-4">
                                                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold border border-slate-200 group-hover:border-primary/50 transition-colors">
                                                            {contact.firstName[0]}{contact.lastName[0]}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-slate-900 leading-none">
                                                                {contact.firstName} {contact.lastName}
                                                                {organization.primaryContactId === contact.id && (
                                                                    <Badge className="ml-2 bg-yellow-100 text-yellow-700 border-yellow-200 text-[9px] hover:bg-yellow-200 uppercase tracking-widest font-black py-0 h-4">Primary</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">
                                                    {contact.jobTitle || 'Unspecified Role'}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                                                        <Link href={`/contacts/${contact.id}`}>
                                                            <Eye className="h-4 w-4 mr-2" /> Details
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="border-slate-200 shadow-sm overflow-hidden">
                        <CardHeader className="pb-3 border-b bg-slate-50/50">
                            <CardTitle className="text-[10px] uppercase tracking-widest font-black text-slate-400">Headquarters Info</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {organization.primaryContact && (
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Primary Liaison</p>
                                    <Link href={`/contacts/${organization.primaryContact.id}`} className="flex items-center justify-between p-3 rounded-xl border border-yellow-100 bg-yellow-50/30 hover:bg-yellow-50 transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-sm">
                                                {organization.primaryContact.firstName[0]}{organization.primaryContact.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 group-hover:text-yellow-700 transition-colors">{organization.primaryContact.firstName} {organization.primaryContact.lastName}</p>
                                                <p className="text-[10px] text-slate-500 font-medium lowercase tracking-tight">{organization.primaryContact.email}</p>
                                            </div>
                                        </div>
                                        <ArrowLeft className="h-4 w-4 rotate-180 text-yellow-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </Link>
                                </div>
                            )}

                            <div className="pt-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">System Records</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>Tracking Since</span>
                                        <span className="text-slate-900">{format(organization.createdAt, 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>Records Modified</span>
                                        <span className="text-slate-900">{format(organization.updatedAt, 'MMM d, yyyy')}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>Internal ID</span>
                                        <span className="text-slate-400 truncate ml-4 font-mono">{organization.id.split('-')[0]}...</span>
                                    </div>
                                </div>
                            </div>
                            {currentUser?.role === 'ADMIN' && (
                                <AuditInfo
                                    createdAt={organization.createdAt}
                                    updatedAt={organization.updatedAt}
                                    createdBy={organization.createdBy}
                                    updatedBy={organization.updatedBy}
                                />
                            )}
                        </CardContent>
                    </Card>

                    <AddPersonChoice
                        organizationId={organization.id}
                        organizationName={organization.name}
                        availableContacts={allContacts}
                    />
                </div>
            </div>
        </div>
    )
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ')
}
