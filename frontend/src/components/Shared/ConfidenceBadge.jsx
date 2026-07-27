import React from 'react'

export default function ConfidenceBadge({ score }) {
  if (score === undefined || score === null) return null

  let label = 'Ambiguous Search'
  let bgClass = 'bg-red-950/20 border-red-900/30 text-red-400'
  let indicatorColor = 'bg-red-500'

  if (score >= 0.75) {
    label = 'Verified Source'
    bgClass = 'bg-emerald-950/25 border-emerald-900/30 text-emerald-400'
    indicatorColor = 'bg-emerald-500'
  } else if (score >= 0.50) {
    label = 'Self-Corrected Search'
    bgClass = 'bg-amber-950/20 border-amber-900/30 text-amber-450'
    indicatorColor = 'bg-amber-500'
  } else if (score >= 0.35) {
    label = 'Low Confidence / Re-ranked'
    bgClass = 'bg-orange-950/20 border-orange-900/30 text-orange-400'
    indicatorColor = 'bg-orange-500'
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 border px-2 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase font-mono ${bgClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${indicatorColor}`}></span>
      <span>{label} ({(score * 100).toFixed(0)}%)</span>
    </span>
  )
}
