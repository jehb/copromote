'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { sendChatMessage, type ChatMessage } from '@/app/actions/chat'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { searchEventsForAutocomplete } from '@/app/actions/events'
import { Badge } from '@/components/ui/badge'
import MentionInput, { type MentionInputHandle } from '@/components/chat/MentionInput'

function MessageContent({ content }: { content: string }) {
    // Regex to match @type:id[Name] or @type:id
    const mentionRegex = /@(event|task|promotion):([a-zA-Z0-9-]+)(?:\[([^\]]+)\])?/gi

    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
        // Text before the mention
        if (match.index > lastIndex) {
            parts.push(content.slice(lastIndex, match.index))
        }

        const type = match[1]
        const id = match[2]
        const name = match[3] || id

        parts.push(
            <Badge
                key={`${match.index}`}
                variant="secondary"
                className="mx-1 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-default"
            >
                <span className="opacity-70 mr-1 text-[10px] uppercase font-bold">{type}</span>
                {name}
            </Badge>
        )

        lastIndex = mentionRegex.lastIndex
    }

    // Remaining text
    if (lastIndex < content.length) {
        parts.push(content.slice(lastIndex))
    }

    if (parts.length === 0) {
        return <div className="whitespace-pre-wrap leading-relaxed">{content}</div>
    }

    return <div className="leading-relaxed">{parts}</div>
}

export default function ChatClient() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello! I am your Co+promote AI Assistant. How can I help you today? You can mention events, tasks, or promotions using @ to search for them and provide me with more context.' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [suggestions, setSuggestions] = useState<{ id: string, title: string, startTime: string }[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [suggestionIndex, setSuggestionIndex] = useState(0)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const mentionInputRef = useRef<MentionInputHandle>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages, isLoading])

    const handleSend = async () => {
        if (!input.trim() || isLoading) return

        const userMessage: ChatMessage = { role: 'user', content: input }
        const newMessages = [...messages, userMessage]

        setMessages(newMessages)
        setInput('')
        setIsLoading(true)

        try {
            const response = await sendChatMessage(newMessages)
            setMessages(prev => [...prev, { role: 'assistant', content: response }])
        } catch (err: unknown) {
            console.error(err)
            const error = err as Error
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${error.message}` }])
        } finally {
            setIsLoading(false)
        }
    }

    const onTriggerMention = async (query: string) => {
        if (query) {
            const results = await searchEventsForAutocomplete(query)
            setSuggestions(results)
            setShowSuggestions(results.length > 0)
            setSuggestionIndex(0)
        } else {
            setShowSuggestions(false)
        }
    }

    const selectSuggestion = (suggestion: typeof suggestions[0]) => {
        mentionInputRef.current?.insertMention('event', suggestion.id, suggestion.title)
        setShowSuggestions(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showSuggestions) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSuggestionIndex(prev => (prev + 1) % suggestions.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                selectSuggestion(suggestions[suggestionIndex])
            } else if (e.key === 'Escape') {
                setShowSuggestions(false)
            }
        } else if (e.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] p-4 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        AI Assistant
                    </h1>
                    <p className="text-muted-foreground">Ask anything about your workspace or projects.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                    <Sparkles className="h-3 w-3" />
                    Powered by configured LLM
                </div>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden shadow-lg border-primary/10">
                <CardHeader className="border-b bg-slate-50/50 py-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Chat Sessions</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setMessages([{ role: 'assistant', content: 'How can I help you today?' }])} className="text-xs h-7">
                            Clear History
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4 max-w-4xl mx-auto">
                            <AnimatePresence initial={false}>
                                {messages.map((message, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className={cn(
                                            "flex gap-3 text-sm",
                                            message.role === 'user' ? "flex-row-reverse" : "flex-row"
                                        )}
                                    >
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border",
                                            message.role === 'user' ? "bg-primary text-primary-foreground" : "bg-white text-slate-600"
                                        )}>
                                            {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                        </div>
                                        <div className={cn(
                                            "rounded-2xl px-4 py-2 max-w-[80%] shadow-sm",
                                            message.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                : "bg-white border rounded-tl-none text-slate-800"
                                        )}>
                                            <MessageContent content={message.content} />
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {isLoading && (
                                <div className="flex gap-3 text-sm">
                                    <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 border bg-white">
                                        <Bot className="h-4 w-4" />
                                    </div>
                                    <div className="bg-slate-100 rounded-2xl px-4 py-2 flex items-center gap-2 text-slate-500 italic">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>

                    <div className="p-4 border-t bg-slate-50/50 relative">
                        {showSuggestions && (
                            <div className="absolute bottom-full left-4 right-4 mb-2 max-w-4xl mx-auto bg-white border rounded-lg shadow-xl z-50 overflow-hidden animate-in slide-in-from-bottom-2">
                                <div className="bg-slate-50 px-3 py-2 border-b text-xs font-semibold text-slate-500 flex items-center justify-between">
                                    <span>Event Suggestions (ordered by date proximity)</span>
                                    <span>↑↓ to navigate, Enter to select</span>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={s.id}
                                            className={cn(
                                                "w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-primary/5 transition-colors",
                                                suggestionIndex === i ? "bg-primary/10 text-primary font-medium" : "text-slate-700"
                                            )}
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                selectSuggestion(s)
                                            }}
                                        >
                                            <div className="flex flex-col">
                                                <span>{s.title}</span>
                                                <span className="text-[10px] opacity-60">{new Date(s.startTime).toLocaleDateString()}</span>
                                            </div>
                                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter opacity-50">@event</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="max-w-4xl mx-auto flex flex-col gap-2">
                            <div className="flex gap-2">
                                <MentionInput
                                    ref={mentionInputRef}
                                    placeholder="Type your message... (Try @ to mention an event)"
                                    value={input}
                                    onChange={setInput}
                                    onTrigger={onTriggerMention}
                                    onKeyDown={handleKeyDown}
                                    className="flex-1"
                                />
                                <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="mt-auto h-[42px]">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Tip: You can get IDs from entity detail pages.
                                </span>
                                <span className="hidden md:block opacity-50">Press Enter to send.</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
