'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Attendance, Profile, ClassPeriod } from '@/lib/supabase'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface AttendanceRow extends Attendance {
  profiles: Profile & { branches: { name: string; organizations: { name: string } } }
  class_periods: ClassPeriod
}

interface Stats {
  present: number
  late: number
  absent: number
  total: number
}

export default function AdminPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [periods, setPeriods] = useState<ClassPeriod[]>([])
  const [attendances, setAttendances] = useState<AttendanceRow[]>([])
  const [activeTab, setActiveTab] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const today = format(new Date(), 'yyyy-MM-dd')

  const loadAttendances = useCallback(async (branchId: string) => {
    const { data } = await supabase
      .from('attendance')
      .select('*, profiles(*, branches(name, organizations(name))), class_periods(*)')
      .eq('date', today)
      .order('checked_at', { ascending: false })
    setAttendances((data as AttendanceRow[]) || [])
  }, [today])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*, branches(*, organizations(*))')
        .eq('id', user.id)
        .single()

      if (!prof || prof.role !== 'admin') { router.push('/'); return }
      setProfile(prof)

      const { data: pds } = await supabase
        .from('class_periods')
        .select('*')
        .eq('branch_id', prof.branch_id)
        .order('period_number')
      setPeriods(pds || [])

      await loadAttendances(prof.branch_id)
      setLoading(false)
    }
    init()
  }, [loadAttendances, router])

  useEffect(() => {
    if (!profile) return
    const channel = supabase
      .channel('admin-attendance')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, () => {
        loadAttendances(profile.branch_id)
        toast.success('새 출석이 기록되었습니다')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance' }, () => {
        loadAttendances(profile.branch_id)
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [profile, loadAttendances])

  async function changeStatus(id: string, status: 'present' | 'late' | 'absent') {
    const { error } = await supabase.from('attendance').update({ status }).eq('id', id)
    if (error) { toast.error('변경 실패'); return }
    toast.success('상태가 변경되었습니다')
    if (profile) loadAttendances(profile.branch_id)
  }

  function downloadCSV() {
    const rows = filteredAttendances()
    const header = '이름,사업단,지점,교시,입실시각,상태,지각시간,날짜'
    const body = rows.map(r => [
      r.profiles?.name || '',
      r.profiles?.branches?.organizations?.name || '',
      r.profiles?.branches?.name || '',
      `${r.period_number}교시`,
      r.checked_at ? format(new Date(r.checked_at), 'HH:mm:ss') : '-',
      r.status === 'present' ? '출석' : r.status === 'late' ? '지각' : '결석',
      r.late_minutes ? `+${r.late_minutes}분` : '-',
      r.date,
    ].join(',')).join('\n')
    const blob = new Blob(['﻿' + header + '\n' + body], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `출석_${today}.csv`
    a.click()
  }

  function filteredAttendances() {
    if (activeTab === null) return attendances
    return attendances.filter(a => a.period_number === activeTab)
  }

  function getStats(list: AttendanceRow[]): Stats {
    return {
      present: list.filter(a => a.status === 'present').length,
      late: list.filter(a => a.status === 'late').length,
      absent: list.filter(a => a.status === 'absent').length,
      total: list.length,
    }
  }

  function statusBadge(status: string) {
    if (status === 'present') return <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">✅ 출석</span>
    if (status === 'late') return <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">🟡 지각</span>
    return <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">❌ 결석</span>
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-lg">로딩 중...</div>
    </div>
  )

  const orgName = (profile as any)?.branches?.organizations?.name || ''
  const branchName = (profile as any)?.branches?.name || ''
  const filtered = filteredAttendances()
  const stats = getStats(filtered)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">{orgName} &gt; {branchName}</p>
            <h1 className="text-xl font-bold text-gray-800">관리자 대시보드</h1>
            <p className="text-xs text-gray-400 mt-0.5">{format(new Date(), 'yyyy년 MM월 dd일 (EEEE)', { locale: ko })}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Link href="/admin/users" className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 rounded-lg text-green-700">회원 관리</Link>
            <Link href="/admin/periods" className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700">교시 설정</Link>
            <Link href="/admin/qr" className="px-4 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700">QR 생성</Link>
            <button onClick={downloadCSV} className="px-4 py-2 text-sm bg-green-100 hover:bg-green-200 rounded-lg text-green-700">CSV 다운로드</button>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        {/* 탭 */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === null ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
          >전체</button>
          {periods.map(p => (
            <button
              key={p.id}
              onClick={() => setActiveTab(p.period_number)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === p.period_number ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}
            >{p.period_number}교시</button>
          ))}
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: '출석', value: stats.present, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '지각', value: stats.late, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            { label: '결석', value: stats.absent, color: 'text-red-600', bg: 'bg-red-50' },
            { label: '전체', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(c => (
            <div key={c.label} className={`${c.bg} rounded-xl p-4 text-center`}>
              <div className={`text-3xl font-bold ${c.color}`}>{c.value}명</div>
              <div className="text-sm text-gray-500 mt-1">{c.label}</div>
            </div>
          ))}
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-gray-600 font-medium">이름</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">사업단</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">지점</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">교시</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">입실시각</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">상태</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium hidden md:table-cell">지각시간</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">변경</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">출석 기록이 없습니다</td></tr>
              ) : filtered.map(row => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.profiles?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.profiles?.branches?.organizations?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{row.profiles?.branches?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{row.period_number}교시</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">
                    {row.checked_at ? format(new Date(row.checked_at), 'HH:mm:ss') : '-'}
                  </td>
                  <td className="px-4 py-3">{statusBadge(row.status)}</td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {row.status === 'late' && row.late_minutes ? `+${row.late_minutes}분` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      onChange={(e) => changeStatus(row.id, e.target.value as 'present' | 'late' | 'absent')}
                      className="text-xs border rounded px-2 py-1 bg-white text-gray-700"
                    >
                      <option value="present">출석</option>
                      <option value="late">지각</option>
                      <option value="absent">결석</option>
                    </select>
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
