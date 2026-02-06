'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Check, Sparkles, Globe, Key, Cpu, Loader2 } from 'lucide-react'
import { getConfig, updateConfig } from '@/app/actions/settings'
import { testAIConnection, fetchLocalModels } from '@/app/actions/ai'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// NCG Brand Colors
const THEMES = [
    { name: 'NCG Dark Green (Default)', primary: '#007934', secondary: '#7AB800' },
    { name: 'NCG Light Green', primary: '#7AB800', secondary: '#007934' },
    { name: 'NCG Orange', primary: '#FF5800', secondary: '#FFA100' },
    { name: 'NCG Dark Purple', primary: '#622567', secondary: '#B382C7' },
    { name: 'NCG Dark Blue', primary: '#005293', secondary: '#00B0CA' },
    { name: 'NCG Red', primary: '#D50032', secondary: '#1e1e1e' },
]

export default function SettingsPage() {
    const [primaryColor, setPrimaryColor] = useState('#007934')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedPrimary = localStorage.getItem('theme-primary')
        if (savedPrimary) {
            setPrimaryColor(savedPrimary)
        }
    }, [])

    const handleThemeChange = (color: string) => {
        setPrimaryColor(color)
        localStorage.setItem('theme-primary', color)
        document.documentElement.style.setProperty('--primary', color)
        document.documentElement.style.setProperty('--ring', color)
        document.documentElement.style.setProperty('--sidebar-primary', color)
        document.documentElement.style.setProperty('--sidebar-ring', color)
    }

    if (!mounted) return null

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-3xl font-bold">Settings</h1>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>
                            Customize the look and feel of the application.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label>Theme Color</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {THEMES.map((theme) => (
                                    <button
                                        key={theme.primary}
                                        onClick={() => handleThemeChange(theme.primary)}
                                        className={`
                                            relative flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all hover:bg-slate-50
                                            ${primaryColor === theme.primary ? 'border-primary bg-slate-50' : 'border-transparent'}
                                        `}
                                    >
                                        <div
                                            className="h-10 w-full rounded-md shadow-sm border"
                                            style={{ backgroundColor: theme.primary }}
                                        />
                                        <span className="text-xs font-medium text-slate-600 text-center">{theme.name}</span>
                                        {primaryColor === theme.primary && (
                                            <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                                                <Check className="h-3 w-3 text-primary" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 rounded-lg bg-slate-50 border space-y-4">
                            <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">Preview</div>
                            <div className="flex gap-4">
                                <Button>Primary Button</Button>
                                <Button variant="secondary">Secondary Button</Button>
                                <Button variant="outline">Outline Button</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>AI Configuration</CardTitle>
                        <CardDescription>
                            Configure your AI provider for suggestions and automation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AIConfig />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile Settings</CardTitle>
                        <CardDescription>Manage your user profile information.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">User profile management is coming soon.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

function AIConfig() {
    const [provider, setProvider] = useState('gemini')
    const [model, setModel] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [testing, setTesting] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'testing', message: string } | null>(null)
    const [testResult, setTestResult] = useState<{ success: boolean, message: string } | null>(null)

    useEffect(() => {
        async function loadConfig() {
            try {
                const p = await getConfig('AI_PROVIDER')
                const m = await getConfig('AI_MODEL')
                const k = await getConfig('AI_API_KEY')
                const b = await getConfig('AI_BASE_URL')

                if (p) setProvider(p)
                if (m) setModel(m)
                if (k) setApiKey(k)
                if (b) setBaseUrl(b)

                if (!k) {
                    const legacyKey = await getConfig('GEMINI_API_KEY')
                    if (legacyKey) setApiKey(legacyKey)
                }
            } catch (err) {
                console.error('Failed to load AI config:', err)
            } finally {
                setLoading(false)
            }
        }
        loadConfig()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setStatus(null)
        try {
            await updateConfig('AI_PROVIDER', provider)
            await updateConfig('AI_MODEL', model)
            await updateConfig('AI_API_KEY', apiKey)
            await updateConfig('AI_BASE_URL', baseUrl)
            setStatus({ type: 'success', message: 'AI configuration saved successfully.' })

            // Run test connection
            setTesting(true)
            setStatus({ type: 'testing', message: 'Testing connection to AI provider...' })
            try {
                const result = await testAIConnection()
                setTestResult(result)
                if (result.success) {
                    setStatus({ type: 'success', message: `Saved & Verified: ${result.message}` })
                } else {
                    setStatus({ type: 'error', message: `Saved but Error: ${result.message}` })
                }
            } catch (err: any) {
                setStatus({ type: 'error', message: `Saved but failed to test: ${err.message}` })
            } finally {
                setTesting(false)
            }
        } catch (err) {
            console.error('Failed to save AI config:', err)
            setStatus({ type: 'error', message: 'Failed to save configuration.' })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI configuration...
        </div>
    )

    return (
        <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-400" />
                        AI Provider
                    </Label>
                    <Select value={provider} onValueChange={(val) => {
                        setProvider(val)
                        if (val === 'local') {
                            setBaseUrl('http://127.0.0.1:1234')
                        }
                    }}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="openai">OpenAI (Original)</SelectItem>
                            <SelectItem value="local">Local LLM (Ollama, LM Studio)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-slate-400" />
                        Model Name
                    </Label>
                    <div className="flex gap-2">
                        {provider === 'local' ? (
                            <ModelSelector
                                baseUrl={baseUrl || 'http://127.0.0.1:1234'}
                                value={model}
                                onChange={setModel}
                            />
                        ) : (
                            <Input
                                placeholder={provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-3.5-turbo'}
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-slate-400" />
                    API Key {provider === 'local' && <span className="text-xs font-normal text-muted-foreground">(Optional for Local)</span>}
                </Label>
                <Input
                    type="password"
                    placeholder={provider === 'local' ? "Optional" : "Enter API Key"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="font-mono"
                    required={provider !== 'local'}
                />
                {provider === 'gemini' && (
                    <p className="text-[10px] text-muted-foreground">
                        Get your key from the <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-primary hover:underline font-medium">Google AI Studio</a>.
                    </p>
                )}
            </div>

            {(provider === 'openai' || provider === 'local') && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-slate-400" />
                        Base URL
                    </Label>
                    <Input
                        placeholder="http://localhost:11434/v1"
                        value={baseUrl}
                        onChange={(e) => setBaseUrl(e.target.value)}
                        className="font-mono text-sm"
                    />
                    <p className="text-[10px] text-muted-foreground">
                        {provider === 'local'
                            ? "Point this to your local server (e.g. http://127.0.0.1:1234 for LM Studio or http://localhost:11434 for Ollama)."
                            : "Use this for custom OpenAI-compatible endpoints."}
                    </p>
                </div>
            )}

            <div className="pt-2 flex flex-col gap-4">
                <Button type="submit" disabled={saving} className="w-full md:w-auto min-w-[120px]">
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save AI Settings'
                    )}
                </Button>

                {status && (
                    <div className={`p-3 rounded-lg text-sm flex items-start gap-2 animate-in fade-in slide-in-from-top-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                        status.type === 'testing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                        {status.type === 'success' ? <Check className="h-4 w-4 mt-0.5 shrink-0" /> :
                            status.type === 'testing' ? <Loader2 className="h-4 w-4 mt-0.5 shrink-0 animate-spin" /> :
                                <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />}
                        <div className="flex-1">
                            <p className="font-medium text-xs">{status.type === 'success' ? 'Configuration Verified' : status.type === 'testing' ? 'Verifying...' : 'Configuration Error'}</p>
                            <p className="text-[11px] opacity-90 mt-0.5">{status.message}</p>
                        </div>
                    </div>
                )}
            </div>
        </form>
    )
}

function ModelSelector({ baseUrl, value, onChange }: { baseUrl: string, value: string, onChange: (v: string) => void }) {
    const [models, setModels] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [fetched, setFetched] = useState(false)

    const handleFetch = async () => {
        setLoading(true)
        try {
            const list = await fetchLocalModels(baseUrl)
            setModels(list)
            setFetched(true)
            if (list.length > 0 && !value) {
                onChange(list[0])
            }
        } catch (err) {
            console.error('Failed to fetch models', err)
            // Fallback to manual input if fetch fails
            setFetched(false)
        } finally {
            setLoading(false)
        }
    }

    if (!fetched && models.length === 0) {
        return (
            <div className="flex gap-2 w-full">
                <Input
                    placeholder="e.g. llama3"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleFetch} disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Fetch Models'}
                </Button>
            </div>
        )
    }

    return (
        <div className="flex gap-2 w-full">
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                    {models.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Button type="button" variant="ghost" size="icon" onClick={handleFetch} disabled={loading} title="Refresh Models">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <div className="text-xs font-bold">↻</div>}
            </Button>
        </div>
    )
}
