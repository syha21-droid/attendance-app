'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useHeartbeat(studentId: string | null, periodId: string | null) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!studentId || !periodId) return
    const supabase = createClient()

    async function sendHeartbeat() {
      await supabase.from('heartbeats').insert({ student_id: studentId, period_id: periodId })
    }

    sendHeartbeat()
    timerRef.current = setInterval(sendHeartbeat, 30_000) // 30초마다

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [studentId, periodId])
}
