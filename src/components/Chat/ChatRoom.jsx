import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function ChatRoom({ room = 'general' }) {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const { user, profile } = useAuth()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    loadMessages()
    
    // Подписка на новые сообщения
    const subscription = supabase
      .channel(`messages:${room}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `room=eq.${room}`
      }, payload => {
        fetchUserAndAddMessage(payload.new)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [room])

  const fetchUserAndAddMessage = async (message) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', message.user_id)
      .single()
    
    setMessages(prev => [...prev, { ...message, profile: data }])
    setTimeout(() => scrollToBottom(), 100)
  }

  const loadMessages = async () => {
    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq('room', room)
      .order('created_at', { ascending: true })
      .limit(50)
    
    setMessages(data || [])
    setTimeout(() => scrollToBottom(), 100)
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        message: newMessage,
        room: room
      })
    
    setNewMessage('')
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[500px]">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">
          {room === 'general' ? 'Общий чат' : 'Чат с руководством'}
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.user_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${
              msg.user_id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}>
              <div className="text-xs font-semibold mb-1">
                {msg.profiles?.full_name || msg.user_id}
              </div>
              <div>{msg.message}</div>
              <div className="text-xs mt-1 opacity-75">
                {new Date(msg.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 p-2 border rounded"
          />
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Отправить
          </button>
        </div>
      </form>
    </div>
  )
}