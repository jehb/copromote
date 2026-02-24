export const dynamic = 'force-dynamic'

import { getContacts } from '@/app/actions/contacts'
import { ContactsClientPage } from '@/components/contacts/contacts-client-page'

import { ProtectedRoute } from '@/components/layout/protected-route'

export default async function ContactsPage() {
    const contacts = await getContacts()

    return (
        <ProtectedRoute pageName="contacts">
            <ContactsClientPage initialContacts={contacts} />
        </ProtectedRoute>
    )
}
