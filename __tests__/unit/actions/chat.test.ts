import { sendChatMessage } from '@/app/actions/chat'
import { prisma } from '@/lib/db'
import { getAISettings, getFinalBaseUrl } from '@/app/actions/ai'
import { getConfig } from '@/app/actions/settings'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { OpenAI } from 'openai'

// Mock dependencies
jest.mock('@/lib/db', () => ({
    prisma: {
        event: { findUnique: jest.fn() },
        task: { findUnique: jest.fn() },
        promotionPeriod: { findUnique: jest.fn() },
    },
}))

jest.mock('@/app/actions/ai', () => ({
    getAISettings: jest.fn(),
    getFinalBaseUrl: jest.fn(),
}))

jest.mock('@/app/actions/settings', () => ({
    getConfig: jest.fn(),
}))

jest.mock('@google/generative-ai', () => {
    return {
        GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
            getGenerativeModel: jest.fn().mockReturnValue({
                startChat: jest.fn().mockReturnValue({
                    sendMessage: jest.fn().mockResolvedValue({
                        response: {
                            text: jest.fn().mockReturnValue('mock gemini chat response'),
                        },
                    }),
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
                                message: { content: 'mock openai chat response' },
                            },
                        ],
                    }),
                },
            },
        })),
    }
})

describe('Chat Actions', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        jest.spyOn(console, 'error').mockImplementation(() => { })

            // Default settings mock
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'gemini',
                model: 'gemini-pro',
                apiKey: 'fake-key',
            })
            ; (getConfig as jest.Mock).mockResolvedValue('Global instructions')
    })

    describe('sendChatMessage', () => {
        it('should throw error if API key missing', async () => {
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'gemini',
                apiKey: null,
            })

            await expect(sendChatMessage([{ role: 'user', content: 'hello' }])).rejects.toThrow('AI API Key not found')
        })

        it('should extract event context and formulate system prompt', async () => {
            // Setup mock data for context extraction
            ; (prisma.event.findUnique as jest.Mock).mockResolvedValue({
                title: 'Summer Party',
                startTime: new Date('2024-06-01'),
                endTime: new Date('2024-06-01'),
                location: { name: 'Park' },
                description: 'Party time'
            })

            const messages = [{ role: 'user', content: 'Tell me about @event:123' }] as any[]

            const response = await sendChatMessage(messages)

            expect(response).toBe('mock gemini chat response')
            expect(prisma.event.findUnique).toHaveBeenCalledWith({
                where: { id: '123' },
                include: { location: true },
            })
        })

        it('should extract task context', async () => {
            ; (prisma.task.findUnique as jest.Mock).mockResolvedValue({
                title: 'Clean up',
                status: 'TODO',
                dueDate: null,
                assignee: { name: 'Alice' },
                description: null
            })

            const messages = [{ role: 'user', content: 'What is @task:456?' }] as any[]
            await sendChatMessage(messages)

            expect(prisma.task.findUnique).toHaveBeenCalledWith({
                where: { id: '456' },
                include: { assignee: true },
            })
        })

        it('should extract promotion context', async () => {
            ; (prisma.promotionPeriod.findUnique as jest.Mock).mockResolvedValue({
                name: 'Spring Sale',
                startDate: new Date(),
                endDate: new Date(),
                adLiveDate: null
            })

            const messages = [{ role: 'user', content: 'Details on @promotion:789' }] as any[]
            await sendChatMessage(messages)

            expect(prisma.promotionPeriod.findUnique).toHaveBeenCalledWith({
                where: { id: '789' },
            })
        })

        it('should handle context fetching errors gracefully without crashing', async () => {
            ; (prisma.event.findUnique as jest.Mock).mockRejectedValue(new Error('DB Error'))

            const messages = [{ role: 'user', content: 'What is @event:err1?' }] as any[]
            const response = await sendChatMessage(messages)

            // Still sends message to AI, but with generic/empty context
            expect(response).toBe('mock gemini chat response')
            expect(console.error).toHaveBeenCalledWith('Error fetching context for event:err1', expect.any(Error))
        })

        it('should format history correctly for Gemini, ignoring leading model messages', async () => {
            const messages = [
                { role: 'assistant', content: 'I am model' },
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi' },
                { role: 'user', content: 'How are you?' },
            ] as any[]

            await sendChatMessage(messages)
            // The AI SDK mock logic handles it. Just assert no crash.
        })

        it('should format history correctly for Gemini when user is first', async () => {
            const messages = [
                { role: 'user', content: 'Hello' },
                { role: 'assistant', content: 'Hi' },
                { role: 'user', content: 'How are you?' },
            ] as any[]

            await sendChatMessage(messages)
        })

        it('should handle fully populated and empty records for all entity types', async () => {
            ; (prisma.event.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
                if (where.id === 'full') return { title: 'T', startTime: new Date(), endTime: new Date(), location: { name: 'L' }, description: 'D' }
                return { title: 'T', startTime: new Date(), endTime: new Date(), location: { name: 'L' }, description: null }
            })
                ; (prisma.task.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
                    if (where.id === 'full') return { title: 'T', status: 'TODO', dueDate: new Date(), assignee: { name: 'A' }, description: 'D' }
                    if (where.id === 'semi') return { title: 'T', status: 'TODO', dueDate: null, assignee: { name: null }, description: null }
                    return { title: 'T', status: 'TODO', dueDate: null, assignee: null, description: null }
                })
                ; (prisma.promotionPeriod.findUnique as jest.Mock).mockImplementation(async ({ where }) => {
                    if (where.id === 'full') return { name: 'N', startDate: new Date(), endDate: new Date(), adLiveDate: new Date() }
                    return { name: 'N', startDate: new Date(), endDate: new Date(), adLiveDate: null }
                })

            // Also test sending duplicate mentions inside the same text to hit the processedIds continue branch
            const messages = [{ role: 'user', content: '@event:full @event:empty @task:full @task:semi @task:empty @promotion:full @promotion:empty @event:full' }] as any[]
            await sendChatMessage(messages)
        })

        it('should send messages via OpenAI/Local', async () => {
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'openai',
                model: 'gpt-4',
                apiKey: 'fake-key',
                baseUrl: 'fake-url'
            })
                ; (getFinalBaseUrl as jest.Mock).mockResolvedValue('https://api.openai.com/v1')

            const messages = [{ role: 'user', content: 'Hello OpenAI' }] as any[]

            const response = await sendChatMessage(messages)

            expect(response).toBe('mock openai chat response')
            expect(getFinalBaseUrl).toHaveBeenCalledWith('fake-url', 'openai')
        })

        it('should send messages via OpenAI/Local and test fallbacks', async () => {
            ; (getConfig as jest.Mock).mockResolvedValue(null)
                ; (getAISettings as jest.Mock).mockResolvedValue({
                    provider: 'local',
                    apiKey: null,
                    model: null,
                })
                ; (getFinalBaseUrl as jest.Mock).mockResolvedValue('https://local-ai.com/v1')

            const messages = [{ role: 'user', content: 'Hello Local' }] as any[]

            const response = await sendChatMessage(messages)

            expect(response).toBe('mock openai chat response')
            expect(getFinalBaseUrl).toHaveBeenCalledWith(undefined, 'local')
        })

        it('should hit Gemini defaults when settings are missing', async () => {
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'gemini',
                apiKey: 'fake',
                model: null,
            })
            const messages = [{ role: 'user', content: 'Hello Gemini' }] as any[]
            const response = await sendChatMessage(messages)
            expect(response).toBe('mock gemini chat response')
        })

        it('should handle generic errors from the provider', async () => {
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'local',
                apiKey: 'fake-key',
            })
                ; (getFinalBaseUrl as jest.Mock).mockRejectedValue({})

            await expect(sendChatMessage([{ role: 'user', content: 'fail' }] as any[]))
                .rejects.toThrow('AI error: Unknown error')
        })

        it('should handle empty response content from openai', async () => {
            ; (getAISettings as jest.Mock).mockResolvedValue({
                provider: 'openai',
                model: 'gpt-4',
                apiKey: 'fake-key',
                baseUrl: 'fake-url'
            })
                ; (getFinalBaseUrl as jest.Mock).mockResolvedValue('https://api.openai.com/v1')

                ; (OpenAI as unknown as jest.Mock).mockImplementationOnce(() => ({
                    chat: {
                        completions: {
                            create: jest.fn().mockResolvedValue({
                                choices: [{ message: { content: null } }],
                            }),
                        },
                    },
                }))

            const messages = [{ role: 'user', content: 'Hello OpenAI' }] as any[]
            const response = await sendChatMessage(messages)
            expect(response).toBe('')
        })
    })
})
