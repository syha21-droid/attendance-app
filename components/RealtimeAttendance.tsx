'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface AdminRealtimeProps {
  branchId: string
  onNewAttendance: () => void
}

export function AdminRealtime({ branchId, onNewAttendance }: AdminRealtimeProps) {
  useEffect(() => {
    const channel = supabase
      .channel('attendance-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance' }, () => {
        onNewAttendance()
        toast.success('새 출석이 기록되었습니다')
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance' }, () => {
        onNewAttendance()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [branchId, onNewAttendance])

  return null
}

interface StudentRealtimeProps {
  userId: string
  branchId: string
  onAttendanceUpdate: () => void
  onPeriodActivated: (periodNumber: number) => void
}

export function StudentRealtime({ userId, branchId, onAttendanceUpdate, onPeriodActivated }: StudentRealtimeProps) {
  useEffect(() => {
    const channel = supabase
      .channel('period-activation')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `user_id=eq.${userId}` },
        () => { onAttendanceUpdate() }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'class_periods' },
        (payload) => {
          if (payload.new.is_active === true) {
            toast(`📢 ${payload.new.period_number}교시 출석 체크가 시작되었습니다!`, { duration: 5000 })
            onPeriodActivated(payload.new.period_number)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, branchId, onAttendanceUpdate, onPeriodActivated])

  return null
}
