import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Stats() {
  const { user, isDirector } = useAuth()
  const [stats, setStats] = useState([])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => {
    loadStats()
  }, [selectedMonth])

  const loadStats = async () => {
    let query = supabase
      .from('work_hours')
      .select(`
        *,
        profiles:user_id (full_name, position),
        shifts:shift_id (shift_type)
      `)
      .gte('date', `${selectedMonth}-01`)
      .lte('date', `${selectedMonth}-31`)

    if (!isDirector) {
      query = query.eq('user_id', user.id)
    }

    const { data } = await query
    
    // Агрегируем данные
    const aggregated = {}
    data?.forEach(record => {
      const userId = record.user_id
      if (!aggregated[userId]) {
        aggregated[userId] = {
          name: record.profiles?.full_name,
          position: record.profiles?.position,
          totalHours: 0,
          shiftsCount: 0
        }
      }
      aggregated[userId].totalHours += record.hours_worked || 8
      aggregated[userId].shiftsCount += 1
    })

    setStats(Object.values(aggregated))
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Статистика</h2>
      
      <input
        type="month"
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
        className="mb-4 p-2 border rounded"
      />

      <div className="space-y-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="border p-4 rounded">
            <div className="font-semibold">{stat.name}</div>
            <div className="text-sm text-gray-600">{stat.position}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div className="bg-blue-100 p-2 rounded text-center">
                <div className="text-lg font-bold">{stat.shiftsCount}</div>
                <div className="text-xs">Смен</div>
              </div>
              <div className="bg-green-100 p-2 rounded text-center">
                <div className="text-lg font-bold">{stat.totalHours}</div>
                <div className="text-xs">Часов</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {stats.length === 0 && (
        <p className="text-gray-500 text-center py-8">Нет данных за выбранный период</p>
      )}
    </div>
  )
}