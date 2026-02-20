import {
    fetchLocalModels,
    fetchGeminiModels,
    getAISettings,
    getFinalBaseUrl,
    testAIConnection,
    generateSocialPostAlternatives,
} from '@/app/actions/ai'
import { getConfig } from '@/app/actions/settings'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { OpenAI } from 'openai'

// Mock dependencies
jest.mock('@/app/actions/settings', () => ({
    getConfig: jest.fn(),
}))

jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                generateContent: jest.fn().mockResolvedValue({
                    response: {
                        text: jest.fn().mockReturnValue('mock gemini response'),
                    },
                }),
            }),
        })),
    }
})

jest.mock('openai', () => {
    return {
        OpenAI: jest.fn().mockImplementation(() => ({
            chat: {
                completions: {
                    create: jest.fn().mockResolvedValue({
                        choices: [
                            {
                                message: { content: 'mock openai response' },
                            },
                        ],
                    }),
                },
            },
        })),
    }
})

// Mock global fetch
global.fetch = jest.fn()

describe('AI Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'log').mockImplementation(() => { })
        jest.spyOn(console, 'error').mockImplementation(() => { })
    })

    describe('fetchLocalModels', () => {
        it('should fetch local models successfully', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [{ id: 'model-a' }, { id: 'model-b' }],
                }),
            })

            const models = await fetchLocalModels('http://localhost:11434')
            expect(models).toEqual(['model-a', 'model-b'])
            expect(global.fetch).toHaveBeenCalledWith('http://localhost:11434/v1/models')
        })

        it('should handle fetch failure', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                statusText: 'Not Found',
            })

            await expect(fetchLocalModels('http://localhost:11434')).rejects.toThrow('Failed to connect to local server')
        })

        it('should handle missing data array gracefully', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({ someOtherKey: [] }),
            })

            const models = await fetchLocalModels('http://localhost:11434')
            expect(models).toEqual([])
        })
    })

    describe('fetchGeminiModels', () => {
        it('should fetch gemini models successfully', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    models: [
                        { name: 'models/gemini-pro', supportedGenerationMethods: ['generateContent'] },
                        { name: 'models/gemini-vision', supportedGenerationMethods: [] },
                    ],
                }),
            })

            const models = await fetchGeminiModels('fake-api-key')
            expect(models).toEqual(['gemini-pro'])
            expect(global.fetch).toHaveBeenCalledWith('https://generativelanguage.googleapis.com/v1beta/models?key=fake-api-key')
        })

        it('should handle fetch failure', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: { message: 'Invalid API Key' } }),
            })

            await expect(fetchGeminiModels('invalid-key')).rejects.toThrow('Failed to fetch Gemini models: Invalid API Key')
        })

        it('should handle missing models array gracefully', async () => {
            ; (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: async () => ({}),
            })

            const models = await fetchGeminiModels('fake-key')
            expect(models).toEqual([])
        })
    })

    describe('getAISettings', () => {
        it('should return default provider if no config', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)
            const settings = await getAISettings()
            expect(settings.provider).toBe('gemini')
            expect(settings.model).toBeNull()
        })

        it('should return configured settings', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_MODEL') return 'gpt-4'
                if (key === 'AI_API_KEY') return 'sk-test'
                if (key === 'AI_BASE_URL') return 'test-url'
                return null
            })

            const settings = await getAISettings()
            expect(settings).toEqual({
                provider: 'openai',
                model: 'gpt-4',
                apiKey: 'sk-test',
                baseUrl: 'test-url',
            })
        })
    })

    describe('getFinalBaseUrl', () => {
        it('should return undefined for unsupported providers', async () => {
            expect(await getFinalBaseUrl(null, 'gemini')).toBeUndefined()
        })

        it('should default for local', async () => {
            expect(await getFinalBaseUrl(null, 'local')).toBe('http://127.0.0.1:1234/v1')
        })

        it('should default for openai', async () => {
            expect(await getFinalBaseUrl(null, 'openai')).toBe('https://api.openai.com/v1')
        })

        it('should append /v1 if missing', async () => {
            expect(await getFinalBaseUrl('http://localhost:11434', 'local')).toBe('http://localhost:11434/v1')
            expect(await getFinalBaseUrl('http://localhost:11434/', 'local')).toBe('http://localhost:11434/v1')
        })

        it('should not append /v1 if already present', async () => {
            expect(await getFinalBaseUrl('http://localhost:11434/v1', 'local')).toBe('http://localhost:11434/v1')
        })
    })

    describe('testAIConnection', () => {
        it('should throw error if API key missing (non-local)', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                return null
            })

            await expect(testAIConnection()).rejects.toThrow('API Key is missing')
        })

        it('should test gemini connection successfully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'gemini'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock gemini response')
        })

        it('should test openai connection successfully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock openai response')
        })

        it('should test local connection successfully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'local'
                return null
            })

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock openai response')
        })

        it('should handle API errors gracefully', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockRejectedValue(new Error('fetch failed')),
                        },
                    },
                }))

            const result = await testAIConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Connection refused')
        })

        it('should handle empty choices gracefully in OpenAI', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockResolvedValue({ choices: [] }),
                        },
                    },
                }))

            const result = await testAIConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('empty response')
        })
    })

    describe('generateSocialPostAlternatives', () => {
        const promptParams = ['Some content', 'Twitter'] as const

        it('should throw error if API key missing', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)
            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('AI API Key not found')
        })

        it('should generate alternatives via Gemini', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'gemini'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
                    getGenerativeModel: jest.fn().mockReturnValue({
                        generateContent: jest.fn().mockResolvedValue({
                            response: {
                                text: jest.fn().mockReturnValue('Alt 1\n---ALTERNATIVE---\nAlt 2\n---ALTERNATIVE---\nAlt 3'),
                            },
                        }),
                    }),
                }))

            const result = await generateSocialPostAlternatives(...promptParams)
            expect(result).toHaveLength(3)
            expect(result).toEqual(['Alt 1', 'Alt 2', 'Alt 3'])
        })

        it('should handle Gemini generation errors', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'gemini'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
                    getGenerativeModel: jest.fn().mockReturnValue({
                        generateContent: jest.fn().mockRejectedValue(new Error('Internal API Error')),
                    }),
                }))

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('Gemini Error: Internal API Error')
        })

        it('should generate alternatives via OpenAI', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockResolvedValue({
                                choices: [{ message: { content: 'Alt A\n---ALTERNATIVE---\nAlt B' } }],
                            }),
                        },
                    },
                }))

            const result = await generateSocialPostAlternatives(...promptParams)
            expect(result).toEqual(['Alt A', 'Alt B'])
        })

        it('should handle OpenAI generation errors', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'openai'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockRejectedValue(new Error('Rate Limit')),
                        },
                    },
                }))

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('AI Error: Rate Limit')
        })

        it('should throw unsupported provider error', async () => {
            ; (getConfig as jest.Mock).mockImplementation((key) => {
                if (key === 'AI_PROVIDER') return 'unsupported'
                if (key === 'AI_API_KEY') return 'test-key'
                return null
            })

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('Unsupported AI provider: unsupported')
        })
    })
})
