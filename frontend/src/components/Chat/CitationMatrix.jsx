import React from 'react'

export default function CitationMatrix({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="glass-panel p-4 rounded border border-zinc-800 text-center">
        <p className="text-xs text-zinc-500">No citation references available for this message.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
        Source Citations Matrix
      </h3>
      
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {matches.map((match) => {
          const sourceName = match.chunk_metadata?.source || match.metadata?.source || 'document.pdf'
          const pageNum = match.chunk_metadata?.page || match.metadata?.page || 1
          const score = match.score || 0.0

          return (
            <div 
              key={match.id}
              id={`citation-card-${match.id}`}
              className="glass-panel p-3 rounded border border-zinc-800 hover:border-zinc-700 transition duration-150 relative overflow-hidden group"
            >
              {/* Relevance Score Tag */}
              <div className="absolute top-2.5 right-3 flex items-center space-x-1 font-mono text-[9px] text-zinc-500">
                <span>Rel:</span>
                <span className="font-bold text-zinc-300">{(score * 100).toFixed(0)}%</span>
              </div>

              {/* Header */}
              <div className="flex items-center space-x-2 mb-2 pr-12">
                <svg className="h-3.5 w-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-semibold text-zinc-200 truncate">{sourceName}</span>
                <span className="text-[9px] bg-zinc-800 text-zinc-350 border border-zinc-700 px-1 py-0.5 rounded font-mono shrink-0">
                  p. {pageNum}
                </span>
              </div>

              {/* Content block */}
              <div className="text-xs text-zinc-300 bg-zinc-950/60 border border-zinc-850 p-2 rounded font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                {match.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
