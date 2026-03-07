'use server'
import { getSession } from '@/lib/session'

import { getCurrentUser } from '@/lib/user-util'

export async function getMyRole() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const user = await getCurrentUser()
    return user?.role
}
