'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Attendance, ClassPeriod, Profile } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AttendanceWithPeriod extends Attendance {
  class_periods: ClassPeriod
}

interface DayRecord {
  date: string
  byPeriod: Record<number, AttendanceWithPeriod | null>
}

export default function StudentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<ClassPeriod[]>([])
  const [attendances, setAttendances] = useState<AttendanceWithPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  const loadAttendances = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('attendance')
      .select('*, class_periods(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('period_number', { ascending: true })
    setAttendances((data as AttendanceWithPeriod[]) || [])
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, branches(*, organizations(*))')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'student') { router.push('/admin'); return }
      setProfile(prof)

      const { data: pds } = await supabase
        .from('class_periods')
        .select('*')
        .eq('branch_id', prof.branch_id)
        .order('period_number')
      setPeriods(pds || [])

      await loadAttendances(user.id)
      setLoading(false)
    }
    init()
  }, [loadAttendances, router])

  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('student-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance', filter: `user_id=eq.${profile.id}` }, () => {
        loadAttendances(profile.id)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'class_periods' }, (payload) => {
        if (payload.new.is_active === true) {
          toast(`📢 ${payload.new.period_number}교시 출석 체크가 시작되었습니다!`, { duration: 5000 })
        }
        supabase.from('class_periods').select('*').eq('branch_id', profile.branch_id).order('period_number')
          .then(({ data }) => setPeriods(data || []))
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, loadAttendances])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  function getTodayPeriodStatus(periodNumber: number) {
    return attendances.find(a => a.date === today && a.period_number === periodNumber) || null
  }

  function getStats() {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    return {
      present: attendances.filter(a => a.status === 'present').length,
      late: attendances.filter(a => a.status === 'late').length,
      absent: attendances.filter(a => a.status === 'absent').length,
      monthly: attendances.filter(a => a.date >= monthStart && a.date <= monthEnd && a.status !== 'absent').length,
    }
  }

  function getHistoryByDate(): DayRecord[] {
    const dates = [...new Set(attendances.map(a => a.date))].sort((a, b) => b.localeCompare(a))
    return dates.map(date => ({
      date,
      byPeriod: Object.fromEntries(
        periods.map(p => [p.period_number, attendances.find(a => a.date === date && a.period_number === p.period_number) || null])
      ),
    }))
  }

  function statusIcon(a: AttendanceWithPeriod | null) {
    if (!a) return <span className="text-gray-300">-</span>
    if (a.status === 'present') return <span className="text-green-600">✅ {format(new Date(a.checked_at), 'HH:mm')}</span>
    if (a.status === 'late') return <span className="text-yellow-600">🟡 {format(new Date(a.checked_at), 'HH:mm')}<span className="text-xs ml-1">(+{a.late_minutes}분)</span></span>
    return <span className="text-red-500">❌ 결석</span>
  }

  function todayPeriodCard(period: ClassPeriod) {
    const rec = getTodayPeriodStatus(period.period_number)
    const isActive = period.is_active

    if (!rec && !isActive) {
      return (
        <div className="flex flex-col items-center gap-1 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-bold text-gray-500">{period.period_number}교시</p>
          <p className="text-xs text-gray-400">{period.start_time}~{period.end_time}</p>
          <span className="text-2xl">⏳</span>
          <p className="text-xs text-gray-400">대기중</p>
        </div>
      )
    }
    if (!rec && isActive) {
      return (
        <Link href="/student/scan" className="flex flex-col items-center gap-1 p-4 bg-blue-50 rounded-xl border-2 border-blue-300 hover:bg-blue-100 transition-colors">
          <p className="text-sm font-bold text-blue-700">{period.period_number}교시</p>
          <p className="text-xs text-blue-500">{period.start_time}~{period.end_time}</p>
          <span className="text-2xl">📷</span>
          <p className="text-xs text-blue-600 font-medium">스캔하기</p>
        </Link>
      )
    }
    const colors = rec?.status === 'present' ? 'bg-green-50 border-green-200' : rec?.status === 'late' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
    return (
      <div className={`flex flex-col items-center gap-1 p-4 rounded-xl border ${colors}`}>
        <p className="text-sm font-bold text-gray-700">{period.period_number}교시</p>
        <p className="text-xs text-gray-500">{period.start_time}~{period.end_time}</p>
        <span className="text-2xl">{rec?.status === 'present' ? '✅' : rec?.status === 'late' ? '🟡' : '❌'}</span>
        {rec && rec.status !== 'absent' && <p className="text-xs text-gray-600 font-mono">{format(new Date(rec.checked_at), 'HH:mm')}</p>}
        <p className="text-xs text-gray-500">
          {rec?.status === 'present' ? '출석' : rec?.status === 'late' ? `지각(+${rec.late_minutes}분)` : '결석'}
        </p>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">로딩 중...</div>
    </div>
  )

  const stats = getStats()
  const history = getHistoryByDate()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{profile?.name}님</h1>
            <p className="text-xs text-gray-400">{format(new Date(), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/scan" className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">📷 출석하기</Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 요약 카드 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '총 출석', value: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '총 지각', value: stats.late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '총 결석', value: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
            { label: '이번달', value: stats.monthly, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}회</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* 오늘 교시별 현황 */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">오늘 출석 현황</h2>
          {periods.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 교시가 없습니다</p>
          ) : (
            <div className={`grid gap-3 ${periods.length >= 4 ? 'grid-cols-4' : `grid-cols-${periods.length}`}`}>
              {periods.map(p => todayPeriodCard(p))}
            </div>
          )}
        </div>

        {/* 누적 기록 테이블 */}
        <div>
          <h2 className="text-base font-bold text-gray-800 mb-3">누적 출석 기록</h2>
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">날짜</th>
                  {periods.map(p => (
                    <th key={p.id} className="px-3 py-2 text-center text-gray-600 font-medium">{p.period_number}교시</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.length === 0 ? (
                  <tr><td colSpan={periods.length + 1} className="text-center py-8 text-gray-400">기록이 없습니다</td></tr>
                ) : history.slice(0, 30).map(day => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 font-mono text-xs whitespace-nowrap">
                      {format(new Date(day.date), 'MM-dd')}
                    </td>
                    {periods.map(p => (
                      <td key={p.id} className="px-3 py-2 text-center text-xs">
                        {statusIcon(day.byPeriod[p.period_number])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
