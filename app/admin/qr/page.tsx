'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, ClassPeriod, Profile } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface QRSlot {
  token: string | null
  expiresAt: Date | null
  remaining: number
}

interface PeriodQR {
  period: ClassPeriod
  checkin: QRSlot
  checkout: QRSlot
}

const empty: QRSlot = { token: null, expiresAt: null, remaining: 0 }

export default function QRPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [list, setList] = useState<PeriodQR[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    loadData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setList(prev => prev.map(q => ({
        ...q,
        checkin: { ...q.checkin, remaining: q.checkin.expiresAt ? Math.max(0, Math.floor((q.checkin.expiresAt.getTime() - Date.now()) / 1000)) : 0 },
        checkout: { ...q.checkout, remaining: q.checkout.expiresAt ? Math.max(0, Math.floor((q.checkout.expiresAt.getTime() - Date.now()) / 1000)) : 0 },
      })))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase.from('profiles').select('*, branches(*, organizations(*))').eq('id', user.id).single()
    if (!prof || prof.role !== 'admin') { router.push('/'); return }
    setProfile(prof)

    const { data: periods } = await supabase.from('class_periods').select('*').eq('branch_id', prof.branch_id).eq('is_active', true).order('period_number')
    setList((periods || []).map(p => ({ period: p, checkin: { ...empty }, checkout: { ...empty } })))
    setLoading(false)
  }

  async function generateQR(periodId: string, periodNumber: number, type: 'checkin' | 'checkout') {
    if (!profile) return
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await supabase.from('qr_tokens').delete().eq('period_id', periodId).eq('type', type)

    const { error } = await supabase.from('qr_tokens').insert({
      branch_id: profile.branch_id,
      period_id: periodId,
      period_number: periodNumber,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: profile.id,
      type,
    })

    if (error) { toast.error('QR 생성 실패'); return }

    const slot: QRSlot = { token, expiresAt, remaining: 600 }
    setList(prev => prev.map(q =>
      q.period.id === periodId
        ? { ...q, [type]: slot }
        : q
    ))
    toast.success(`${type === 'checkin' ? '입실' : '퇴실'} QR 생성 완료 (10분 유효)`)
  }

  function fmt(sec: number) {
    return `${Math.floor(sec / 60).toString().padStart(2, '0')}:${(sec % 60).toString().padStart(2, '0')}`
  }

  async function handleLogout() { await supabase.auth.signOut(); router.push('/') }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">로딩 중...</div></div>

  const orgName = (profile as any)?.branches?.organizations?.name || ''
  const branchName = (profile as any)?.branches?.name || ''

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">{orgName} &gt; {branchName}</p>
            <h1 className="text-xl font-bold text-gray-800">QR코드 생성</h1>
          </div>
          <div className="flex gap-2">
            <Link href="/admin" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">대시보드</Link>
            <Link href="/admin/periods" className="px-4 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded-lg text-purple-700">교시 설정</Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-red-100 hover:bg-red-200 rounded-lg text-red-700">로그아웃</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {list.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>활성화된 교시가 없습니다.</p>
            <Link href="/admin/periods" className="mt-3 inline-block text-blue-500 hover:underline">교시 설정 &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {list.map((q) => (
              <div key={q.period.id} className="bg-white rounded-2xl shadow border overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50 flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-800">{q.period.period_number}교시</span>
                  <span className="text-gray-500 text-sm">{q.period.name}</span>
                  <span className="text-gray-400 text-sm">{q.period.start_time} ~ {q.period.end_time}</span>
                  {q.period.course_type && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{q.period.course_type}</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                  {/* 입실 QR */}
                  <div className="p-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                      <h3 className="font-semibold text-gray-700">입실 QR</h3>
                      <span className="text-xs text-gray-400">수업 시작 시 스캔</span>
                    </div>

                    <div className="border-4 border-blue-100 rounded-xl p-3">
                      {q.checkin.token ? (
                        <QRCodeSVG value={`${origin}/student/scan?token=${q.checkin.token}`} size={180} level="M" />
                      ) : (
                        <div className="w-[180px] h-[180px] flex items-center justify-center bg-blue-50 rounded-lg text-blue-300 text-sm">QR 미생성</div>
                      )}
                    </div>

                    {q.checkin.token && (
                      <div className={`text-2xl font-mono font-bold ${q.checkin.remaining < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                        {q.checkin.remaining > 0 ? fmt(q.checkin.remaining) : '만료됨'}
                      </div>
                    )}

                    <button onClick={() => generateQR(q.period.id, q.period.period_number, 'checkin')}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      {q.checkin.token ? '입실 QR 재생성' : '입실 QR 생성'}
                    </button>
                  </div>

                  {/* 퇴실 QR */}
                  <div className="p-6 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-orange-400 inline-block"></span>
                      <h3 className="font-semibold text-gray-700">퇴실 QR</h3>
                      <span className="text-xs text-gray-400">수업 종료 시 스캔</span>
                    </div>

                    <div className="border-4 border-orange-100 rounded-xl p-3">
                      {q.checkout.token ? (
                        <QRCodeSVG value={`${origin}/student/scan?token=${q.checkout.token}`} size={180} level="M" />
                      ) : (
                        <div className="w-[180px] h-[180px] flex items-center justify-center bg-orange-50 rounded-lg text-orange-300 text-sm">QR 미생성</div>
                      )}
                    </div>

                    {q.checkout.token && (
                      <div className={`text-2xl font-mono font-bold ${q.checkout.remaining < 60 ? 'text-red-500' : 'text-orange-500'}`}>
                        {q.checkout.remaining > 0 ? fmt(q.checkout.remaining) : '만료됨'}
                      </div>
                    )}

                    <button onClick={() => generateQR(q.period.id, q.period.period_number, 'checkout')}
                      className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors">
                      {q.checkout.token ? '퇴실 QR 재생성' : '퇴실 QR 생성'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
