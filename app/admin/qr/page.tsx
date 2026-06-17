'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { supabase, ClassPeriod, Profile } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface QRData {
  period: ClassPeriod
  token: string | null
  expiresAt: Date | null
  remaining: number
}

export default function QRPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [qrDataList, setQrDataList] = useState<QRData[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState('')

  useEffect(() => {
    setOrigin(window.location.origin)
    loadData()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setQrDataList(prev => prev.map(q => ({
        ...q,
        remaining: q.expiresAt ? Math.max(0, Math.floor((q.expiresAt.getTime() - Date.now()) / 1000)) : 0
      })))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    const { data: prof } = await supabase
      .from('profiles')
      .select('*, branches(*, organizations(*))')
      .eq('id', user.id)
      .single()

    if (!prof || prof.role !== 'admin') { router.push('/'); return }
    setProfile(prof)

    const { data: periods } = await supabase
      .from('class_periods')
      .select('*')
      .eq('branch_id', prof.branch_id)
      .eq('is_active', true)
      .order('period_number')

    const list: QRData[] = (periods || []).map(p => ({
      period: p,
      token: null,
      expiresAt: null,
      remaining: 0,
    }))
    setQrDataList(list)
    setLoading(false)
  }

  async function generateQR(periodId: string, periodNumber: number) {
    if (!profile) return
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await supabase.from('qr_tokens').delete().eq('period_id', periodId)

    const { error } = await supabase.from('qr_tokens').insert({
      branch_id: profile.branch_id,
      period_id: periodId,
      period_number: periodNumber,
      token,
      expires_at: expiresAt.toISOString(),
      created_by: profile.id,
    })

    if (error) { toast.error('QR 생성 실패'); return }

    setQrDataList(prev => prev.map(q =>
      q.period.id === periodId
        ? { ...q, token, expiresAt, remaining: 600 }
        : q
    ))
    toast.success('QR코드가 생성되었습니다 (10분 유효)')
  }

  function handlePrint(periodNumber: number) {
    window.print()
  }

  function formatRemaining(sec: number) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0')
    const s = (sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
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
        {qrDataList.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">📭</div>
            <p>활성화된 교시가 없습니다.</p>
            <Link href="/admin/periods" className="mt-3 inline-block text-blue-500 hover:underline">교시 설정 &rarr;</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {qrDataList.map((q) => (
              <div key={q.period.id} className="bg-white rounded-2xl shadow border p-6 flex flex-col items-center gap-4">
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-800">{q.period.period_number}교시</h2>
                  <p className="text-gray-500 text-sm">{q.period.start_time} ~ {q.period.end_time}</p>
                  <p className="text-xs text-yellow-600 mt-1">지각: {q.period.late_threshold_minutes}분 초과 시</p>
                </div>

                <div className="border-4 border-gray-200 rounded-xl p-3">
                  {q.token ? (
                    <QRCodeSVG
                      value={`${origin}/student/scan?token=${q.token}`}
                      size={200}
                      level="M"
                    />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center bg-gray-100 rounded-lg text-gray-400 text-sm">
                      QR 미생성
                    </div>
                  )}
                </div>

                {q.token && (
                  <div className={`text-2xl font-mono font-bold ${q.remaining < 60 ? 'text-red-500' : 'text-blue-600'}`}>
                    {q.remaining > 0 ? formatRemaining(q.remaining) : '만료됨'}
                  </div>
                )}

                <div className="flex gap-2 w-full print:hidden">
                  <button
                    onClick={() => generateQR(q.period.id, q.period.period_number)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {q.token ? '새로 생성' : 'QR 생성'}
                  </button>
                  {q.token && (
                    <button
                      onClick={() => handlePrint(q.period.period_number)}
                      className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                    >
                      프린트
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
