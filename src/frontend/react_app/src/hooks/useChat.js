import { useState, useCallback, useRef } from 'react'
import { createNewChat, listChats, getChatMessages, deleteChat, sendMessage } from '../api/chat'

export function useChat(userId) {
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages, setMessages] = useState([]) // [{role, content}]
  const [isLoading, setIsLoading] = useState(false)
  const [agentMode, setAgentMode] = useState('unified')
  const pendingFilePaths = useRef([])

  const refreshChats = useCallback(async () => {
    if (!userId) return
    try {
      const data = await listChats(userId)
      setChats(data)
    } catch (e) {
      console.error('Failed to load chats', e)
    }
  }, [userId])

  const newChat = useCallback(async () => {
    const data = await createNewChat(userId)
    setActiveChatId(data.chat_id)
    setMessages([])
    await refreshChats()
    return data
  }, [userId, refreshChats])

  const switchChat = useCallback(async (chatId) => {
    setActiveChatId(chatId)
    setMessages([])
    try {
      const data = await getChatMessages(userId, chatId)
      // Use messages array for display
      const msgs = data.messages || []
      setMessages(msgs.map(m => ({ role: m.role, content: m.content })))
    } catch (e) {
      console.error('Failed to load messages', e)
    }
  }, [userId])

  const removeChat = useCallback(async (chatId) => {
    await deleteChat(userId, chatId)
    if (chatId === activeChatId) {
      setActiveChatId(null)
      setMessages([])
    }
    await refreshChats()
  }, [userId, activeChatId, refreshChats])

  const send = useCallback(async (text, uploadedFilePaths = []) => {
    if (!text.trim() || isLoading) return

    // Ensure we have an active chat
    let chatId = activeChatId
    if (!chatId) {
      const created = await createNewChat(userId)
      chatId = created.chat_id
      setActiveChatId(chatId)
    }

    const userMsg = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res = await sendMessage({
        message: text,
        user_id: userId,
        chat_id: chatId,
        file_paths: uploadedFilePaths,
        agent_mode: agentMode,
      })

      const aiMsg = { role: 'assistant', content: res.response || '' }
      setMessages(prev => [...prev, aiMsg])
      await refreshChats()
    } catch (e) {
      console.error('Chat error', e)
      const errMsg = { role: 'assistant', content: '❌ Error: ' + (e?.response?.data?.detail || e.message) }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [activeChatId, userId, agentMode, isLoading, refreshChats])

  return {
    chats,
    activeChatId,
    messages,
    isLoading,
    agentMode,
    setAgentMode,
    newChat,
    switchChat,
    removeChat,
    send,
    refreshChats,
  }
}
