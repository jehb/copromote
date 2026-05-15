'use client'

import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface MentionInputProps {
    value: string
    onChange: (value: string) => void
    onTrigger: (query: string) => void
    onKeyDown?: (e: React.KeyboardEvent) => void
    placeholder?: string
    className?: string
}

export interface MentionInputHandle {
    insertMention: (type: string, id: string, name: string) => void
    focus: () => void
    clear: () => void
}

const MentionInput = forwardRef<MentionInputHandle, MentionInputProps>(({
    value,
    onChange,
    onTrigger,
    onKeyDown,
    placeholder,
    className
}, ref) => {
    const editorRef = useRef<HTMLDivElement>(null)
    const [isFocused, setIsFocused] = useState(false)

    // Sync external value to internal HTML only if they diverge significantly
    // This is tricky with cursor position, so we mostly rely on user typing updates
    useEffect(() => {
        if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
            editorRef.current.innerHTML = ''
        }
    }, [value])

    useImperativeHandle(ref, () => ({
        insertMention: (type, id, name) => {
            if (!editorRef.current) return

            const selection = window.getSelection()
            if (!selection?.rangeCount) return

            const range = selection.getRangeAt(0)

            // If the range is not in our editor, try to restore focus/selection if we have a saved range
            // (Ignoring saved range for now as it's more complex, but focusing on the current node)
            const container = range.startContainer
            const textContent = container.textContent || ''
            const offset = range.startOffset

            // Search backwards for @ in the current text node
            const lastAtPos = textContent.lastIndexOf('@', offset - 1)

            if (lastAtPos !== -1) {
                // We found the @ in the current node. Delete from @ to current offset.
                range.setStart(container, lastAtPos)
                range.setEnd(container, offset)
                range.deleteContents()
            }

            // Create tag element
            const tag = document.createElement('span')
            tag.className = 'inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold mx-0.5 whitespace-nowrap'
            tag.contentEditable = 'false'
            tag.dataset.id = id
            tag.dataset.type = type
            tag.dataset.name = name
            tag.dataset.mention = 'true'

            const typeLabel = document.createElement('span')
            typeLabel.className = 'opacity-50 mr-1 text-[9px] uppercase font-bold'
            typeLabel.textContent = type

            tag.appendChild(typeLabel)
            tag.appendChild(document.createTextNode(name))

            range.insertNode(tag)

            // Move cursor after the tag
            range.setStartAfter(tag)
            range.setEndAfter(tag)

            // Add a space after the tag if there isn't one
            const nextChar = tag.nextSibling?.textContent?.charAt(0)
            if (nextChar !== ' ') {
                const space = document.createTextNode(' ')
                range.insertNode(space)
                range.setStartAfter(space)
                range.setEndAfter(space)
            }

            selection.removeAllRanges()
            selection.addRange(range)

            updateValue()
        },
        focus: () => editorRef.current?.focus(),
        clear: () => {
            if (editorRef.current) editorRef.current.innerHTML = ''
            onChange('')
        }
    }))

    const updateValue = () => {
        if (!editorRef.current) return

        // Convert HTML to plain text format: @type:id[Name]
        let plainText = ''
        const nodes = Array.from(editorRef.current.childNodes)

        nodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                plainText += node.textContent
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement
                if (el.dataset.mention === 'true') {
                    const { type, id, name } = el.dataset
                    plainText += `@${type}:${id}[${name}]`
                } else if (el.tagName === 'DIV' || el.tagName === 'BR') {
                    // Handle line breaks if any
                    plainText += '\n'
                } else {
                    plainText += el.innerText
                }
            }
        })

        onChange(plainText)
        checkForTrigger()
    }

    const checkForTrigger = () => {
        const selection = window.getSelection()
        if (!selection?.rangeCount) return

        const range = selection.getRangeAt(0)
        const textContent = range.startContainer.textContent || ''
        const offset = range.startOffset

        const lastAtPos = textContent.lastIndexOf('@', offset - 1)
        if (lastAtPos !== -1 && lastAtPos >= offset - 20) {
            const query = textContent.slice(lastAtPos + 1, offset)
            if (!query.includes(' ')) {
                onTrigger(query)
                return
            }
        }
        onTrigger('')
    }

    const handleInput = () => {
        updateValue()
    }

    const handleInternalKeyDown = (e: React.KeyboardEvent) => {
        if (onKeyDown) onKeyDown(e)
        // Basic cursor handling for tags could be added here
    }

    return (
        <div className="relative w-full">
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onKeyDown={handleInternalKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={cn(
                    "min-h-[42px] max-h-[150px] overflow-y-auto px-4 py-2 bg-white border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all whitespace-pre-wrap break-words cursor-text",
                    className
                )}
                data-placeholder={placeholder}
            />
            {!value && !isFocused && (
                <div className="absolute top-2.5 left-4 text-muted-foreground pointer-events-none text-sm opacity-50">
                    {placeholder}
                </div>
            )}
            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #94a3b8;
                    font-size: 0.875rem;
                }
            `}</style>
        </div>
    )
})

MentionInput.displayName = 'MentionInput'

export default MentionInput
