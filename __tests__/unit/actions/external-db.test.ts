import { testExternalConnection, getExternalProducts, getExternalProductByUPC, getExternalProductsByUPCs, getExternalBrands, getExternalProductsByBrand } from '@/app/actions/external-db'
import { getConfig } from '@/app/actions/settings'
import sql from 'mssql'

// Mock dependencies
jest.mock('@/app/actions/settings', () => ({
    getConfig: jest.fn(),
}))

jest.mock('mssql', () => {
    const mockRequest = {
        query: jest.fn(),
        input: jest.fn().mockReturnThis(),
    }
    const mockPool = {
        request: jest.fn().mockReturnValue(mockRequest),
        close: jest.fn(),
    }
    return {
        connect: jest.fn().mockResolvedValue(mockPool),
        NVarChar: 'NVarChar',
        Int: 'Int',
    }
})

describe('External DB Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })
        jest.spyOn(console, 'log').mockImplementation(() => { })
    })

    describe('testExternalConnection', () => {
        it('should return error if config is invalid', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)

            const result = await testExternalConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Invalid MSSQL configuration')
        })

        it('should test connection successfully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = { query: jest.fn().mockResolvedValue({}) }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            const result = await testExternalConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('Successfully connected')
            expect(sql.connect).toHaveBeenCalled()
        })

        it('should handle jdbc style url for server extraction', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'jdbc:sqlserver://my-server.com:1433'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })
            const mockRequest = { query: jest.fn().mockResolvedValue({}) }
            const mockPool = { request: jest.fn().mockReturnValue(mockRequest), close: jest.fn() }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            const result = await testExternalConnection()
            expect(result.success).toBe(true)
            expect(sql.connect).toHaveBeenCalledWith(expect.objectContaining({
                server: 'my-server.com'
            }))
        })

        it('should handle missing user, password, and database config defaults', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return null
            })

            const mockRequest = { query: jest.fn().mockResolvedValue({}) }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            const result = await testExternalConnection()
            expect(result.success).toBe(true)
            expect(sql.connect).toHaveBeenCalledWith(expect.objectContaining({
                user: '',
                password: '',
                database: 'ProductsDB'
            }))
        })

        it('should handle connection errors explicitly', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

                ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Connection timeout'))

            const result = await testExternalConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Connection failed: Connection timeout')
        })
    })

    describe('getExternalProducts', () => {
        it('should return empty array if config is invalid', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)

            const result = await getExternalProducts()
            expect(result.products).toEqual([])
            expect(result.totalCount).toBe(0)
        })

        it('should fetch external products with pagination', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            // Mock Promise.all results
            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [
                        { upc: '12345', brand: 'Brand A', size: '10 oz', department: 'Grocery', name: 'Prod A' },
                    ],
                })
                .mockResolvedValueOnce({
                    recordset: [{ count: 1 }],
                })

            const result = await getExternalProducts(1, 10, '')

            expect(result.products).toHaveLength(1)
            expect(result.products[0].name).toBe('Prod A')
            expect(result.totalCount).toBe(1)
            expect(mockRequest.input).toHaveBeenCalledWith('offset', 'Int', 0)
            expect(mockRequest.input).toHaveBeenCalledWith('pageSize', 'Int', 10)
        })

        it('should apply search filter and pass it to count query', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query
                .mockResolvedValueOnce({ recordset: [] })
                .mockResolvedValueOnce({ recordset: [{ count: 0 }] })

            await getExternalProducts(1, 10, 'search-term')

            expect(mockRequest.input).toHaveBeenCalledWith('search', 'NVarChar', '%search-term%')
        })

        it('should handle undefined fields gracefully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query
                .mockResolvedValueOnce({
                    recordset: [{}],
                })
                .mockResolvedValueOnce({
                    recordset: [{ count: 1 }],
                })

            const result = await getExternalProducts(1, 10, '')

            expect(result.products).toHaveLength(1)
            expect(result.products[0]).toEqual({
                upc: '',
                brand: '',
                size: '',
                department: '',
                name: 'Unknown Product'
            })
        })

        it('should handle fetch errors gracefully and return mock error product', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

                ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await getExternalProducts()

            expect(result.products).toHaveLength(1)
            expect(result.products[0].upc).toBe('ERR')
            expect(result.totalCount).toBe(0)
            expect(console.error).toHaveBeenCalled()
        })
    })

    describe('getExternalProductByUPC', () => {
        it('should return null if config is invalid', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)

            const result = await getExternalProductByUPC('12345')
            expect(result).toBeNull()
        })

        it('should fetch single external product by UPC', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            const mockProduct = { F01: '12345', F155: 'Brand A', F29: 'Prod A' }
            mockRequest.query.mockResolvedValueOnce({
                recordset: [mockProduct],
            })

            const result = await getExternalProductByUPC('12345')

            expect(result).toEqual(mockProduct)
            expect(mockRequest.input).toHaveBeenCalledWith('upc', 'NVarChar', '12345')
        })

        it('should return null if no product found', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = {
                input: jest.fn().mockReturnThis(),
                query: jest.fn(),
            }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query.mockResolvedValueOnce({
                recordset: [],
            })

            const result = await getExternalProductByUPC('99999')

            expect(result).toBeNull()
        })

        it('should handle fetch errors gracefully and return null', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

                ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await getExternalProductByUPC('12345')

            expect(result).toBeNull()
            expect(console.error).toHaveBeenCalled()
        })
    })

    describe('getExternalBrands', () => {
        it('should return empty array if config is invalid', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)
            const result = await getExternalBrands()
            expect(result).toEqual([])
        })

        it('should fetch external brands', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = { query: jest.fn() }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ brand: 'Brand A' }, { brand: 'Brand B' }],
            })

            const result = await getExternalBrands()
            expect(result).toEqual(['Brand A', 'Brand B'])
        })

        it('should handle fetch errors gracefully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })
                ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await getExternalBrands()
            expect(result).toEqual([])
        })
    })

    describe('getExternalProductsByBrand', () => {
        it('should return empty array if config is invalid', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)
            const result = await getExternalProductsByBrand('Brand A')
            expect(result).toEqual([])
        })

        it('should fetch external products by brand', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn() }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{ upc: '123', brand: 'Brand A', name: 'Prod A', size: '', department: '' }],
            })

            const result = await getExternalProductsByBrand('Brand A')
            expect(result).toHaveLength(1)
            expect(mockRequest.input).toHaveBeenCalledWith('brand', 'NVarChar', 'Brand A')
        })

        it('should handle undefined fields gracefully in brand products', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })

            const mockRequest = { input: jest.fn().mockReturnThis(), query: jest.fn() }
            const mockPool = {
                request: jest.fn().mockReturnValue(mockRequest),
                close: jest.fn(),
            }
                ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

            mockRequest.query.mockResolvedValueOnce({
                recordset: [{}],
            })

            const result = await getExternalProductsByBrand('Brand A')
            expect(result).toHaveLength(1)
            expect(result[0].name).toBe('Unknown Product')
        })

        it('should handle fetch errors gracefully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'EXTERNAL_DB_URL') return 'test-server'
                if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
                return 'test-val'
            })
                ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

            const result = await getExternalProductsByBrand('Brand A')
            expect(result).toEqual([])
        })
    })
})

describe('getExternalProductsByUPCs', () => {
    it('should return empty array if config is invalid', async () => {
        ; (getConfig as jest.Mock).mockResolvedValue(null)

        const result = await getExternalProductsByUPCs(['123', '456'])
        expect(result).toEqual([])
    })

    it('should return empty array if no UPCs provided', async () => {
        const result = await getExternalProductsByUPCs([])
        expect(result).toEqual([])
    })

    it('should return empty array if over 2000 UPCs provided', async () => {
        const result = await getExternalProductsByUPCs(Array(2001).fill('123'))
        expect(result).toEqual([])
    })

    it('should fetch multiple external products by UPCs', async () => {
        ; (getConfig as jest.Mock).mockImplementation((key) => {
            if (key === 'EXTERNAL_DB_URL') return 'test-server'
            if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
            return 'test-val'
        })

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }
        const mockPool = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn(),
        }
            ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

        const mockProducts = [
            { upc: '123', brand: 'Brand A', name: 'Prod A', size: '', department: '' },
            { upc: '456', brand: 'Brand B', name: 'Prod B', size: '', department: '' }
        ]

        mockRequest.query.mockResolvedValueOnce({
            recordset: mockProducts,
        })

        const result = await getExternalProductsByUPCs(['123', '456'])

        expect(result).toEqual(mockProducts)
        expect(mockRequest.input).toHaveBeenCalledWith('upc0', 'NVarChar', '123')
        expect(mockRequest.input).toHaveBeenCalledWith('upc1', 'NVarChar', '456')
        expect(mockRequest.query).toHaveBeenCalledWith(expect.stringContaining("IN (@upc0,@upc1)"))
    })

    it('should handle undefined fields gracefully in UPC products', async () => {
        ; (getConfig as jest.Mock).mockImplementation((key) => {
            if (key === 'EXTERNAL_DB_URL') return 'test-server'
            if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
            return 'test-val'
        })

        const mockRequest = {
            input: jest.fn().mockReturnThis(),
            query: jest.fn(),
        }
        const mockPool = {
            request: jest.fn().mockReturnValue(mockRequest),
            close: jest.fn(),
        }
            ; (sql.connect as jest.Mock).mockResolvedValueOnce(mockPool)

        mockRequest.query.mockResolvedValueOnce({
            recordset: [{}],
        })

        const result = await getExternalProductsByUPCs(['123'])

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('Unknown Product')
    })

    it('should handle fetch errors gracefully and return empty array', async () => {
        ; (getConfig as jest.Mock).mockImplementation((key) => {
            if (key === 'EXTERNAL_DB_URL') return 'test-server'
            if (key === 'EXTERNAL_DB_TYPE') return 'mssql'
            return 'test-val'
        })

            ; (sql.connect as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

        const result = await getExternalProductsByUPCs(['123'])

        expect(result).toEqual([])
        expect(console.error).toHaveBeenCalled()
    })
})
