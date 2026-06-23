import { AlertCircle } from 'lucide-react'

interface Props {
  currentRate: number
  minRate: number
}

export function AttendanceWarning({ currentRate, minRate }: Props) {
  if (currentRate >= minRate) return null

  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold text-red-900 text-sm">출석률 기준 미달</p>
        <p className="text-red-700 text-sm mt-0.5">
          현재 출석률({currentRate}%)이 기준({minRate}%) 미달입니다. 주의해 주세요.
        </p>
      </div>
    </div>
  )
}
