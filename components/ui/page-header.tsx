import { cn } from "@/lib/utils"

interface PageHeaderProps {
    title: string | React.ReactNode
    description?: string | React.ReactNode
    actions?: React.ReactNode
    className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col md:flex-row md:justify-between md:items-center gap-4", className)}>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h1>
                {description && <p className="text-muted-foreground text-sm md:text-base mt-1">{description}</p>}
            </div>
            {actions && (
                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                    {actions}
                </div>
            )}
        </div>
    )
}
