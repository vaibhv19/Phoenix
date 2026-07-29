import React from 'react'

export default function CitationMatrix({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="p-4 rounded-lg bg-zinc-900/10 border border-zinc-900 text-center select-none">
        <p className="text-xs text-zinc-550">No citation references available for this query.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1 select-none">
      {matches.map((match) => {
        const sourceName = match.chunk_metadata?.source || match.metadata?.source || 'document.pdf'
        const pageNum = match.chunk_metadata?.page || match.metadata?.page || 1
        const score = match.score || 0.0

        return (
          <div 
            key={match.id}
            id={`citation-card-${match.id}`}
            className="p-3.5 rounded-lg bg-zinc-950/15 border border-zinc-900/80 hover:border-zinc-800/40 transition duration-150 relative overflow-hidden group"
          >
            {/* Relevance Score Tag */}
            <div className="absolute top-3.5 right-3.5 flex items-center space-x-1 font-mono text-[9px] text-zinc-500">
              <span>Relevance:</span>
              <span className="font-bold text-zinc-350">{(score * 100).toFixed(0)}%</span>
            </div>

            {/* Header */}
            <div className="flex items-center space-x-2.5 mb-2.5 pr-20">
              <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs font-semibold text-zinc-300 truncate">{sourceName}</span>
              <span className="text-[9px] bg-zinc-900 text-zinc-450 border border-zinc-800 px-1 py-0.5 rounded font-mono shrink-0 select-none">
                p. {pageNum}
              </span>
            </div>

            {/* Content block */}
            <div className="text-[11px] text-zinc-400 bg-zinc-900/10 border border-zinc-900/80 p-2.5 rounded font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
              {match.content}
            </div>
          </div>
        )
      })}
    </div>
  )
}
