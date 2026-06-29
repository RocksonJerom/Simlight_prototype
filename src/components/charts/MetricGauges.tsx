/** Semicircle odometer gauge (0–max). */
export function OdometerGauge({
  value,
  max = 100,
  label,
  unit = '%',
  color = '#005b7f',
  size = 'md',
}: {
  value: number
  max?: number
  label: string
  unit?: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const pct = Math.min(1, Math.max(0, value / max))
  const dims = size === 'sm' ? 72 : size === 'lg' ? 120 : 96
  const r = dims * 0.36
  const cx = dims / 2
  const cy = dims * 0.55
  const circumference = Math.PI * r
  const dash = pct * circumference

  const display =
    unit === 'Cr' ? `${(value / 10).toFixed(1)} Cr` : unit === '' ? String(Math.round(value)) : `${Math.round(value)}${unit}`

  return (
    <div className="flex flex-col items-center">
      <svg width={dims} height={dims * 0.62} viewBox={`0 0 ${dims} ${dims * 0.62}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={size === 'sm' ? 6 : 8}
          className="text-slate-200"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={size === 'sm' ? 6 : 8}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="fill-slate-800 text-[11px] font-bold" fontSize={size === 'lg' ? 14 : 11}>
          {display}
        </text>
      </svg>
      <p className={`text-slate-600 font-medium ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>{label}</p>
    </div>
  )
}

/** Donut pie chart for skill / scoring metrics. */
export function SkillsPieChart({
  items,
  size = 140,
}: {
  items: { name: string; value: number; color?: string }[]
  size?: number
}) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899']
  let cumulative = 0

  if (items.every((i) => i.value === 0)) {
    return (
      <div className="text-center text-xs text-slate-400 py-6">
        Make decisions to build your skill chart
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg width={size} height={size} viewBox="0 0 32 32" className="shrink-0 -rotate-90">
        {items.map((item, i) => {
          const pct = item.value / total
          const dash = `${pct * 100} ${100 - pct * 100}`
          const offset = cumulative * 100
          cumulative += pct
          return (
            <circle
              key={item.name}
              r="16"
              cx="16"
              cy="16"
              fill="transparent"
              stroke={item.color ?? colors[i % colors.length]}
              strokeWidth="32"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
        })}
        <circle r="10" cx="16" cy="16" fill="white" />
      </svg>
      <ul className="text-xs space-y-1.5 flex-1 min-w-0">
        {items.map((item, i) => (
          <li key={item.name} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color ?? colors[i % colors.length] }}
            />
            <span className="text-slate-600 truncate flex-1">{item.name}</span>
            <span className="font-semibold text-slate-800">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
