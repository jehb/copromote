import { Suspense } from 'react'
import { getColorPalettes } from '@/app/actions/color-palettes'
import { ColorPaletteForm } from '@/components/admin/color-palette-form'
import { ColorPaletteList } from '@/components/admin/color-palette-list'
import { Palette } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ColorPalettesPage() {
    const result = await getColorPalettes()
    const palettes = result.success ? result.data : []

    return (
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Palette className="h-8 w-8 text-blue-600" />
                        Color Palettes
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage predefined color palettes used throughout the app.</p>
                </div>
                <ColorPaletteForm />
            </div>

            <Suspense fallback={<div className="text-center py-10">Loading color palettes...</div>}>
                <ColorPaletteList palettes={palettes || []} />
            </Suspense>
        </div>
    )
}
