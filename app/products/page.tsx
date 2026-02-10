import { getExternalProducts } from '@/app/actions/external-db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Package, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        <div className="p-8 space-y-8 bg-slate-50/30 min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                        <Package className="h-8 w-8 text-indigo-600" />
                        External Products
                    </h1>
                    <p className="text-muted-foreground mt-1">Products synced from your external JDBC-compatible database.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="gap-2">
                        <ExternalLink className="h-4 w-4" />
                        External Dashboard
                    </Button>
                </div>
            </div>

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
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead className="max-w-[300px]">Description</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-slate-500 italic">
                                        No products found. Please check your database connection in Settings.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                products.map((product) => (
                                    <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">{product.id}</TableCell>
                                        <TableCell className="font-semibold text-slate-900">{product.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-none font-medium">
                                                {product.category}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-medium text-slate-900">
                                            ${product.price.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-600' : 'text-slate-600'}`}>
                                                {product.stock} units
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500 truncate max-w-[300px]" title={product.description}>
                                            {product.description}
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
