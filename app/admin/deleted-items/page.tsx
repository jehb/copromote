import { getDeletedItems } from '@/app/actions/deleted-items'
import { DeletedItemsHub } from './deleted-items-hub'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { PageHeader } from '@/components/ui/page-header'
import { Trash2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function DeletedItemsPage() {
    const deletedItems = await getDeletedItems()

    return (
        <ProtectedRoute pageName="admin">
            <div className="p-8 space-y-8">
                <PageHeader
                    title={
                        <span className="flex items-center gap-2">
                            <Trash2 className="h-6 w-6 text-rose-600" />
                            Deleted Items Hub
                        </span>
                    }
                />
                
                <DeletedItemsHub initialData={deletedItems} />
            </div>
        </ProtectedRoute>
    )
}
