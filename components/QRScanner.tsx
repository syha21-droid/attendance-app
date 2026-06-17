'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  onScan: (text: string) => void
  onStop?: () => void
}

export default function QRScanner({ onScan, onStop }: Props) {
  const [active, setActive] = useState(false)
  const scannerRef = useRef<unknown>(null)

  async function start() {
    const { Html5Qrcode } = await import('html5-qrcode')
    const scanner = new Html5Qrcode('qr-scanner-element')
    scannerRef.current = scanner
    setActive(true)

    await scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (text: string) => {
        stop()
        onScan(text)
      },
      () => {}
    )
  }

  async function stop() {
    if (scannerRef.current) {
      try { await (scannerRef.current as { stop: () => Promise<void> }).stop() } catch {}
    }
    setActive(false)
    onStop?.()
  }

  useEffect(() => {
    return () => { stop() }
  }, [])

  return (
    <div className="flex flex-col items-center gap-4">
      <div id="qr-scanner-element" className={`w-full max-w-sm rounded-2xl overflow-hidden border-2 border-gray-200 ${!active ? 'hidden' : ''}`} />
      {!active && (
        <div className="w-full max-w-sm aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="text-6xl mb-3">📷</div>
            <p className="text-sm">카메라 비활성</p>
          </div>
        </div>
      )}
      {!active ? (
        <button onClick={start} className="w-full max-w-sm py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-2xl">카메라 시작</button>
      ) : (
        <button onClick={stop} className="w-full max-w-sm py-4 bg-gray-400 hover:bg-gray-500 text-white font-bold text-lg rounded-2xl">스캔 중지</button>
      )}
    </div>
  )
}
