import client from './client'

export const uploadFiles = (userId, chatId, files) => {
  const fd = new FormData()
  fd.append('user_id', userId)
  fd.append('chat_id', chatId)
  for (const f of files) fd.append('files', f)
  return client.post('/api/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data)
}

export const listFiles = (userId, chatId) =>
  client.get(`/api/files/${userId}/${chatId}`).then(r => r.data)
