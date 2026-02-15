export const dynamic = 'force-dynamic'

import { getContacts } from '@/app/actions/contacts'
import { ContactsClientPage } from '@/components/contacts/contacts-client-page'

export default async function ContactsPage() {
    const contacts = await getContacts()

    return <ContactsClientPage initialContacts={contacts} />
}
