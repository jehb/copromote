import { format } from 'date-fns'
import { ShieldAlert } from 'lucide-react'

interface UserInfo {
    id: string
    name: string
    username: string
}

interface AuditInfoProps {
    createdAt: Date
    updatedAt: Date
    createdBy?: UserInfo | null
    updatedBy?: UserInfo | null
    className?: string
}

export function AuditInfo({ createdAt, updatedAt, createdBy, updatedBy, className }: AuditInfoProps) {
    return (
        <div className={`text-xs text-muted-foreground mt-4 pt-4 border-t ${className}`}>
            <div className="flex items-center gap-2 mb-2 font-medium">
                <ShieldAlert className="h-3 w-3" />
                <span>Admin Audit Log</span>
            </div>
            <div className="grid grid-cols-1 gap-1">
                <div>
                    Created: {format(new Date(createdAt), 'PP p')}
                    {createdBy && ` by ${createdBy.name || createdBy.username}`}
                </div>
                <div>
                    Last Modified: {format(new Date(updatedAt), 'PP p')}
                    {updatedBy && ` by ${updatedBy.name || updatedBy.username}`}
                </div>
            </div>
        </div>
    )
}
