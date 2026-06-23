'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'

interface AttendanceRecord {
  studentName: string
  period1: string
  period2: string
  period3: string
}

export default function AttendancePage() {
  const router = useRouter()
  const [records, setRecords] = useState<AttendanceRecord[]>([
    { studentName: '김학생', period1: '출석', period2: '출석', period3: '지각' },
    { studentName: '이학생', period1: '출석', period2: '결석', period3: '출석' },
    { studentName: '박학생', period1: '지각', period2: '출석', period3: '출석' },
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case '출석': return 'bg-green-100 text-green-800'
      case '지각': return 'bg-yellow-100 text-yellow-800'
      case '결석': return 'bg-red-100 text-red-800'
      case '공결': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/admin')} className="flex items-center gap-2 text-indigo-600 font-medium hover:underline">
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">📊 출석 현황</h1>
          <button onClick={handleLogout} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4 inline mr-2" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">수강생</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">1교시</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">2교시</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">3교시</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.studentName}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.period1)}`}>
                      {record.period1}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.period2)}`}>
                      {record.period2}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(record.period3)}`}>
                      {record.period3}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
