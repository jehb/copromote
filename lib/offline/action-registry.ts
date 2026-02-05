import { createContact, updateContact, deleteContact } from '@/app/actions/contacts'
import { createEvent, updateEvent, deleteEvent } from '@/app/actions/events'

/**
 * Registry of actions that can be performed offline.
 * The payload must be a plain object that can be converted to FormData
 * or used directly by the server action.
 */
export const syncActionRegistry: Record<string, (payload: any) => Promise<any>> = {
    createContact: (payload) => {
        const formData = objectToFormData(payload)
        return createContact(formData)
    },
    updateContact: (payload) => {
        const formData = objectToFormData(payload)
        return updateContact(formData)
    },
    deleteContact: (id) => deleteContact(id),

    createEvent: (payload) => {
        const formData = objectToFormData(payload)
        return createEvent(formData)
    },
    updateEvent: ({ id, data }) => {
        const formData = objectToFormData(data)
        return updateEvent(id, formData)
    },
    deleteEvent: (id) => deleteEvent(id),
}

/**
 * Utility to convert plain objects to FormData for server actions
 */
export function objectToFormData(obj: any): FormData {
    const formData = new FormData()
    Object.entries(obj).forEach(([key, value]) => {
        if (value === undefined) return
        if (Array.isArray(value) || typeof value === 'object') {
            formData.append(key, JSON.stringify(value))
        } else {
            formData.append(key, String(value))
        }
    })
    return formData
}
