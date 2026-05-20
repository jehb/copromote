
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteHyperlink } from '@/app/actions/hyperlinks'
import { Trash2, ExternalLink } from 'lucide-react'
import * as Icons from 'lucide-react'
import { HyperlinkForm } from '@/components/hyperlinks/hyperlink-form'
import { Hyperlink } from '@prisma/client'

// Helper to dynamically render icon
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
    const IconComponent = Icons[name as keyof typeof Icons] as React.ElementType
    if (!IconComponent) return <ExternalLink className={className} />
    return <IconComponent className={className} />
}

export function HyperlinkList({ hyperlinks }: { hyperlinks: Hyperlink[] }) {
    if (hyperlinks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                No hyperlinks found. Create one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {hyperlinks.map((link) => (
                <Card key={link.id} className="group relative hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <span className="p-2 bg-slate-100 rounded-md text-slate-600">
                                    <DynamicIcon name={link.icon || 'Link'} className="h-5 w-5" />
                                </span>
                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:underline decoration-slate-400 underline-offset-4">
                                    {link.title}
                                </a>
                            </CardTitle>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <HyperlinkForm hyperlink={link} />
                                <form action={deleteHyperlink.bind(null, link.id)}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Delete Hyperlink"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        title="Delete Hyperlink"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                            {link.description || 'No description provided.'}
                        </CardDescription>
                        <div className="mt-4 text-xs text-muted-foreground truncate font-mono">
                            {link.url}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
