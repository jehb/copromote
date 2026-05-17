import { syncActionRegistry, objectToFormData } from '@/lib/offline/action-registry'
import { createContact, updateContact, deleteContact } from '@/app/actions/contacts'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events'

jest.mock('@/app/actions/contacts', () => ({
    createContact: jest.fn(),
    updateContact: jest.fn(),
    deleteContact: jest.fn()
}))

jest.mock('@/app/actions/events', () => ({
    createEvent: jest.fn(),
    updateEvent: jest.fn(),
    deleteEvent: jest.fn()
}))

describe('action-registry', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    describe('objectToFormData', () => {
        it('converts plain object to FormData', () => {
            const obj = {
                id: '123',
                count: 5,
                isActive: true,
            }
            const fd = objectToFormData(obj)
            expect(fd.get('id')).toBe('123')
            expect(fd.get('count')).toBe('5')
            expect(fd.get('isActive')).toBe('true')
        })

        it('ignores undefined values', () => {
            const obj = {
                id: '123',
                missing: undefined
            }
            const fd = objectToFormData(obj)
            expect(fd.has('missing')).toBe(false)
        })

        it('stringifies arrays and objects', () => {
            const obj = {
                tags: ['a', 'b'],
                meta: { foo: 'bar' }
            }
            const fd = objectToFormData(obj)
            expect(fd.get('tags')).toBe(JSON.stringify(['a', 'b']))
            expect(fd.get('meta')).toBe(JSON.stringify({ foo: 'bar' }))
        })
    })

    describe('syncActionRegistry', () => {
        const payload = { name: 'Test' }

        it('calls createContact with FormData', async () => {
            ;(createContact as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.createContact(payload)
            expect(createContact).toHaveBeenCalled()
            const args = (createContact as jest.Mock).mock.calls[0][0]
            expect(args instanceof FormData).toBe(true)
            expect(args.get('name')).toBe('Test')
        })

        it('calls updateContact with FormData', async () => {
            ;(updateContact as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.updateContact(payload)
            expect(updateContact).toHaveBeenCalled()
        })

        it('calls deleteContact with id', async () => {
            ;(deleteContact as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.deleteContact('id-123')
            expect(deleteContact).toHaveBeenCalledWith('id-123')
        })

        it('calls createEvent with FormData', async () => {
            ;(createEvent as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.createEvent(payload)
            expect(createEvent).toHaveBeenCalled()
        })

        it('calls updateEvent with id and FormData', async () => {
            ;(updateEvent as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.updateEvent({ id: 'id-123', data: payload })
            expect(updateEvent).toHaveBeenCalled()
            expect((updateEvent as jest.Mock).mock.calls[0][0]).toBe('id-123')
            expect((updateEvent as jest.Mock).mock.calls[0][1] instanceof FormData).toBe(true)
        })

        it('calls deleteEvent with id', async () => {
            ;(deleteEvent as jest.Mock).mockResolvedValue({ success: true })
            await syncActionRegistry.deleteEvent('id-123')
            expect(deleteEvent).toHaveBeenCalledWith('id-123')
        })
    })
})
