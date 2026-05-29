'use server'
import { getSession } from '@/lib/session'

import { GoogleGenerativeAI } from '@google/generative-ai'
import { OpenAI } from 'openai'

/**
 * Gets the configured AI provider settings from the database.
 */
/**
 * Fetches available models from a local LLM endpoint (OpenAI compatible).
 */
export async function fetchLocalModels(baseUrl: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    try {
        const url = await getFinalBaseUrl(baseUrl, 'openai')!;
        // The models endpoint is usually at /v1/models or just /models depending on the server
        // standardized openai is /v1/models. getFinalBaseUrl adds /v1.
        const response = await fetch(`${url}/models`);

        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.statusText}`);
        }

        const data = await response.json();
        // Standard OpenAI response: { data: [{ id: 'model-id', ... }] }
        if (data && Array.isArray(data.data)) {
            return data.data.map((m: { id: string }) => m.id);
        }
        return [];
    } catch (err: any) {
        console.error('Fetch Models Error:', err);
        throw new Error(`Failed to connect to local server: ${err.message}`);
    }
}

/**
 * Fetches available models from Google Gemini.
 */
export async function fetchGeminiModels(apiKey: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    console.log('Fetching Gemini models...');
    try {
        // v1beta is often needed for the latest models, but v1 is more stable.
        // The user's error mentioned v1beta, so we'll try to list from there.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Failed to fetch Gemini models: ${response.statusText}`);
        }

        const data = await response.json();
        if (data && Array.isArray(data.models)) {
            return data.models
                .filter((m: { name: string, supportedGenerationMethods?: string[] }) => m.supportedGenerationMethods?.includes('generateContent'))
                .map((m: { name: string }) => m.name.replace('models/', ''));
        }
        return [];
    } catch (err: any) {
        console.error('Fetch Gemini Models Error:', err);
        throw new Error(`Failed to fetch Gemini models: ${err.message}`);
    }
}

/**
 * Gets the configured AI provider settings from the database.
 */
/**
 * Gets the configured AI provider settings from the database.
 */
export async function getAISettings() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const provider = process.env.AI_PROVIDER || 'gemini'
    const model = process.env.AI_MODEL
    const apiKey = process.env.AI_API_KEY
    const baseUrl = process.env.AI_BASE_URL

    return { provider, model, apiKey, baseUrl }
}

/**
 * Normalizes local URLs for Ollama/LMStudio compatibility.
 */
/**
 * Normalizes local URLs for Ollama/LMStudio compatibility.
 */
export async function getFinalBaseUrl(baseUrl: string | null | undefined, provider: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (provider !== 'openai' && provider !== 'local') return undefined

    let url = baseUrl || (provider === 'local' ? 'http://127.0.0.1:1234' : 'https://api.openai.com/v1')

    // Ensure it ends with /v1 if it looks like a base root
    if (!url.endsWith('/v1') && !url.endsWith('/v1/')) {
        // Simple heuristic: if it doesn't end in v1, append it. 
        // Users might provide http://localhost:11434 -> http://localhost:11434/v1
        url = url.replace(/\/+$/, '') + '/v1'
    }
    return url
}

/**
 * Tests the AI connection by sending a simple prompt.
 */
export async function testAIConnection() {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const settings = await getAISettings()

    if (settings.provider !== 'local' && !settings.apiKey) {
        throw new Error('API Key is missing.')
    }

    const prompt = "Respond with exactly the word 'OK' and nothing else."

    try {
        if (settings.provider === 'gemini') {
            const genAI = new GoogleGenerativeAI(settings.apiKey!)
            const model = genAI.getGenerativeModel({ model: settings.model || 'gemini-1.5-flash' })
            const result = await model.generateContent(prompt)
            const text = result.response.text().trim()
            return { success: true, message: `Connected to Gemini! Response: ${text}` }
        } else {
            // Local or OpenAI
            const finalBaseUrl = await getFinalBaseUrl(settings.baseUrl, settings.provider)!
            const client = new OpenAI({
                apiKey: settings.apiKey || 'not-needed', // Local LLMs might accept any string
                baseURL: finalBaseUrl,
            })
            const response = await client.chat.completions.create({
                model: settings.model || 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 5,
            })
            if (!response.choices?.[0]) {
                const modelName = settings.model || 'gpt-3.5-turbo'
                return {
                    success: false,
                    message: `AI provider returned an empty response (URL: ${finalBaseUrl}, Model: ${modelName}). Check your local server.`
                }
            }
            const text = response.choices[0].message?.content?.trim() || ''
            return { success: true, message: `Connected! Response: ${text}` }
        }
    } catch (err: any) {
        console.error('AI Test Connection Error:', err)
        // Check for specific error types to give better advice
        let advice = ''
        if (err.message?.includes('fetch failed')) {
            advice = ' (Connection refused. Is your local LLM server running?)'
        } else if (err.status === 404 || err.message?.includes('404')) {
            advice = ' (404 Not Found. Check if the Model Name is correct and available for your account.)'
        } else if (err.message?.includes('API_KEY_INVALID')) {
            advice = ' (Invalid API Key. Please check your credentials.)'
        }
        return { success: false, message: (err.message || 'Connection failed') + advice }
    }
}

/**
 * Common interface for generating text alternatives across different providers.
 */
export async function generateSocialPostAlternatives(content: string, platform: string) {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    const settings = await getAISettings()

    if (settings.provider !== 'local' && !settings.apiKey) {
        throw new Error('AI API Key not found. Please configure it in the Settings page.')
    }

    const prompt = `
        You are a social media expert. 
        Generate 3 engaging alternatives for the following social media post on ${platform}.
        The alternatives should vary in tone (e.g., professional, enthusiastic, concise).
        Return only the 3 alternatives, separated by a unique delimiter: "---ALTERNATIVE---".
        Do not include any other text or explanations.

        Original Content:
        ${content}
    `

    if (settings.provider === 'gemini') {
        return callGemini(prompt, settings.model || 'gemini-1.5-flash', settings.apiKey!)
    } else if (settings.provider === 'openai' || settings.provider === 'local') {
        return callOpenAI(
            prompt,
            settings.model || 'gpt-3.5-turbo',
            settings.apiKey || 'not-needed',
            settings.baseUrl || undefined,
            settings.provider
        )
    } else {
        throw new Error(`Unsupported AI provider: ${settings.provider}`)
    }
}

/**
 * Helper to call Google Gemini API
 */
async function callGemini(prompt: string, modelName: string, apiKey: string) {
    try {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent(prompt)
        const text = result.response.text()

        return parseAlternatives(text)
    } catch (err: any) {
        console.error('Gemini API Error:', err)
        throw new Error(`Gemini Error: ${err.message || 'Unknown error'}`)
    }
}

/**
 * Helper to call OpenAI-compatible API (including local models)
 */
async function callOpenAI(prompt: string, modelName: string, apiKey: string, baseUrl?: string, provider?: string) {
    try {
        const finalBaseUrl = await getFinalBaseUrl(baseUrl || null, provider || 'openai')
        const client = new OpenAI({
            apiKey: apiKey,
            baseURL: finalBaseUrl,
        })

        const response = await client.chat.completions.create({
            model: modelName,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        })

        if (!response.choices?.[0]) {
            throw new Error(`AI provider returned an empty response. (URL: ${finalBaseUrl}, Model: ${modelName})`)
        }
        const text = response.choices[0].message?.content || ''
        return parseAlternatives(text)
    } catch (err: any) {
        console.error('OpenAI-compatible API Error:', err)
        throw new Error(`AI Error: ${err.message || 'Unknown error'}`)
    }
}

/**
 * Parses the delimited string into an array of alternatives.
 */
function parseAlternatives(text: string): string[] {
    return text
        .split('---ALTERNATIVE---')
        .map(a => a.trim())
        .filter(a => a.length > 0)
        .slice(0, 3)
}
