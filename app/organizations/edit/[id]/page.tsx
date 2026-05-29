import { getOrganization, updateOrganization } from '@/app/actions/organizations'
import { getContacts } from '@/app/actions/contacts'
import { getExternalBrands } from '@/app/actions/external-db'
import { OrganizationForm } from '@/components/organizations/organization-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditOrganizationPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [organization, contacts, externalBrands] = await Promise.all([
        getOrganization(id),
        getContacts(),
        getExternalBrands()
    ])

    if (!organization) {
        notFound()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Link href="/organizations" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" /> Back to Organizations
            </Link>

            <div className="space-y-1">
                <h1 className="text-3xl font-bold">Edit Organization</h1>
                <p className="text-muted-foreground">Modify details for {organization.name}</p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle>Organization Details</CardTitle>
                    <CardDescription>Update the information as needed.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <OrganizationForm
                        organization={organization}
                        contacts={contacts}
                        externalBrands={externalBrands}
                        action={updateOrganization}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
