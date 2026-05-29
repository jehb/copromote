'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { deleteColorPalette } from '@/app/actions/color-palettes'
import { Trash2, Palette } from 'lucide-react'
import { ColorPaletteForm } from '@/components/admin/color-palette-form'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function ColorPaletteList({ palettes }: { palettes: any[] }) {
    const router = useRouter()

    async function handleDelete(id: string) {
        if (!confirm('Are you sure you want to delete this color palette?')) return;

        const result = await deleteColorPalette(id)
        if (result.success) {
            toast.success('Color palette deleted')
            router.refresh()
        } else {
            toast.error(result.error || 'Failed to delete color palette')
        }
    }

    if (palettes.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                No color palettes found. Create one to get started.
            </div>
        )
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {palettes.map((palette) => {
                const colors = typeof palette.colors === 'string' ? JSON.parse(palette.colors) : palette.colors;

                return (
                    <Card key={palette.id} className="group relative hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2 truncate pr-2">
                                    <span className="p-2 bg-slate-100 rounded-md text-slate-600 shrink-0">
                                        <Palette className="h-5 w-5 text-blue-600" />
                                    </span>
                                    {palette.name}
                                </CardTitle>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-white/80 rounded-md">
                                    <ColorPaletteForm palette={palette} />
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                        title="Delete Palette"
                                        onClick={() => handleDelete(palette.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Delete</span>
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {colors.map((color: string, i: number) => (
                                    <div
                                        key={i}
                                        className="w-8 h-8 rounded-full border border-black/10 shadow-sm"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>
                            <div className="text-xs text-muted-foreground mt-3">
                                {colors.length} {colors.length === 1 ? 'color' : 'colors'}
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}
