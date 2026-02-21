import { getExternalProducts } from '@/app/actions/external-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, ExternalLink, Eye } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { ProductToolbar } from '@/components/products/product-toolbar'
import { ProductsPagination } from '@/components/products/products-pagination'
import { PageSizeSelector } from '@/components/products/page-size-selector'

export const dynamic = 'force-dynamic'

interface ProductsPageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ProductsPage(props: ProductsPageProps) {
    const searchParams = await props.searchParams
    const page = Number(searchParams.page) || 1
    const search = typeof searchParams.search === 'string' ? searchParams.search : ''
    const pageSize = Number(searchParams.pageSize) || 10

    const { products, totalCount } = await getExternalProducts(page, pageSize, search)

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="p-4 md:p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <PageHeader
                title={
                    <span className="flex items-center gap-3">
                        <Package className="h-6 w-6" />
                        External Products
                    </span>
                }
                description="Products synced from your external JDBC-compatible database."
                actions={
                    <Button variant="outline" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        External Dashboard
                    </Button>
                }
            />

            <ProductToolbar />

            <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="pb-3 border-b border-slate-50">
                    <CardTitle className="text-lg">Product Catalog</CardTitle>
                    <CardDescription>
                        Displaying {products.length} products from the remote catalog. Total: {totalCount}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-50/50">
                            <TableRow>
                                <TableHead className="w-[120px]">UPC</TableHead>
                                <TableHead>Brand</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500 italic">
                                        No products found. Please check your database connection in Settings.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.upc} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{product.upc}</TableCell>
                                        <TableCell className="font-medium text-slate-700">{product.brand}</TableCell>
                                        <TableCell className="font-semibold text-slate-900">{product.name}</TableCell>
                                        <TableCell className="text-slate-600">{product.size}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none font-medium">
                                                {product.department}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/product/${product.upc}`}>
                                                    <Eye className="h-4 w-4" />
                                                    <span className="sr-only">View {product.name}</span>
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex items-center justify-between px-4">
                        <PageSizeSelector />
                        <ProductsPagination
                            currentPage={page}
                            totalPages={totalPages}
                            totalCount={totalCount}
                            pageSize={pageSize}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
