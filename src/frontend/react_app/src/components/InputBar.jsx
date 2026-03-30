import React, { useState, useRef } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { uploadFiles } from '../api/files'

export function InputBar({ onSend, isLoading, userId, chatId }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files)])
    }
  }

  const removeFile = (idx) => {
    setFiles(prev => prev.filter((_, i) => i !== idx))
  }

  const handleSend = async () => {
    if ((!text.trim() && files.length === 0) || isLoading || isUploading) return

    let uploadedPaths = []
    if (files.length > 0 && chatId) {
      setIsUploading(true)
      try {
        const res = await uploadFiles(userId, chatId, files)
        uploadedPaths = res.file_paths
        setFiles([])
      } catch (e) {
        console.error('File upload failed', e)
        alert('File upload failed')
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    onSend(text, uploadedPaths)
    setText('')
  }

  return (
    <div className="input-bar-wrapper">
      {files.length > 0 && (
        <div className="uploaded-files">
          {files.map((f, i) => (
            <div key={i} className="file-chip">
              <span>📎 {f.name}</span>
              <button 
                onClick={() => removeFile(i)} 
                style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="input-bar">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? "RepoMaster is typing..." : "Please input your question... (Shift+Enter for newline)"}
          rows={1}
          disabled={isLoading || isUploading}
          style={{ height: text ? 'auto' : '24px' }}
        />
        <div className="input-bar-actions">
          <input 
            type="file" 
            multiple 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            disabled={!chatId || isLoading || isUploading} 
          />
          <button 
            className="btn-icon" 
            onClick={() => fileInputRef.current?.click()}
            disabled={!chatId || isLoading || isUploading}
            title={!chatId ? "Start a chat first to upload files" : "Attach files"}
          >
            <Paperclip size={18} />
          </button>
          <button 
            className="send-btn" 
            onClick={handleSend}
            disabled={(!text.trim() && files.length === 0) || isLoading || isUploading}
          >
            <Send size={16} style={{ marginLeft: '-2px', marginTop: '1px' }} />
          </button>
        </div>
      </div>
      <div className="input-hints">
        Powered by RepoMaster Multi-Agent System
      </div>
    </div>
  )
}
