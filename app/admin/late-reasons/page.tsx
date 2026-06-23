'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'

export default function LateReasonsPage() {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">⏰ 지각 관리</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 inline mr-2" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600">지각 관리 기능 구현 중...</p>
        </div>
      </main>
    </div>
  )
}
