
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { search, SearchResults } from "@/app/actions/search"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import {
    CalendarIcon,
    FileIcon,
    LaptopIcon,
    MoonIcon,
    SunIcon,
    UserIcon,
    Briefcase,
    CheckSquare,
    Building2,
    Calendar,
    MessageSquare,
    Search,
    Link2
} from "lucide-react"

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [results, setResults] = React.useState<SearchResults | null>(null)
    const [loading, setLoading] = React.useState(false)
    const router = useRouter()

    const debouncedQuery = useDebounce(query, 300)

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [])

    React.useEffect(() => {
        if (!debouncedQuery) {
            setResults(null)
            return
        }

        async function fetchResults() {
            setLoading(true)
            console.log("Fetching results for:", debouncedQuery)
            try {
                const data = await search(debouncedQuery)
                console.log("Received data:", data)
                setResults(data)
            } catch (error) {
                console.error("Search failed:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchResults()
    }, [debouncedQuery])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    const hasResults = results && Object.values(results).some(arr => arr.length > 0)

    return (
        <>
            <Button
                variant="secondary"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="h-4 w-4" />
                <span>Search...</span>
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
                <CommandInput
                    placeholder="Type a command or search..."
                    value={query}
                    onValueChange={setQuery}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && results) {
                            // Find the first available result
                            const firstResult =
                                results.projects[0] ||
                                results.tasks[0] ||
                                results.contacts[0] ||
                                results.organizations[0] ||
                                results.events[0] ||
                                results.posts[0] ||
                                results.hyperlinks[0]

                            if (firstResult) {
                                runCommand(() => {
                                    if (firstResult.type === 'hyperlink') {
                                        window.open(firstResult.url, '_blank')
                                    } else {
                                        router.push(firstResult.url)
                                    }
                                })
                            }
                        }
                    }}
                />
                <CommandList>
                    <CommandEmpty>
                        {loading ? "Searching..." : "No results found."}
                    </CommandEmpty>

                    {/* Default Actions if no query */}
                    {!query && (
                        <CommandGroup heading="Suggestions">
                            <CommandItem onSelect={() => runCommand(() => router.push('/tasks'))}>
                                <CheckSquare className="mr-2 h-4 w-4" />
                                <span>Go to Tasks</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
                                <Briefcase className="mr-2 h-4 w-4" />
                                <span>Go to Projects</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/contacts'))}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Go to Contacts</span>
                            </CommandItem>
                            <CommandItem onSelect={() => runCommand(() => router.push('/events'))}>
                                <Calendar className="mr-2 h-4 w-4" />
                                <span>Go to Events</span>
                            </CommandItem>
                        </CommandGroup>
                    )}

                    {results?.projects?.length ? (
                        <CommandGroup heading="Projects">
                            {results.projects.map((project) => (
                                <CommandItem
                                    key={project.id}
                                    onSelect={() => runCommand(() => router.push(project.url))}
                                >
                                    <Briefcase className="mr-2 h-4 w-4" />
                                    <span>{project.title}</span>
                                    {project.subtitle && <span className="ml-2 text-xs text-muted-foreground truncate max-w-[200px]">{project.subtitle}</span>}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.tasks?.length ? (
                        <CommandGroup heading="Tasks">
                            {results.tasks.map((task) => (
                                <CommandItem
                                    key={task.id}
                                    onSelect={() => runCommand(() => router.push(task.url))}
                                >
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    <span>{task.title}</span>
                                    <span className="ml-auto text-xs text-muted-foreground capitalize">{task.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.contacts?.length ? (
                        <CommandGroup heading="Contacts">
                            {results.contacts.map((contact) => (
                                <CommandItem
                                    key={contact.id}
                                    onSelect={() => runCommand(() => router.push(contact.url))}
                                >
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    <span>{contact.title}</span>
                                    {contact.subtitle && <span className="ml-2 text-xs text-muted-foreground">({contact.subtitle})</span>}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.organizations?.length ? (
                        <CommandGroup heading="Organizations">
                            {results.organizations.map((org) => (
                                <CommandItem
                                    key={org.id}
                                    onSelect={() => runCommand(() => router.push(org.url))}
                                >
                                    <Building2 className="mr-2 h-4 w-4" />
                                    <span>{org.title}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{org.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.events?.length ? (
                        <CommandGroup heading="Events">
                            {results.events.map((event) => (
                                <CommandItem
                                    key={event.id}
                                    onSelect={() => runCommand(() => router.push(event.url))}
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    <span>{event.title}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">{event.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.posts?.length ? (
                        <CommandGroup heading="Social Posts">
                            {results.posts.map((post) => (
                                <CommandItem
                                    key={post.id}
                                    onSelect={() => runCommand(() => router.push(post.url))}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    <span>{post.title}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">{post.subtitle}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}

                    {results?.hyperlinks?.length ? (
                        <CommandGroup heading="Hyperlinks">
                            {results.hyperlinks.map((link) => (
                                <CommandItem
                                    key={link.id}
                                    onSelect={() => runCommand(() => window.open(link.url, '_blank'))}
                                >
                                    <Link2 className="mr-2 h-4 w-4" />
                                    <span>{link.title}</span>
                                    <span className="ml-auto text-xs text-muted-foreground truncate max-w-[200px]">{link.url}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ) : null}
                </CommandList>
            </CommandDialog>
        </>
    )
}
