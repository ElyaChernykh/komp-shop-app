import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function AddEmployee() {
  const { isDirector } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    position: '',
    phone: '',
    role: 'employee'
  })
  const [message, setMessage] = useState('')

  if (!isDirector) return <p className="text-red-500">Доступ запрещён</p>

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Создаём пользователя
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password
    })

    if (error) {
      setMessage('Ошибка: ' + error.message)
      return
    }

    // Добавляем профиль
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: formData.full_name,
        position: formData.position,
        phone: formData.phone,
        email: formData.email,
        role: formData.role
      })

    if (profileError) {
      setMessage('Ошибка профиля: ' + profileError.message)
    } else {
      setMessage('Сотрудник успешно добавлен!')
      setFormData({ email: '', password: '', full_name: '', position: '', phone: '', role: 'employee' })
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Добавление сотрудника</h2>
      {message && <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">{message}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ФИО"
          className="w-full p-2 border rounded mb-2"
          value={formData.full_name}
          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          required
        />
        <input
          type="text"
          placeholder="Должность"
          className="w-full p-2 border rounded mb-2"
          value={formData.position}
          onChange={(e) => setFormData({...formData, position: e.target.value})}
          required
        />
        <input
          type="tel"
          placeholder="Телефон"
          className="w-full p-2 border rounded mb-2"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 border rounded mb-2"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          className="w-full p-2 border rounded mb-2"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <select
          className="w-full p-2 border rounded mb-4"
          value={formData.role}
          onChange={(e) => setFormData({...formData, role: e.target.value})}
        >
          <option value="employee">Сотрудник</option>
          <option value="director">Директор</option>
        </select>
        <button type="submit" className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600">
          Добавить
        </button>
      </form>
    </div>
  )
}