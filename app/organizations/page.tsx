import { getOrganizations, deleteOrganization } from '@/app/actions/organizations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Trash2, Building2, Globe, Users, MoreHorizontal, Pencil, Search, Eye } from 'lucide-react'
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

export default async function OrganizationsPage() {
    const orgs = await getOrganizations()

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Organizations</h1>
                    <p className="text-muted-foreground">Manage partners, vendors, and community groups</p>
                </div>
                <Button asChild>
                    <Link href="/organizations/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Organization
                    </Link>
                </Button>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="text-lg">All Organizations</CardTitle>
                            <CardDescription>{orgs.length} total organizations in your network</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/20">
                                <TableHead className="pl-6 text-[11px] uppercase font-bold tracking-wider text-slate-500">Organization Name</TableHead>
                                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Category</TableHead>
                                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-slate-500">Primary Contact</TableHead>
                                <TableHead className="text-[11px] uppercase font-bold tracking-wider text-slate-500 text-center">Contacts</TableHead>
                                <TableHead className="text-right pr-6 text-[11px] uppercase font-bold tracking-wider text-slate-500">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Building2 className="h-10 w-10 text-slate-300" />
                                            <p>No organizations found. Start by adding a partner or vendor.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orgs.map((org: any) => (
                                    <TableRow key={org.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="pl-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                                                    <Building2 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <Link href={`/organizations/${org.id}`} className="font-bold text-slate-900 leading-none hover:text-primary transition-colors block mb-1">
                                                        {org.name}
                                                    </Link>
                                                    {org.website && (
                                                        <a
                                                            href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 flex items-center gap-1 hover:underline w-fit"
                                                        >
                                                            <Globe className="h-3 w-3" />
                                                            {(() => {
                                                                try {
                                                                    return new URL(org.website.startsWith('http') ? org.website : `https://${org.website}`).hostname;
                                                                } catch {
                                                                    return org.website;
                                                                }
                                                            })()}
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn(
                                                "capitalize font-bold text-[10px] py-0 px-2 h-5 tracking-tight",
                                                org.category === 'Community Partner' && "bg-blue-50 text-blue-700 border-blue-100",
                                                org.category === 'Vendor' && "bg-orange-50 text-orange-700 border-orange-100",
                                                org.category === 'Band' && "bg-purple-50 text-purple-700 border-purple-100",
                                                org.category === 'Non-Profit' && "bg-green-50 text-green-700 border-green-100"
                                            )}>
                                                {org.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {org.primaryContact ? (
                                                <Link
                                                    href={`/contacts/${org.primaryContact.id}`}
                                                    className="flex items-center gap-2 text-sm text-slate-700 hover:text-primary transition-colors"
                                                >
                                                    <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">
                                                        {org.primaryContact.firstName[0]}{org.primaryContact.lastName[0]}
                                                    </div>
                                                    {org.primaryContact.firstName} {org.primaryContact.lastName}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-300 italic text-xs">Unassigned</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                                <Users className="h-3 w-3" />
                                                {org._count.contacts}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/organizations/${org.id}`} className="flex items-center gap-2">
                                                            <Eye className="h-4 w-4" /> View Details
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/organizations/edit/${org.id}`} className="flex items-center gap-2">
                                                            <Pencil className="h-4 w-4" /> Edit Organization
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                                        <form action={deleteOrganization.bind(null, org.id)} className="w-full">
                                                            <button type="submit" className="w-full text-left flex items-center gap-2">
                                                                <Trash2 className="h-4 w-4" /> Delete Organization
                                                            </button>
                                                        </form>
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
