import client from './client'

export const listChats = (userId) =>
  client.get(`/api/chats/${userId}`).then(r => r.data)

export const getChatMessages = (userId, chatId) =>
  client.get(`/api/chats/${userId}/${chatId}/messages`).then(r => r.data)

export const deleteChat = (userId, chatId) =>
  client.delete(`/api/chats/${userId}/${chatId}`).then(r => r.data)

export const createNewChat = (userId) =>
  client.post(`/api/chats/${userId}/new`).then(r => r.data)

export const sendMessage = (payload) =>
  client.post('/api/chat', payload).then(r => r.data)
