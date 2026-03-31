import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth, AuthProvider } from './contexts/AuthContext'
import Login from './components/Auth/Login'
import AddEmployee from './components/Admin/AddEmployee'
import ShiftSelector from './components/Schedule/ShiftSelector'
import ChatRoom from './components/Chat/ChatRoom'
import Stats from './components/Reports/Stats'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center items-center h-screen">Загрузка...</div>
  return user ? children : <Navigate to="/login" />
}

function Dashboard() {
  const { profile, signOut, isDirector } = useAuth()
  const [activeTab, setActiveTab] = React.useState('schedule')

  const tabs = [
    { id: 'schedule', name: 'График', icon: '📅' },
    { id: 'chat', name: 'Чат', icon: '💬' },
    { id: 'management', name: 'Чат с руководством', icon: '👔' },
    { id: 'stats', name: 'Статистика', icon: '📊' },
    ...(isDirector ? [{ id: 'admin', name: 'Управление', icon: '👥' }] : [])
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-blue-600">Магазин «Комп»</h1>
            <p className="text-sm text-gray-600">{profile?.full_name} - {profile?.position}</p>
          </div>
          <button onClick={signOut} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Выход
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded transition ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.icon} {tab.name}
            </button>
          ))}
        </div>

        <div>
          {activeTab === 'schedule' && <ShiftSelector />}
          {activeTab === 'chat' && <ChatRoom room="general" />}
          {activeTab === 'management' && <ChatRoom room="management" />}
          {activeTab === 'stats' && <Stats />}
          {activeTab === 'admin' && isDirector && <AddEmployee />}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App