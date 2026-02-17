'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { sendChatMessage, type ChatMessage } from '@/app/actions/chat'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPage() {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'assistant', content: 'Hello! I am your Promoty AI Assistant. How can I help you today? You can mention events, tasks, or promotions using @ (e.g., "@event:uuid") to provide me with more context.' }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

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
        } catch (err: any) {
            console.error(err)
            setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I encountered an error: ${err.message}` }])
        } finally {
            setIsLoading(false)
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
                                            <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
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

                    <div className="p-4 border-t bg-slate-50/50">
                        <div className="max-w-4xl mx-auto flex flex-col gap-2">
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type your message... (Try @event:id to reference something)"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    className="flex-1 bg-white border-primary/20 focus-visible:ring-primary"
                                />
                                <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
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
