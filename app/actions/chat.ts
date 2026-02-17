'use server'

import { prisma } from '@/lib/db'
import { getAISettings, getFinalBaseUrl } from './ai'
import { getConfig } from './settings'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { OpenAI } from 'openai'

export type ChatMessage = {
    role: 'user' | 'assistant' | 'system'
    content: string
}

/**
 * Extracts mentions from text and returns a context string for the AI.
 */
async function getChatContext(text: string) {
    const contextLines: string[] = []

    // Improved regex to catch @type:id or just @word
    // Patterns: @event:ID, @task:ID, @promotion:ID
    const mentionRegex = /@(event|task|promotion):([a-zA-Z0-9-]+)/gi
    let match

    const processedIds = new Set<string>()

    while ((match = mentionRegex.exec(text)) !== null) {
        const type = match[1].toLowerCase()
        const id = match[2]

        if (processedIds.has(id)) continue
        processedIds.add(id)

        try {
            if (type === 'event') {
                const event = await prisma.event.findUnique({
                    where: { id },
                    include: { location: true }
                })
                if (event) {
                    contextLines.push(`EVENT CONTEXT: Title: ${event.title}, Start: ${event.startTime}, End: ${event.endTime}, Location: ${event.location.name}, Description: ${event.description || 'N/A'}`)
                }
            } else if (type === 'task') {
                const task = await prisma.task.findUnique({
                    where: { id },
                    include: { assignee: true }
                })
                if (task) {
                    contextLines.push(`TASK CONTEXT: Title: ${task.title}, Status: ${task.status}, Due: ${task.dueDate || 'N/A'}, Assignee: ${task.assignee?.name || 'Unassigned'}, Description: ${task.description || 'N/A'}`)
                }
            } else if (type === 'promotion') {
                const promo = await prisma.promotionPeriod.findUnique({
                    where: { id }
                })
                if (promo) {
                    contextLines.push(`PROMOTION CONTEXT: Name: ${promo.name}, Start: ${promo.startDate}, End: ${promo.endDate}, Ad Live: ${promo.adLiveDate || 'N/A'}`)
                }
            }
        } catch (err) {
            console.error(`Error fetching context for ${type}:${id}`, err)
        }
    }

    return contextLines.join('\n')
}

/**
 * Sends a chat message to the configured AI provider.
 */
export async function sendChatMessage(messages: ChatMessage[]) {
    const settings = await getAISettings()
    const globalInstructions = await getConfig('AI_CHAT_INSTRUCTIONS') || 'You are a helpful assistant for the Promoty workspace management system.'

    if (settings.provider !== 'local' && !settings.apiKey) {
        throw new Error('AI API Key not found. Please configure it in the Admin Settings.')
    }

    const lastMessage = messages[messages.length - 1]
    const context = await getChatContext(lastMessage.content)

    const systemPrompt = `
${globalInstructions}

Current Context from Workspace:
${context || 'No specific entities mentioned.'}

Rules:
1. Use the provided context to answer questions accurately.
2. If you don't know the answer or the context is missing, say so politely.
3. Be concise and professional.
`

    try {
        if (settings.provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(settings.apiKey!)
            const model = genAI.getGenerativeModel({ model: settings.model || 'gemini-1.5-flash' })

            // Convert history for Gemini
            // Gemini expects: { role: 'user'|'model', parts: [{ text: '...' }] }
            const history = messages.slice(0, -1).map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }))

            const chat = model.startChat({
                history: history as any[], // Gemini SDK types can be strict
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            })

            // Inject system prompt into the first message or use it as a preamble if the SDK supports it
            // Current SDK version used here prefers startChat with systemInstruction if supported, 
            // but for broad compatibility we can also just prepend to the prompt.

            const promptWithSystem = `System Instructions: ${systemPrompt}\n\nUser Question: ${lastMessage.content}`
            const result = await chat.sendMessage(promptWithSystem)
            const response = await result.response
            return response.text()

        } else {
            // OpenAI or Local
            const finalBaseUrl = getFinalBaseUrl(settings.baseUrl, settings.provider)!
            const client = new OpenAI({
                apiKey: settings.apiKey || 'not-needed',
                baseURL: finalBaseUrl,
            })

            const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
                { role: 'system', content: systemPrompt },
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content
                }))
            ]

            const response = await client.chat.completions.create({
                model: settings.model || 'gpt-3.5-turbo',
                messages: chatMessages,
                temperature: 0.7,
            })

            return response.choices[0].message?.content || ''
        }
    } catch (err: any) {
        console.error('AI Chat Error:', err)
        throw new Error(`AI error: ${err.message || 'Unknown error'}`)
    }
}
