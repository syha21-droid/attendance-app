'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { Suspense } from 'react'

type ScanResult =
  | { type: 'success'; message: string; detail: string }
  | { type: 'late'; message: string; detail: string; lateCount: number }
  | { type: 'duplicate'; message: string }
  | { type: 'expired'; message: string }
  | { type: 'error'; message: string }

function ScanContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get('token')

  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(false)
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrRef = useRef<unknown>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/')
    })
  }, [router])

  useEffect(() => {
    if (tokenFromUrl) {
      submitAttendance(tokenFromUrl)
    }
  }, [tokenFromUrl])

  async function startScanner() {
    setScanning(true)
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-reader')
    html5QrRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (text: string) => {
          await scanner.stop()
          setScanning(false)
          const url = new URL(text)
          const token = url.searchParams.get('token')
          if (token) await submitAttendance(token)
          else setResult({ type: 'error', message: '❗ 유효하지 않은 QR코드입니다.' })
        },
        () => {}
      )
    } catch {
      setScanning(false)
      toast.error('카메라를 시작할 수 없습니다')
    }
  }

  async function stopScanner() {
    if (html5QrRef.current) {
      try { await (html5QrRef.current as { stop: () => Promise<void> }).stop() } catch {}
    }
    setScanning(false)
  }

  async function submitAttendance(token: string) {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }

      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: user.id }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'EXPIRED') setResult({ type: 'expired', message: '⏰ QR코드가 만료되었습니다. 교육팀에 문의해주세요.' })
        else if (data.code === 'DUPLICATE') setResult({ type: 'duplicate', message: `⚠️ 이미 ${data.periodNumber}교시 출석하셨습니다 (${data.checkedAt} 입실)` })
        else setResult({ type: 'error', message: '❗ 출석 처리 중 오류가 발생했습니다. 교육팀에 문의해주세요.' })
        return
      }

      if (data.status === 'present') {
        setResult({ type: 'success', message: `✅ ${data.periodNumber}교시 출석 완료!`, detail: `${data.checkedAt}에 출석하셨습니다` })
      } else {
        setResult({ type: 'late', message: `🟡 ${data.periodNumber}교시 지각 처리되었습니다`, detail: `${data.checkedAt} 입실 / ${data.lateMinutes}분 지각`, lateCount: data.lateCount })
      }
    } catch {
      setResult({ type: 'error', message: '❗ 출석 처리 중 오류가 발생했습니다. 교육팀에 문의해주세요.' })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">출석 처리 중...</p>
      </div>
    </div>
  )

  if (result) {
    const colors = {
      success: 'bg-green-50 border-green-200',
      late: 'bg-yellow-50 border-yellow-200',
      duplicate: 'bg-blue-50 border-blue-200',
      expired: 'bg-orange-50 border-orange-200',
      error: 'bg-red-50 border-red-200',
    }
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className={`max-w-sm w-full rounded-2xl border-2 ${colors[result.type]} p-8 text-center space-y-4`}>
          <div className="text-4xl">
            {result.type === 'success' ? '✅' : result.type === 'late' ? '🟡' : result.type === 'duplicate' ? '⚠️' : result.type === 'expired' ? '⏰' : '❗'}
          </div>
          <p className="text-xl font-bold text-gray-800">{result.message}</p>
          {'detail' in result && <p className="text-gray-600 text-sm">{result.detail}</p>}
          {result.type === 'late' && <p className="text-yellow-700 text-sm font-medium">지각 누적: {(result as { lateCount: number }).lateCount}회</p>}
          <div className="flex gap-3 justify-center pt-2">
            <button onClick={() => setResult(null)} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">다시 스캔</button>
            <Link href="/student" className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">현황 보기</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">QR 출석체크</h1>
          <Link href="/student" className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700">내 현황</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8 flex flex-col items-center gap-6">
        <p className="text-gray-500 text-sm text-center">교실에 부착된 QR코드를 스캔하세요</p>

        <div id="qr-reader" className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 border-gray-200 ${!scanning ? 'hidden' : ''}`} />

        {!scanning && (
          <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
            <div className="text-center">
              <div className="text-6xl mb-3">📷</div>
              <p className="text-sm">카메라가 비활성 상태입니다</p>
            </div>
          </div>
        )}

        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full max-w-sm py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl transition-colors"
          >
            카메라 시작
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full max-w-sm py-4 bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg rounded-2xl transition-colors"
          >
            스캔 중지
          </button>
        )}
      </main>
    </div>
  )
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-400">로딩 중...</div></div>}>
      <ScanContent />
    </Suspense>
  )
}
