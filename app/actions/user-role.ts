'use server'

import { getCurrentUser } from '@/lib/user-util'

export async function getMyRole() {
    const user = await getCurrentUser()
    return user?.role
}
