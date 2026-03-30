import React, { useEffect } from 'react'
import { Plus, MessageSquare, Trash2, LogOut, LogIn, BrainCircuit, Search, Code, FolderGit2 } from 'lucide-react'

export function Sidebar({ 
  auth, 
  chats, 
  activeChatId, 
  onNewChat, 
  onSwitchChat, 
  onDeleteChat,
  agentMode,
  setAgentMode,
  onLoginClick,
  onLogout
}) {
  const modes = [
    { id: 'unified', icon: BrainCircuit, label: 'Unified (Auto)', desc: 'Automatically selects best agent' },
    { id: 'deepsearch', icon: Search, label: 'DeepSearch Only', desc: 'Advanced web search' },
    { id: 'general_assistant', icon: Code, label: 'Programming', desc: 'Code generation & debugging' },
    { id: 'repository_agent', icon: FolderGit2, label: 'Repository', desc: 'Repo exploration & execution' }
  ]

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">✨</div>
          <div className="sidebar-logo-text">Chat Management</div>
        </div>
        <button className="btn btn-primary btn-full" onClick={onNewChat}>
          <Plus size={16} /> New Chat
        </button>
      </div>

      <div className="sidebar-body">
        <div className="section-label">📚 Chat History</div>
        {chats.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', padding: '20px 0' }}>
            No chat history yet<br />Start your first conversation!
          </div>
        ) : (
          chats.map(chat => (
            <div key={chat.chat_id} className={`chat-item ${activeChatId === chat.chat_id ? 'active' : ''}`} onClick={() => onSwitchChat(chat.chat_id)}>
              <MessageSquare size={16} color="var(--text-secondary)" />
              <div className="chat-item-text">
                <div className="chat-item-preview">{chat.title || 'Conversation'}</div>
                <div className="chat-item-meta">{chat.message_count} msgs • {chat.timestamp}</div>
              </div>
              <button className="btn-icon" style={{ padding: '4px' }} onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.chat_id); }} title="Delete chat">
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}

        <div className="section-label" style={{ marginTop: '20px' }}>🤖 Agent Mode</div>
        <div className="agent-modes">
          {modes.map(m => (
            <label key={m.id} className={`mode-option ${agentMode === m.id ? 'selected' : ''}`}>
              <input 
                type="radio" 
                name="agentMode" 
                checked={agentMode === m.id} 
                onChange={() => setAgentMode(m.id)} 
              />
              <div style={{ flex: 1 }}>
                <div className="mode-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <m.icon size={14} /> {m.label}
                </div>
                <div className="mode-desc">{m.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="sidebar-footer">
        {auth.isLoggedIn ? (
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--success)' }}>
              <span>👤</span> <strong>{auth.username}</strong>
            </div>
            <button className="btn btn-ghost btn-full" onClick={onLogout}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--warning)' }}>
              <span>🏃</span> <strong>Guest Mode</strong>
            </div>
            <button className="btn btn-primary btn-full" onClick={onLoginClick}>
              <LogIn size={16} /> Login / Register
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
