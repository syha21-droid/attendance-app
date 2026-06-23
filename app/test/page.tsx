'use client'
import { useEffect, useState } from 'react'

export default function TestPage() {
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const d = localStorage.getItem('attendance_current_user')
    if (d) setUser(JSON.parse(d))
  }, [])

  return (
    <div style={{padding: '40px', fontFamily: 'Arial'}}>
      <h1>테스트 페이지</h1>
      <h2>반갑습니다, {user?.name}님!</h2>
      <p>이메일: {user?.email}</p>
      <p>사업단: {user?.courseId}</p>
      <button onClick={() => {
        localStorage.clear()
        window.location.href = '/login'
      }} style={{padding: '10px 20px', fontSize: '16px'}}>로그아웃</button>
    </div>
  )
}
