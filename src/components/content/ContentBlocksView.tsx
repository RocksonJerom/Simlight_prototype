import type { ContentBlock } from '../../types/simulation'

function BarChart({ chart }: { chart: NonNullable<ContentBlock['chart']> }) {
  const max = Math.max(...chart.values, 1)
  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2 h-32">
        {chart.labels.map((label, i) => {
          const value = chart.values[i] ?? 0
          const height = `${Math.round((value / max) * 100)}%`
          return (
            <div key={label} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] text-slate-500">{value}</span>
              <div
                className="w-full bg-blue-500 rounded-t"
                style={{ height }}
                title={`${label}: ${value}`}
              />
              <span className="text-[10px] text-slate-600 text-center leading-tight">{label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function LineChart({ chart }: { chart: NonNullable<ContentBlock['chart']> }) {
  const max = Math.max(...chart.values, 1)
  const points = chart.values
    .map((v, i) => {
      const x = chart.values.length === 1 ? 50 : (i / (chart.values.length - 1)) * 100
      const y = 100 - (v / max) * 80 - 10
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 100" className="w-full h-32" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-blue-500"
        points={points}
      />
      {chart.values.map((v, i) => {
        const x = chart.values.length === 1 ? 50 : (i / (chart.values.length - 1)) * 100
        const y = 100 - (v / max) * 80 - 10
        return <circle key={i} cx={x} cy={y} r="2" className="fill-blue-600" />
      })}
    </svg>
  )
}

function PieChart({ chart }: { chart: NonNullable<ContentBlock['chart']> }) {
  const total = chart.values.reduce((s, v) => s + v, 0) || 1
  let cumulative = 0
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 32 32" className="w-24 h-24 shrink-0 -rotate-90">
        {chart.values.map((value, i) => {
          const pct = value / total
          const dash = `${pct * 100} ${100 - pct * 100}`
          const offset = cumulative * 100
          cumulative += pct
          return (
            <circle
              key={i}
              r="16"
              cx="16"
              cy="16"
              fill="transparent"
              stroke={colors[i % colors.length]}
              strokeWidth="32"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
            />
          )
        })}
      </svg>
      <ul className="text-xs text-slate-600 space-y-1">
        {chart.labels.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            {label}: {chart.values[i]}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ChartBlock({ block }: { block: ContentBlock }) {
  const chart = block.chart!
  return (
    <div>
      {block.title && <p className="text-sm font-semibold text-slate-800 mb-2">{block.title}</p>}
      {chart.type === 'line' && <LineChart chart={chart} />}
      {chart.type === 'pie' && <PieChart chart={chart} />}
      {chart.type === 'bar' && <BarChart chart={chart} />}
    </div>
  )
}

function TableBlock({ block }: { block: ContentBlock }) {
  const table = block.table!
  return (
    <div className="overflow-x-auto">
      {block.title && <p className="text-sm font-semibold text-slate-800 mb-2">{block.title}</p>}
      <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-slate-100">
            {table.headers.map((h) => (
              <th key={h} className="px-3 py-2 text-left font-semibold text-slate-700 border-b border-slate-200">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-600 border-b border-slate-100">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ContentBlocksView({
  blocks,
  className = '',
}: {
  blocks?: ContentBlock[]
  className?: string
}) {
  if (!blocks?.length) return null

  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block) => (
        <div
          key={block.id}
          className="rounded-xl border border-slate-200 bg-slate-50/80 p-4"
        >
          {block.type === 'text' && (
            <div>
              {block.title && (
                <p className="text-sm font-semibold text-slate-800 mb-2">{block.title}</p>
              )}
              <div className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {block.text}
              </div>
            </div>
          )}
          {block.type === 'table' && block.table && <TableBlock block={block} />}
          {block.type === 'chart' && block.chart && <ChartBlock block={block} />}
        </div>
      ))}
    </div>
  )
}
