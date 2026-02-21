import { getExternalProductByUPC } from '@/app/actions/external-db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { Package, ArrowLeft, Database } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface ProductPageProps {
    params: Promise<{ upc: string }>
}

export default async function ProductPage(props: ProductPageProps) {
    const params = await props.params
    const product = await getExternalProductByUPC(params.upc)

    if (!product) {
        notFound()
    }

    // Extract core fields we mapped previously
    // Fallbacks provided just in case the query returns nulls
    const upc = String(product.F01 || params.upc)
    const brand = product.F155 || 'Unknown Brand'
    const name = product.F29 || 'Unknown Product'
    const size = product.F22 || '-'
    const department = product.F238 || 'Uncategorized'

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center gap-4 mb-2">
                <Button variant="ghost" size="icon" asChild className="shrink-0 text-slate-500 hover:text-slate-900">
                    <Link href="/products">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to Products</span>
                    </Link>
                </Button>
                <div className="text-sm font-medium text-slate-500">
                    <Link href="/products" className="hover:text-slate-900 transition-colors">Products</Link>
                    <span className="mx-2">/</span>
                    <span className="text-slate-900 font-mono">{upc}</span>
                </div>
            </div>

            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <Package className="h-8 w-8 text-indigo-600" />
                        {name}
                    </span>
                }
                description={
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            Brand: <span className="text-slate-900">{brand}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            Size: <span className="text-slate-900">{size}</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                            UPC: <span className="font-mono text-slate-900">{upc}</span>
                        </span>
                    </div>
                }
                actions={
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200 border-none px-4 py-1.5 text-sm">
                        {department}
                    </Badge>
                }
            />

            <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-800">
                        <Database className="h-5 w-5 text-slate-500" />
                        Raw Database Record
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 font-medium w-1/3">Column</th>
                                    <th scope="col" className="px-6 py-3 font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(product).map(([key, value], index) => (
                                    <tr
                                        key={key}
                                        className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                                            }`}
                                    >
                                        <td className="px-6 py-3 font-mono text-slate-600 w-1/3">
                                            {key}
                                        </td>
                                        <td className="px-6 py-3 text-slate-900 break-words max-w-xl">
                                            {value !== null && value !== undefined ? String(value) : (
                                                <span className="text-slate-400 italic">null</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
