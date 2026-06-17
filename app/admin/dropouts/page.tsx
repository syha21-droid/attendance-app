'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Profile, ClassPeriod, Dropout } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const REASONS: { value: string; label: string; emoji: string }[] = [
  { value: 'boring', label: '강의 내용 불만족', emoji: '😴' },
  { value: 'busy', label: '업무/개인 사정으로 바쁨', emoji: '⏰' },
  { value: 'schedule', label: '시간 불일치', emoji: '📅' },
  { value: 'health', label: '건강 문제', emoji: '🏥' },
  { value: 'cost', label: '비용 문제', emoji: '💸' },
  { value: 'other', label: '기타', emoji: '📝' },
]

interface DropoutRow extends Dropout {
  profiles: Profile
  class_periods: ClassPeriod | null
}

export default function DropoutsPage() {
  const router = useRouter()
  const [adminProfile, setAdminProfile] = useState<Profile | null>(null)
  const [dropouts, setDropouts] = useState<DropoutRow[]>([])
  const [students, setStudents] = useState<Profile[]>([])
  const [periods, setPeriods] = useState<ClassPeriod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterReason, setFilterReason] = useState('')
  const [form, setForm] = useState({
    userId: '', periodId: '', courseType: '',
    dropoutDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '', reasonDetail: '',
  })

  const loadDropouts = useCallback(async (branchId: string) => {
    const res = await fetch(`/api/dropouts?branchId=${branchId}`)
    const data = await res.json()
    setDropouts(data || [])
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

      if (!prof || prof.role !== 'admin') { router.push('/'); return }
      setAdminProfile(prof)

      const [{ data: pds }, { data: stds }] = await Promise.all([
        supabase.from('class_periods').select('*').eq('branch_id', prof.branch_id).order('period_number'),
        supabase.from('profiles').select('*').eq('branch_id', prof.branch_id).eq('role', 'student').order('name'),
      ])
      setPeriods(pds || [])
      setStudents(stds || [])
      await loadDropouts(prof.branch_id)
      setLoading(false)
    }
    init()
  }, [router, loadDropouts])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!adminProfile) return
    if (!form.userId || !form.reason) { toast.error('학생과 이탈 이유를 선택해주세요'); return }

    const selectedStudent = students.find(s => s.id === form.userId)
    const selectedPeriod = periods.find(p => p.id === form.periodId)

    const res = await fetch('/api/dropouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: form.userId,
        branchId: adminProfile.branch_id,
        cohort: selectedStudent?.cohort,
        periodId: form.periodId || null,
        courseType: form.courseType || selectedPeriod?.course_type || null,
        dropoutDate: form.dropoutDate,
        reason: form.reason,
        reasonDetail: form.reasonDetail,
      }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || '등록 실패'); return }
    toast.success('중간 이탈 등록 완료')
    setShowForm(false)
    setForm({ userId: '', periodId: '', courseType: '', dropoutDate: format(new Date(), 'yyyy-MM-dd'), reason: '', reasonDetail: '' })
    loadDropouts(adminProfile.branch_id)
  }

  async function handleDelete(id: string) {
    if (!confirm('이탈 기록을 삭제하시겠습니까?')) return
    const res = await fetch(`/api/dropouts?id=${id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('삭제 실패'); return }
    toast.success('삭제되었습니다')
    if (adminProfile) loadDropouts(adminProfile.branch_id)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">로딩 중...</div></div>

  const filtered = filterReason ? dropouts.filter(d => d.reason === filterReason) : dropouts
  const reasonCounts = REASONS.map(r => ({ ...r, count: dropouts.filter(d => d.reason === r.value).length }))
  const orgName = (adminProfile as any)?.branches?.organizations?.name || ''
  const branchName = (adminProfile as any)?.branches?.name || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-gray-400">{orgName} &gt; {branchName}</p>
            <h1 className="text-xl font-bold text-gray-800">중간 이탈자 관리</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">대시보드</Link>
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium">
              + 이탈 등록
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {/* 이탈 이유 통계 카드 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {reasonCounts.map(r => (
            <button key={r.value} onClick={() => setFilterReason(filterReason === r.value ? '' : r.value)}
              className={`rounded-xl p-3 text-center border-2 transition-all ${filterReason === r.value ? 'border-red-400 bg-red-50' : 'border-transparent bg-white'}`}>
              <div className="text-2xl">{r.emoji}</div>
              <div className="text-xl font-bold text-gray-800 mt-1">{r.count}</div>
              <div className="text-xs text-gray-500 leading-tight mt-0.5">{r.label}</div>
            </button>
          ))}
        </div>

        {/* 이탈 등록 폼 */}
        {showForm && (
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">중간 이탈 등록</h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">수강생 *</label>
                  <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" required>
                    <option value="">수강생 선택</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.cohort ? `(${s.cohort})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">이탈일 *</label>
                  <input type="date" value={form.dropoutDate} onChange={e => setForm(f => ({ ...f, dropoutDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">수업/강의</label>
                  <select value={form.periodId} onChange={e => {
                    const p = periods.find(p => p.id === e.target.value)
                    setForm(f => ({ ...f, periodId: e.target.value, courseType: p?.course_type || f.courseType }))
                  }} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50">
                    <option value="">수업 선택 (선택사항)</option>
                    {periods.map(p => <option key={p.id} value={p.id}>{p.period_number}교시 - {p.name}{p.course_type ? ` [${p.course_type}]` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 mb-1 block">수업 종류</label>
                  <input type="text" value={form.courseType} onChange={e => setForm(f => ({ ...f, courseType: e.target.value }))}
                    list="course-type-list"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50"
                    placeholder="예: MBA, 창업스쿨, 마케팅" />
                  <datalist id="course-type-list">
                    <option value="MBA" />
                    <option value="창업스쿨" />
                    <option value="마케팅" />
                    <option value="IT/개발" />
                    <option value="일반" />
                  </datalist>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">이탈 이유 *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {REASONS.map(r => (
                      <button key={r.value} type="button" onClick={() => setForm(f => ({ ...f, reason: r.value }))}
                        className={`py-2 px-3 rounded-lg text-sm border-2 text-center transition-all ${form.reason === r.value ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}>
                        {r.emoji} {r.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-600 mb-1 block">추가 메모</label>
                  <textarea value={form.reasonDetail} onChange={e => setForm(f => ({ ...f, reasonDetail: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50" rows={2}
                    placeholder="구체적인 이탈 이유나 피드백 내용 (선택사항)" />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm">취소</button>
                <button type="submit" className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm">등록</button>
              </div>
            </form>
          </div>
        )}

        {/* 이탈자 목록 */}
        <div className="bg-white rounded-xl border shadow-sm overflow-x-auto">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">이탈자 목록 ({filtered.length}명)</h2>
            {filterReason && (
              <button onClick={() => setFilterReason('')} className="text-xs text-gray-400 hover:text-gray-600 underline">필터 해제</button>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-4 py-3 text-left text-gray-600 font-medium">이름</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">기수</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">수업 종류</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">수업명</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">이탈일</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">이유</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">메모</th>
                <th className="px-4 py-3 text-left text-gray-600 font-medium">삭제</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">중간 이탈 기록이 없습니다</td></tr>
              ) : filtered.map(d => {
                const r = REASONS.find(r => r.value === d.reason)
                return (
                  <tr key={d.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.profiles?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.cohort || '-'}</td>
                    <td className="px-4 py-3">
                      {d.course_type && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">{d.course_type}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.class_periods ? `${d.class_periods.period_number}교시 ${d.class_periods.name}` : '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{format(new Date(d.dropout_date), 'yyyy.MM.dd (EEE)', { locale: ko })}</td>
                    <td className="px-4 py-3">
                      {r && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{r.emoji} {r.label}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{d.reason_detail || '-'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(d.id)} className="text-xs text-red-400 hover:text-red-600 hover:underline">삭제</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
