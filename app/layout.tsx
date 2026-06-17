import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'

export const metadata: Metadata = {
  title: '출석체크 시스템',
  description: 'QR코드 기반 출석체크 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen">
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
