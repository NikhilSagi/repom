import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Bot, User } from 'lucide-react'

export function MessageList({ messages, isLoading }) {
  if (messages.length === 0) return null

  return (
    <div className="message-group">
      {messages.map((msg, idx) => (
        <div key={idx} className={`message ${msg.role}`}>
          <div className="message-avatar">
            {msg.role === 'user' ? <User size={18} color="#fff" /> : <Bot size={18} color="#e5e5e5" />}
          </div>
          <div className="message-bubble">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}) {
                  const match = /language-(\w+)/.exec(className || '')
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  )
                }
              }}
            >
              {msg.content}
            </ReactMarkdown>
            <div className="message-meta">
              {msg.role === 'user' ? 'You' : 'RepoMaster'} • Just now
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="typing-indicator">
          <div className="message-avatar">
            <Bot size={18} color="#e5e5e5" />
          </div>
          <div className="typing-dots">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        </div>
      )}
    </div>
  )
}
