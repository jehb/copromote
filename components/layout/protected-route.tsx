import { checkPageAccess } from '@/app/actions/admin-permissions'
import { ShieldAlert } from 'lucide-react'

export async function ProtectedRoute({
    children,
    pageName,
}: {
    children: React.ReactNode
    pageName: string
}) {
    const hasAccess = await checkPageAccess(pageName)

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50">
                <ShieldAlert className="h-16 w-16 text-red-500 mb-4 opacity-80" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h2>
                <p className="text-slate-600 max-w-md">
                    You do not have permission to access the <strong>{pageName}</strong> page.
                    Please contact an administrator if you believe this is an error.
                </p>
            </div>
        )
    }

    return <>{children}</>
}
