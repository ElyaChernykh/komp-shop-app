import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function ShiftSelector() {
  const { user, profile, isDirector } = useAuth()
  const [shifts, setShifts] = useState([])
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [users, setUsers] = useState([])

  useEffect(() => {
    loadShifts()
    if (isDirector) loadUsers()
  }, [selectedDate])

  const loadShifts = async () => {
    let query = supabase
      .from('shifts')
      .select(`
        *,
        profiles:user_id (full_name, position)
      `)
      .eq('shift_date', selectedDate)

    if (!isDirector) {
      query = query.eq('user_id', user.id)
    }

    const { data } = await query
    setShifts(data || [])
  }

  const loadUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'employee')
    setUsers(data || [])
  }

  const addShift = async (userId, shiftType) => {
    const { error } = await supabase
      .from('shifts')
      .insert({
        user_id: userId,
        shift_date: selectedDate,
        shift_type: shiftType,
        status: isDirector ? 'approved' : 'pending'
      })
    
    if (!error) loadShifts()
  }

  const updateShiftStatus = async (shiftId, status) => {
    const { error } = await supabase
      .from('shifts')
      .update({ status })
      .eq('id', shiftId)
    
    if (!error) loadShifts()
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">График смен</h2>
      
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        className="mb-4 p-2 border rounded"
      />

      {isDirector && (
        <div className="mb-4">
          <h3 className="font-semibold mb-2">Добавить смену</h3>
          <div className="flex gap-2">
            <select className="p-2 border rounded" id="userSelect">
              {users.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
            </select>
            <button onClick={() => {
              const userId = document.getElementById('userSelect').value
              addShift(userId, 'morning')
            }} className="bg-blue-500 text-white px-3 py-1 rounded">Утро</button>
            <button onClick={() => {
              const userId = document.getElementById('userSelect').value
              addShift(userId, 'afternoon')
            }} className="bg-blue-500 text-white px-3 py-1 rounded">День</button>
            <button onClick={() => {
              const userId = document.getElementById('userSelect').value
              addShift(userId, 'night')
            }} className="bg-blue-500 text-white px-3 py-1 rounded">Ночь</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {shifts.map(shift => (
          <div key={shift.id} className="border p-3 rounded flex justify-between items-center">
            <div>
              {!isDirector && <div className="font-semibold">{shift.profiles?.full_name}</div>}
              <div className="text-sm text-gray-600">
                {shift.shift_type === 'morning' && 'Утренняя (08:00-16:00)'}
                {shift.shift_type === 'afternoon' && 'Дневная (12:00-20:00)'}
                {shift.shift_type === 'night' && 'Ночная (20:00-04:00)'}
              </div>
              <div className="text-xs">
                Статус: {shift.status === 'pending' && '⏳ Ожидает'}
                {shift.status === 'approved' && '✅ Утверждена'}
                {shift.status === 'rejected' && '❌ Отклонена'}
              </div>
            </div>
            {isDirector && shift.status === 'pending' && (
              <div className="flex gap-2">
                <button onClick={() => updateShiftStatus(shift.id, 'approved')} className="bg-green-500 text-white px-2 py-1 rounded text-sm">Утвердить</button>
                <button onClick={() => updateShiftStatus(shift.id, 'rejected')} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Отклонить</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}