import { ProtectedRoute } from '@/components/layout/protected-route'
import ChatClient from './chat-client'

export const dynamic = 'force-dynamic'

export default function ChatPage() {
    return (
        <ProtectedRoute pageName="chat">
            <ChatClient />
        </ProtectedRoute>
    )
}
