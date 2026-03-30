import React, { useEffect, useState } from 'react'
import { X, File, FileText, FileCode, FileImage, Folder } from 'lucide-react'
import { listFiles } from '../api/files'

export function FileBrowser({ userId, activeChatId, onClose }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId || !activeChatId) return
    listFiles(userId, activeChatId)
      .then(res => {
        setFiles(res.files || [])
      })
      .catch(err => console.error('Failed to load files', err))
      .finally(() => setLoading(false))
  }, [userId, activeChatId])

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const getIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['png', 'jpg', 'jpeg', 'gif', 'svg'].includes(ext)) return <FileImage size={16} />
    if (['py', 'js', 'html', 'css', 'json', 'md'].includes(ext)) return <FileCode size={16} />
    if (['txt', 'log'].includes(ext)) return <FileText size={16} />
    return <File size={16} />
  }

  return (
    <div className="file-browser">
      <div className="file-browser-header">
        <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Folder size={18} color="var(--accent)" /> Work Directory
        </h3>
        <button className="btn-icon" onClick={onClose}><X size={18}/></button>
      </div>
      <div className="file-browser-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Loading...</div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <Folder size={32} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <div>No files in work directory</div>
          </div>
        ) : (
          files.map(f => (
            <div key={f.relative} className="file-entry" title={f.path}>
              <div style={{ color: 'var(--text-secondary)' }}>{getIcon(f.name)}</div>
              <div className="file-entry-name">{f.relative}</div>
              <div className="file-entry-size">{formatSize(f.size)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
