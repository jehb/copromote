'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { getExternalProducts } from '@/app/actions/external-db'

interface Product {
    upc: string
    brand: string
    size: string
    department: string
    name: string
}

interface ProductSelectorProps {
    onSelect: (upc: string) => void
    disabled?: boolean
    availableProducts?: Product[] // Products already attached, to filter out
}

export function ProductSelector({ onSelect, disabled, availableProducts = [] }: ProductSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const [products, setProducts] = React.useState<Product[]>([])
    const [loading, setLoading] = React.useState(false)

    React.useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!open) return
            setLoading(true)
            try {
                const { products: fetched } = await getExternalProducts(1, 15, search)
                setProducts(fetched)
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }, 300)
        return () => clearTimeout(timeoutId)
    }, [search, open])

    React.useEffect(() => {
        if (open && products.length === 0 && search === '') {
            setLoading(true)
            getExternalProducts(1, 15, '').then(({ products: fetched }) => {
                setProducts(fetched)
                setLoading(false)
            })
        }
    }, [open])

    const unselectedProducts = products.filter(p => !availableProducts.some(ap => ap.upc === p.upc))

    return (
        <Popover open={open} onOpenChange={(val) => {
            setOpen(val)
            if (!val) setSearch('')
        }}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={disabled}
                >
                    Search Products...
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                    <CommandInput
                        placeholder="Search by name, brand, UPC..."
                        value={search}
                        onValueChange={setSearch}
                    />
                    <CommandList>
                        {loading && products.length === 0 ? (
                            <div className="p-4 flex items-center justify-center">
                                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                            </div>
                        ) : (
                            <>
                                {unselectedProducts.length === 0 && !loading && (
                                    <CommandEmpty>No product found.</CommandEmpty>
                                )}
                                <CommandGroup>
                                    {unselectedProducts.map((product) => (
                                        <CommandItem
                                            key={product.upc}
                                            value={product.upc}
                                            onSelect={() => {
                                                onSelect(product.upc)
                                                setOpen(false)
                                                setSearch('')
                                            }}
                                        >
                                            <div className="flex flex-col gap-1 w-full">
                                                <div className="flex justify-between w-full">
                                                    <span className="font-medium text-sm truncate max-w-[200px]" title={product.name}>{product.name}</span>
                                                    <span className="text-xs text-stone-500 whitespace-nowrap">{product.size}</span>
                                                </div>
                                                <div className="flex justify-between w-full">
                                                    <span className="text-xs font-semibold text-stone-600 truncate max-w-[150px]">{product.brand}</span>
                                                    <span className="text-xs text-stone-400 font-mono whitespace-nowrap">{product.upc}</span>
                                                </div>
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </>
                        )}
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
