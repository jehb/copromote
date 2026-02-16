
import { getContacts, getContact, createContact, updateContact, deleteContact, linkContactToOrganization } from '@/app/actions/contacts'
import { prisma } from '@/lib/db'
import { logActivity } from '@/app/actions/activity-logs'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

// Mock dependencies


jest.mock('@/app/actions/activity-logs', () => ({
    logActivity: jest.fn(),
}))

jest.mock('next/cache', () => ({
    revalidatePath: jest.fn(),
}))

// redirect is mocked in jest.setup.ts

describe('Contact Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('getContacts', () => {
        it('should fetch contacts', async () => {
            const mockContacts = [{ id: '1', firstName: 'John' }]
                ; (prisma.contact.findMany as jest.Mock).mockResolvedValue(mockContacts)

            const contacts = await getContacts()
            expect(contacts).toEqual(mockContacts)
        })
    })

    describe('getContact', () => {
        it('should fetch single contact', async () => {
            const mockContact = { id: '1', firstName: 'John' }
                ; (prisma.contact.findUnique as jest.Mock).mockResolvedValue(mockContact)

            const contact = await getContact('1')
            expect(contact).toEqual(mockContact)
        })
    })

    describe('createContact', () => {
        it('should create contact and redirect', async () => {
            const formData = new FormData()
            formData.append('firstName', 'John')
            formData.append('lastName', 'Doe')
            formData.append('email', 'john@example.com')

                ; (prisma.contact.create as jest.Mock).mockResolvedValue({ id: '1', firstName: 'John' })

            await createContact(formData)

            expect(prisma.contact.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                }),
            })
            expect(redirect).toHaveBeenCalledWith('/contacts')
        })

        it('should create contact with organization', async () => {
            const formData = new FormData()
            formData.append('firstName', 'John')
            formData.append('organizationId', 'org-1')

                ; (prisma.contact.create as jest.Mock).mockResolvedValue({ id: '1' })

            await createContact(formData)

            expect(prisma.contact.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    organizationId: 'org-1',
                }),
            })
        })
    })

    describe('updateContact', () => {
        it('should update contact', async () => {
            const formData = new FormData()
            formData.append('id', '1')
            formData.append('firstName', 'Jane')

            await updateContact(formData)

            expect(prisma.contact.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    firstName: 'Jane',
                }),
            })
            expect(redirect).toHaveBeenCalledWith('/contacts')
        })
    })

    describe('deleteContact', () => {
        it('should delete contact', async () => {
            await deleteContact('1')

            expect(prisma.contact.delete).toHaveBeenCalledWith({
                where: { id: '1' },
            })
        })
    })

    describe('linkContactToOrganization', () => {
        it('should link contact', async () => {
            await linkContactToOrganization('1', 'org-1')

            expect(prisma.contact.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: { organizationId: 'org-1' },
            })
            expect(revalidatePath).toHaveBeenCalledWith('/organizations/org-1')
        })
    })
})
