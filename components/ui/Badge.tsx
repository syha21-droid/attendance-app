import { cn } from '@/lib/utils/cn'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'present' | 'late' | 'absent' | 'excused' | 'exited' | 'pending' | 'reviewed' | 'converted' | 'approved' | 'rejected' | 'default'
  className?: string
}

const variantClasses = {
  present: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  late: 'bg-amber-100 text-amber-800 ring-amber-200',
  absent: 'bg-red-100 text-red-800 ring-red-200',
  excused: 'bg-blue-100 text-blue-800 ring-blue-200',
  exited: 'bg-pink-100 text-pink-800 ring-pink-200',
  pending: 'bg-yellow-100 text-yellow-800 ring-yellow-200',
  reviewed: 'bg-gray-100 text-gray-700 ring-gray-200',
  converted: 'bg-blue-100 text-blue-800 ring-blue-200',
  approved: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  rejected: 'bg-red-100 text-red-800 ring-red-200',
  default: 'bg-gray-100 text-gray-700 ring-gray-200',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
