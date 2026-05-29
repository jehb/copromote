
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

jest.mock('@/lib/user-util', () => ({
    getCurrentUser: jest.fn().mockResolvedValue({ id: 'user-1' }),
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
                ; (prisma.contact.findFirst as jest.Mock).mockResolvedValue(mockContact)

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

        it('should create contact without user or with empty organization', async () => {
            const { getCurrentUser } = require('@/lib/user-util')
            getCurrentUser.mockResolvedValueOnce(null)

            const formData = new FormData()
            formData.append('firstName', 'Jane')
            formData.append('organizationId', 'none')

                ; (prisma.contact.create as jest.Mock).mockResolvedValue({ id: '2' })

            await createContact(formData)

            expect(prisma.contact.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    organizationId: null,
                    createdById: null,
                }),
            })
        })
    })

    describe('updateContact', () => {
        it('should update contact with changes', async () => {
            const formData = new FormData()
            formData.append('id', '1')
            formData.append('firstName', 'Jane')
            formData.append('lastName', 'Smith')
            formData.append('email', 'jane@example.com')
            formData.append('phone', '123')
            formData.append('company', 'Acme')
            formData.append('jobTitle', 'CEO')
            formData.append('notes', 'Note')
            formData.append('type', 'Lead')
            formData.append('organizationId', 'org-2')

                ; (prisma.contact.findUnique as jest.Mock).mockResolvedValue({
                    id: '1',
                    firstName: 'John',
                    lastName: 'Doe',
                    email: 'john@example.com',
                    phone: '456',
                    company: 'Corp',
                    jobTitle: 'Manager',
                    notes: 'Old',
                    type: 'Contact',
                    organizationId: 'org-1',
                })

            await updateContact(formData)

            expect(prisma.contact.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    firstName: 'Jane',
                    organizationId: 'org-2'
                }),
            })
            expect(redirect).toHaveBeenCalledWith('/contacts')
        })

        it('should update contact without currentUser and empty organizationId', async () => {
            const { getCurrentUser } = require('@/lib/user-util')
            getCurrentUser.mockResolvedValueOnce(null)

            const formData = new FormData()
            formData.append('id', '2')
            formData.append('organizationId', 'none')

                ; (prisma.contact.findUnique as jest.Mock).mockResolvedValue(null) // currentContact is null branch
            await updateContact(formData)

            expect(prisma.contact.update).toHaveBeenCalledWith({
                where: { id: '2' },
                data: expect.objectContaining({
                    organizationId: null,
                    updatedById: null,
                }),
            })
        })
    })

    describe('deleteContact', () => {
        it('should delete contact', async () => {
            await deleteContact('1')

            expect(prisma.contact.update).toHaveBeenCalledWith({
                where: { id: '1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                })
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
