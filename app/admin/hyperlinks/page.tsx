
import { Suspense } from 'react'
import { getHyperlinks } from '@/app/actions/hyperlinks'
import { HyperlinkForm } from '@/components/hyperlinks/hyperlink-form'
import { HyperlinkList } from '@/components/hyperlinks/hyperlink-list'
import { Link2 } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HyperlinksPage() {
    const hyperlinks = await getHyperlinks()

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Link2 className="h-8 w-8 text-blue-600" />
                        Hyperlinks
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage external resources and quick links.</p>
                </div>
                <HyperlinkForm />
            </div>

            <Suspense fallback={<div className="text-center py-10">Loading links...</div>}>
                <HyperlinkList hyperlinks={hyperlinks} />
            </Suspense>
        </div>
    )
}
