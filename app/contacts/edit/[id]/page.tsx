import { getContact, updateContact } from '@/app/actions/contacts'
import { getOrganizations } from '@/app/actions/organizations'
import { ContactForm } from '@/components/contacts/contact-form'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const [contact, organizations] = await Promise.all([
        getContact(id),
        getOrganizations()
    ])

    if (!contact) {
        notFound()
    }

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Link href="/contacts" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Contacts
            </Link>

            <div className="space-y-1">
                <h1 className="text-3xl font-bold">Edit Contact</h1>
                <p className="text-muted-foreground">Update information for {contact.firstName} {contact.lastName}</p>
            </div>

            <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-slate-50/50 border-b">
                    <CardTitle>Contact Details</CardTitle>
                    <CardDescription>Modify the information you wish to update.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <ContactForm
                        contact={contact}
                        organizations={organizations}
                        action={updateContact}
                    />
                </CardContent>
            </Card>
        </div>
    )
}
