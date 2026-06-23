'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { LogOut, Clock, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface User {
  id: string
  email: string
  name: string
  isAdmin: boolean
}

interface Attendance {
  date: string
  time: string
  status: string
}

function CoursePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const courseName = searchParams.get('name') || '강의명'

  const [user, setUser] = useState<User | null>(null)
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [attendanceStatus, setAttendanceStatus] = useState('미확인')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('attendance_current_user')
      if (!userData) {
        router.push('/login')
        return
      }

      try {
        const parsedUser = JSON.parse(userData)
        if (parsedUser.isAdmin) {
          router.push('/admin')
          return
        }
        setUser(parsedUser)

        const key = `attendance_${parsedUser.id}`
        const attendance = localStorage.getItem(key)
        if (attendance) {
          setAttendances(JSON.parse(attendance))
        }
      } catch (e) {
        router.push('/login')
      }
    }
  }, [router])

  const handleAttendance = () => {
    if (!user) return

    const now = new Date()
    const timeStr = now.toLocaleTimeString('ko-KR')
    const dateStr = now.toLocaleDateString('ko-KR')

    const newAttendance: Attendance = {
      date: dateStr,
      time: timeStr,
      status: 'attended',
    }

    const newAttendances = [...attendances, newAttendance]
    setAttendances(newAttendances)
    const key = `attendance_${user.id}`
    localStorage.setItem(key, JSON.stringify(newAttendances))

    toast.success(`✅ ${courseName} 출석 확인: ${timeStr}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('attendance_current_user')
    router.push('/login')
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/student')} className="text-indigo-600 font-medium hover:underline">
            ← 돌아가기
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{courseName}</h1>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{courseName}</h2>
          <p className="text-gray-600">📚 수강 중인 강의</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-6 h-6 text-indigo-600" />
              <h3 className="text-xl font-bold text-gray-900">출석 등록</h3>
            </div>
            <p className="text-gray-600 mb-4">현재 시간에 출석을 확인합니다</p>
            <button onClick={handleAttendance} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700">
              ✅ 출석 확인하기
            </button>
          </div>

          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-xl font-bold text-gray-900">중간이탈</h3>
            </div>
            <p className="text-gray-600 mb-4">강의를 더 이상 계속할 수 없습니다</p>
            <button
              onClick={() => {
                if (window.confirm(`${courseName} 강의를 중간이탈하시겠습니까?`)) {
                  toast.success('✅ 중간이탈이 접수되었습니다!')
                  setTimeout(() => router.push('/student'), 1500)
                }
              }}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700"
            >
              🚫 중간이탈 신청
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">📋 강의 정보</h3>
            <div className="space-y-4">
              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">강의명</p>
                <p className="text-lg font-semibold text-gray-900">{courseName}</p>
              </div>
              <div className="border-b pb-4">
                <p className="text-sm text-gray-600">상태</p>
                <p className="text-lg font-semibold text-green-600">✅ 수강 중</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">수강생</p>
                <p className="text-lg font-semibold text-gray-900">{user.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">📊 출석 현황</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                <span className="font-medium">1교시</span>
                <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-medium">출석</span>
              </div>
              <div className="flex items-center justify-between bg-yellow-50 p-3 rounded-lg">
                <span className="font-medium">2교시</span>
                <span className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">지각</span>
              </div>
              <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                <span className="font-medium">3교시</span>
                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">미응시</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-8 mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">📚 교시별 학습 자료</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <p className="font-semibold text-gray-900">1교시: Python 기초</p>
              <p className="text-sm text-gray-600">📄 Python 소개.pdf · 📹 강의영상.mp4</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4 py-2">
              <p className="font-semibold text-gray-900">2교시: 변수와 자료형</p>
              <p className="text-sm text-gray-600">📊 슬라이드.ppt · 📹 강의영상.mp4</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <p className="font-semibold text-gray-900">3교시: 함수</p>
              <p className="text-sm text-gray-600">📄 함수_guide.pdf · 📹 강의영상.mp4</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CoursePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">로딩 중...</div>}>
      <CoursePageContent />
    </Suspense>
  )
}
