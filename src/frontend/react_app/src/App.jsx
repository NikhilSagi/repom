import React, { useState, useEffect, useRef } from 'react'

import { useAuth } from './hooks/useAuth'
import { useChat } from './hooks/useChat'

import { TopNav } from './components/TopNav'
import { Sidebar } from './components/Sidebar'
import { WelcomeScreen } from './components/WelcomeScreen'
import { MessageList } from './components/MessageList'
import { InputBar } from './components/InputBar'
import { LoginModal } from './components/LoginModal'
import { FileBrowser } from './components/FileBrowser'

import { FolderOpen } from 'lucide-react'

export default function App() {
  const auth = useAuth()
  const chat = useChat(auth.userId)
  
  const [showLogin, setShowLogin] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false)
  
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat.messages, chat.isLoading])

  // Initial chat load
  useEffect(() => {
    chat.refreshChats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.userId])

  return (
    <div className="app-layout">
      <Sidebar 
        auth={auth}
        chats={chat.chats}
        activeChatId={chat.activeChatId}
        agentMode={chat.agentMode}
        setAgentMode={chat.setAgentMode}
        onNewChat={chat.newChat}
        onSwitchChat={chat.switchChat}
        onDeleteChat={chat.removeChat}
        onLoginClick={() => setShowLogin(true)}
        onLogout={auth.logout}
      />
      
      <main className="main-area">
        <TopNav 
          user={auth.username} 
          onLoginClick={() => setShowLogin(true)} 
        />
        
        <div className="chat-body">
          {chat.messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <MessageList messages={chat.messages} isLoading={chat.isLoading} />
          )}
          
          {chat.activeChatId && chat.messages.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
              <button 
                className="btn btn-ghost"
                onClick={() => setShowFileBrowser(true)}
              >
                <FolderOpen size={16} /> Browse Work Directory Files
              </button>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <InputBar 
          onSend={chat.send} 
          isLoading={chat.isLoading} 
          userId={auth.userId} 
          chatId={chat.activeChatId} 
        />
      </main>

      {showLogin && (
        <LoginModal 
          onClose={() => setShowLogin(false)} 
          onLogin={auth.login}
          onRegister={auth.register}
        />
      )}

      {showFileBrowser && (
        <FileBrowser 
          userId={auth.userId}
          activeChatId={chat.activeChatId}
          onClose={() => setShowFileBrowser(false)}
        />
      )}
    </div>
  )
}
