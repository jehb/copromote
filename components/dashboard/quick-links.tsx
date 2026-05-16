'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Link2, ExternalLink } from 'lucide-react'
import * as Icons from 'lucide-react'
import { Hyperlink } from '@prisma/client'

// Helper to dynamically render icon
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = Icons[name as keyof typeof Icons] as React.ElementType
    if (!IconComponent) return <ExternalLink className={className} />
    return <IconComponent className={className} />
}

export function QuickLinks({ hyperlinks }: { hyperlinks: Hyperlink[] }) {
    if (!hyperlinks || hyperlinks.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Link2 className="h-5 w-5 text-blue-600" />
                    Quick Links
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {hyperlinks.map((link) => (
                        <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 rounded-lg border p-3 hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 group-hover:bg-white border group-hover:border-slate-200 transition-colors">
                                <DynamicIcon name={link.icon || 'Link'} className="h-5 w-5 text-slate-600 group-hover:text-primary transition-colors" />
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="font-medium truncate group-hover:text-primary transition-colors">
                                    {link.title}
                                </span>
                                {link.description && (
                                    <span className="text-xs text-muted-foreground truncate">
                                        {link.description}
                                    </span>
                                )}
                            </div>
                            <ExternalLink className="ml-auto h-4 w-4 text-slate-300 group-hover:text-slate-400 opacity-0 group-hover:opacity-100 transition-all" />
                        </a>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
