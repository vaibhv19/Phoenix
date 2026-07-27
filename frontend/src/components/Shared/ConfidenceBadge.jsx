import React from 'react'

export default function ConfidenceBadge({ score }) {
  if (score === undefined || score === null) return null

  let label = 'Ambiguous Search'
  let bgClass = 'bg-red-500/10 border-red-500/20 text-red-400'
  let indicatorColor = 'bg-red-400'

  if (score >= 0.75) {
    label = 'Verified Source'
    bgClass = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    indicatorColor = 'bg-emerald-400'
  } else if (score >= 0.50) {
    label = 'Self-Corrected Search'
    bgClass = 'bg-amber-500/10 border-amber-500/20 text-amber-400'
    indicatorColor = 'bg-amber-400'
  } else if (score >= 0.35) {
    label = 'Low Confidence / Re-ranked'
    bgClass = 'bg-orange-500/10 border-orange-500/20 text-orange-400'
    indicatorColor = 'bg-orange-400'
  }

  return (
    <span className={`inline-flex items-center space-x-1.5 border px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase font-mono ${bgClass}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${indicatorColor}`}></span>
      <span>{label} ({(score * 100).toFixed(0)}%)</span>
    </span>
  )
}
