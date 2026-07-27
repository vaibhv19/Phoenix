import React from 'react'

export default function CitationMatrix({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <div className="glass-panel p-6 rounded-xl border border-gray-800 text-center">
        <p className="text-xs text-gray-500">No citation references available for this message.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Source Citations Matrix
      </h3>
      
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {matches.map((match) => {
          const sourceName = match.chunk_metadata?.source || match.metadata?.source || 'document.pdf'
          const pageNum = match.chunk_metadata?.page || match.metadata?.page || 1
          const score = match.score || 0.0

          return (
            <div 
              key={match.id}
              id={`citation-card-${match.id}`}
              className="glass-panel p-4 rounded-xl border border-gray-800 hover:border-gray-700 transition duration-300 relative overflow-hidden group"
            >
              {/* Relevance Score Tag */}
              <div className="absolute top-3 right-3 flex items-center space-x-1 font-mono text-[9px] text-gray-500">
                <span>Rel:</span>
                <span className="font-bold text-gray-300">{(score * 100).toFixed(0)}%</span>
              </div>

              {/* Header */}
              <div className="flex items-center space-x-2 mb-2 pr-12">
                <svg className="h-4 w-4 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-xs font-bold text-gray-200 truncate">{sourceName}</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-medium shrink-0">
                  p. {pageNum}
                </span>
              </div>

              {/* Content block */}
              <div className="text-xs text-gray-400 bg-gray-900/40 border border-gray-850 p-2.5 rounded-lg font-mono whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
                {match.content}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
