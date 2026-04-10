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
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'log').mockImplementation(() => { })
        jest.spyOn(console, 'error').mockImplementation(() => { })
        process.env = { ...originalEnv };
    })

    afterEach(() => {
        process.env = originalEnv;
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
            delete process.env.AI_PROVIDER;
            delete process.env.AI_MODEL;
            delete process.env.AI_API_KEY;
            delete process.env.AI_BASE_URL;
            const settings = await getAISettings()
            expect(settings.provider).toBe('gemini')
            expect(settings.model).toBeUndefined()
        })

        it('should return configured settings', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_MODEL = 'gpt-4';
            process.env.AI_API_KEY = 'test-key';
            process.env.AI_BASE_URL = 'test-url';

            const settings = await getAISettings()
            expect(settings).toEqual({
                provider: 'openai',
                model: 'gpt-4',
                apiKey: 'test-key',
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
            process.env.AI_PROVIDER = 'openai';

            await expect(testAIConnection()).rejects.toThrow('API Key is missing')
        })

        it('should test gemini connection successfully', async () => {
            process.env.AI_PROVIDER = 'gemini';
            process.env.AI_API_KEY = 'test-key';

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock gemini response')
        })

        it('should test openai connection successfully', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock openai response')
        })

        it('should test local connection successfully', async () => {
            process.env.AI_PROVIDER = 'local';

            const result = await testAIConnection()
            expect(result.success).toBe(true)
            expect(result.message).toContain('mock openai response')
        })

        it('should handle API errors gracefully', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';

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
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';

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

        it('should handle API_KEY_INVALID specially', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';
                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: { completions: { create: jest.fn().mockRejectedValue(new Error('API_KEY_INVALID')) } },
                }))
            const result = await testAIConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('Invalid API Key')
        })

        it('should handle 404 error specially', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';
            const error404 = new Error('Not Found') as any
            error404.status = 404
                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: { completions: { create: jest.fn().mockRejectedValue(error404) } },
                }))
            const result = await testAIConnection()
            expect(result.success).toBe(false)
            expect(result.message).toContain('404 Not Found')
        })
    })

    describe('generateSocialPostAlternatives', () => {
        const promptParams = ['Some content', 'Twitter'] as const

        it('should throw error if API key missing', async () => {
            delete process.env.AI_PROVIDER;
            delete process.env.AI_MODEL;
            delete process.env.AI_API_KEY;
            delete process.env.AI_BASE_URL;
            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('AI API Key not found')
        })

        it('should generate alternatives via Gemini', async () => {
            process.env.AI_PROVIDER = 'gemini';
            process.env.AI_API_KEY = 'test-key';

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
            process.env.AI_PROVIDER = 'gemini';
            process.env.AI_API_KEY = 'test-key';

                ; (GoogleGenerativeAI as jest.Mock).mockImplementationOnce(() => ({
                    getGenerativeModel: jest.fn().mockReturnValue({
                        generateContent: jest.fn().mockRejectedValue(new Error('Internal API Error')),
                    }),
                }))

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('Gemini Error: Internal API Error')
        })

        it('should generate alternatives via OpenAI', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';

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
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockRejectedValue(new Error('Rate Limit')),
                        },
                    },
                }))

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('AI Error: Rate Limit')
        })

        it('should handle empty choices from OpenAI', async () => {
            process.env.AI_PROVIDER = 'openai';
            process.env.AI_API_KEY = 'test-key';
                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: { completions: { create: jest.fn().mockResolvedValue({ choices: [] }) } },
                }))
            await expect(generateSocialPostAlternatives('test', 'test')).rejects.toThrow('AI provider returned an empty response')
        })

        it('should throw unsupported provider error', async () => {
            process.env.AI_API_KEY = 'test-key';
            process.env.AI_PROVIDER = 'unsupported';

            await expect(generateSocialPostAlternatives(...promptParams)).rejects.toThrow('Unsupported AI provider: unsupported')
        })
    })
})
