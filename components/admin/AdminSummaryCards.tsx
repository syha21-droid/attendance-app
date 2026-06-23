import { CheckCircle, Clock, XCircle, ShieldCheck, LogOut } from 'lucide-react'

interface Props {
  present: number
  late: number
  absent: number
  excused: number
  exited: number
}

export function AdminSummaryCards({ present, late, absent, excused, exited }: Props) {
  const cards = [
    { label: '출석', value: present, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: '지각', value: late, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: '결석', value: absent, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '공결', value: excused, icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: '이탈', value: exited, icon: LogOut, color: 'text-pink-600', bg: 'bg-pink-50' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className={`${bg} rounded-xl p-4 flex flex-col gap-2`}>
          <Icon className={`w-5 h-5 ${color}`} />
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className={`text-sm font-medium ${color}`}>{label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
