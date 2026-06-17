'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Attendance, ClassPeriod, Profile } from '@/lib/supabase'
import { format, differenceInCalendarDays, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AttendanceWithPeriod extends Attendance {
  class_periods: ClassPeriod
}

interface CohortTarget {
  cohort: string
  target_rate: number
}

export default function StudentPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<ClassPeriod[]>([])
  const [attendances, setAttendances] = useState<AttendanceWithPeriod[]>([])
  const [cohortTarget, setCohortTarget] = useState<CohortTarget | null>(null)
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

      if (prof.cohort) {
        const { data: ct } = await supabase
          .from('cohort_targets')
          .select('*')
          .eq('branch_id', prof.branch_id)
          .eq('cohort', prof.cohort)
          .single()
        setCohortTarget(ct)
      }

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

  // 출석률 계산
  function calcAttendanceRate() {
    if (attendances.length === 0) return 0
    const valid = attendances.filter(a => a.status !== 'absent').length
    return Math.round((valid / attendances.length) * 100)
  }

  // 연속 출석 계산
  function calcStreak() {
    const dates = [...new Set(
      attendances
        .filter(a => a.status !== 'absent')
        .map(a => a.date)
    )].sort((a, b) => b.localeCompare(a))

    if (dates.length === 0) return 0
    if (dates[0] !== today && dates[0] !== format(subDays(new Date(), 1), 'yyyy-MM-dd')) return 0

    let streak = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = differenceInCalendarDays(new Date(dates[i - 1]), new Date(dates[i]))
      if (diff === 1) streak++
      else break
    }
    return streak
  }

  // 이번달 통계
  function calcMonthStats() {
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd')
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd')
    const monthData = attendances.filter(a => a.date >= monthStart && a.date <= monthEnd)
    const present = monthData.filter(a => a.status !== 'absent').length
    return { present, total: monthData.length }
  }

  function getTodayPeriodStatus(periodNumber: number) {
    return attendances.find(a => a.date === today && a.period_number === periodNumber) || null
  }

  function getStreakMessage(streak: number) {
    if (streak === 0) return '출석을 시작해보세요! 💪'
    if (streak < 3) return `${streak}일 연속 출석 중! 계속 해봐요 🌱`
    if (streak < 7) return `${streak}일 연속! 좋은 흐름이에요 🔥`
    if (streak < 14) return `${streak}일 연속! 대단해요! ⚡`
    return `${streak}일 연속! 완벽한 출석왕! 👑`
  }

  function getRateMessage(rate: number) {
    if (rate >= 95) return '완벽한 출석률이에요! 👑'
    if (rate >= 80) return '훌륭한 출석률이에요! ⭐'
    if (rate >= 60) return '조금 더 노력해봐요! 💪'
    return '출석률을 높여봐요! 🎯'
  }

  function getHistoryByDate() {
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
    if (a.status === 'present') return <span className="text-green-600 text-xs">✅ {format(new Date(a.checked_at), 'HH:mm')}</span>
    if (a.status === 'late') return <span className="text-yellow-600 text-xs">🟡 {format(new Date(a.checked_at), 'HH:mm')}<span className="ml-0.5">(+{a.late_minutes}분)</span></span>
    return <span className="text-red-500 text-xs">❌</span>
  }

  function todayPeriodCard(period: ClassPeriod) {
    const rec = getTodayPeriodStatus(period.period_number)
    if (!rec && !period.is_active) {
      return (
        <div key={period.id} className="flex flex-col items-center gap-1 p-3 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-xs font-bold text-gray-500">{period.period_number}교시</p>
          <p className="text-xs text-gray-400">{period.start_time.slice(0,5)}</p>
          <span className="text-xl">⏳</span>
          <p className="text-xs text-gray-400">대기중</p>
        </div>
      )
    }
    if (!rec && period.is_active) {
      return (
        <Link key={period.id} href="/student/scan" className="flex flex-col items-center gap-1 p-3 bg-blue-50 rounded-xl border-2 border-blue-300 hover:bg-blue-100 transition-colors">
          <p className="text-xs font-bold text-blue-700">{period.period_number}교시</p>
          <p className="text-xs text-blue-500">{period.start_time.slice(0,5)}</p>
          <span className="text-xl">📷</span>
          <p className="text-xs text-blue-600 font-medium">스캔</p>
        </Link>
      )
    }
    const colors = rec?.status === 'present' ? 'bg-green-50 border-green-200' : rec?.status === 'late' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
    return (
      <div key={period.id} className={`flex flex-col items-center gap-1 p-3 rounded-xl border ${colors}`}>
        <p className="text-xs font-bold text-gray-700">{period.period_number}교시</p>
        <p className="text-xs text-gray-500">{period.start_time.slice(0,5)}</p>
        <span className="text-xl">{rec?.status === 'present' ? '✅' : rec?.status === 'late' ? '🟡' : '❌'}</span>
        {rec && rec.status !== 'absent' && <p className="text-xs text-gray-600 font-mono">{format(new Date(rec.checked_at), 'HH:mm')}</p>}
        <p className="text-xs text-gray-500">{rec?.status === 'present' ? '출석' : rec?.status === 'late' ? `+${rec.late_minutes}분` : '결석'}</p>
      </div>
    )
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">로딩 중...</div>
    </div>
  )

  const rate = calcAttendanceRate()
  const streak = calcStreak()
  const monthStats = calcMonthStats()
  const history = getHistoryByDate()
  const cohort = (profile as any)?.cohort || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">{profile?.name}님 {cohort && <span className="text-sm text-blue-500 font-normal">({cohort})</span>}</h1>
            <p className="text-xs text-gray-400">{format(new Date(), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/student/scan" className="px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">📷 출석</Link>
            <button onClick={handleLogout} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* 동기부여 카드 - 출석률 */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-blue-100 text-sm">전체 출석률</p>
              <p className="text-4xl font-bold">{rate}%</p>
              <p className="text-blue-100 text-xs mt-1">{getRateMessage(rate)}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">연속 출석</p>
              <p className="text-4xl font-bold">{streak}일 🔥</p>
              <p className="text-blue-100 text-xs mt-1">{getStreakMessage(streak)}</p>
            </div>
          </div>
          <div className="bg-blue-400 bg-opacity-30 rounded-full h-3 mt-2">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>

        {/* 기수 목표 달성률 */}
        {cohort && (
          <div className="bg-white rounded-2xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-bold text-gray-700">{cohort} 목표 달성률</p>
                <p className="text-xs text-gray-400">목표: {cohortTarget?.target_rate || 80}% 출석</p>
              </div>
              <div className="text-right">
                <span className={`text-2xl font-bold ${rate >= (cohortTarget?.target_rate || 80) ? 'text-green-500' : 'text-orange-500'}`}>
                  {Math.round((rate / (cohortTarget?.target_rate || 80)) * 100)}%
                </span>
                <p className="text-xs text-gray-400">달성</p>
              </div>
            </div>
            <div className="bg-gray-100 rounded-full h-3">
              <div
                className={`rounded-full h-3 transition-all duration-500 ${rate >= (cohortTarget?.target_rate || 80) ? 'bg-green-500' : 'bg-orange-400'}`}
                style={{ width: `${Math.min(100, Math.round((rate / (cohortTarget?.target_rate || 80)) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-400">0%</span>
              <span className="text-xs text-gray-400">목표 {cohortTarget?.target_rate || 80}%</span>
            </div>
          </div>
        )}

        {/* 이번달 + 전체 통계 */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: '전체 출석', value: attendances.filter(a => a.status === 'present').length, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '전체 지각', value: attendances.filter(a => a.status === 'late').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '전체 결석', value: attendances.filter(a => a.status === 'absent').length, color: 'text-red-600', bg: 'bg-red-50' },
            { label: '이번달', value: monthStats.present, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3 text-center`}>
              <div className={`text-xl font-bold ${c.color}`}>{c.value}회</div>
              <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* 오늘 교시별 현황 */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2">오늘 출석 현황</h2>
          {periods.length === 0 ? (
            <p className="text-gray-400 text-sm">등록된 교시가 없습니다</p>
          ) : (
            <div className={`grid gap-2 grid-cols-${Math.min(periods.length, 4)}`}
              style={{ gridTemplateColumns: `repeat(${Math.min(periods.length, 4)}, 1fr)` }}>
              {periods.map(p => todayPeriodCard(p))}
            </div>
          )}
        </div>

        {/* 누적 기록 테이블 */}
        <div>
          <h2 className="text-sm font-bold text-gray-700 mb-2">누적 출석 기록</h2>
          <div className="bg-white rounded-xl shadow border overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="px-3 py-2 text-left text-gray-600 font-medium">날짜</th>
                  {periods.map(p => (
                    <th key={p.id} className="px-2 py-2 text-center text-gray-600 font-medium">{p.period_number}교시</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {history.length === 0 ? (
                  <tr><td colSpan={periods.length + 1} className="text-center py-8 text-gray-400">기록이 없습니다</td></tr>
                ) : history.slice(0, 30).map(day => (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-600 font-mono whitespace-nowrap">
                      {format(new Date(day.date), 'MM-dd')}
                    </td>
                    {periods.map(p => (
                      <td key={p.id} className="px-2 py-2 text-center">
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
