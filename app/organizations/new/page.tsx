export const dynamic = 'force-dynamic'
import { createOrganization } from '@/app/actions/organizations'
import { getContacts } from '@/app/actions/contacts'
import { getExternalBrands } from '@/app/actions/external-db'
import { OrganizationForm } from '@/components/organizations/organization-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewOrganizationPage({
    searchParams
}: {
    searchParams: Promise<{ primaryContactId?: string }>
}) {
    const { primaryContactId } = await searchParams
    const [contacts, externalBrands] = await Promise.all([
        getContacts(),
        getExternalBrands()
    ])
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Link href="/organizations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" /> Back to Organizations
            </Link>

            <div className="space-y-1">
                <h1 className="text-3xl font-bold">Add Organization</h1>
                <p className="text-muted-foreground">Register a new partner, vendor, or group in your network</p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Fill in the mission-critical details for this organization.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <OrganizationForm
                        contacts={contacts}
                        externalBrands={externalBrands}
                        action={createOrganization}
                        defaultPrimaryContactId={primaryContactId}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
