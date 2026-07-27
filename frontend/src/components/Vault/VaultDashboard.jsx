import React from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import UploadZone from './UploadZone'

export default function VaultDashboard() {
  const { activeProject, documents } = useProjectStore()

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-lg font-bold text-gray-400 mb-2">No Active Project Selected</h3>
        <p className="text-sm text-gray-500 max-w-sm">Please create or select a project from the sidebar to access the document vault.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-5 space-y-5 bg-[#09090b]">
      {/* Header */}
      <div className="border-b border-zinc-800 pb-3">
        <h2 className="text-base font-bold text-zinc-200">
          Document Vault
        </h2>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Project: <span className="text-zinc-300 font-semibold">{activeProject.name}</span> &bull; Ingest technical PDF manuals and monitor parser status logs.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone />

      {/* Documents List */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
          Ingested Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="glass-panel rounded p-6 text-center border border-zinc-800 bg-zinc-950/20">
            <svg className="h-8 w-8 text-zinc-650 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold text-zinc-400">Vault is Empty</p>
            <p className="text-[11px] text-zinc-500 max-w-[240px] mx-auto mt-0.5">Upload technical manuals above to enable AI-powered hybrid search.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="glass-panel p-2.5 rounded border border-zinc-800 flex items-center justify-between hover:border-zinc-700 transition duration-150"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="h-7 w-7 rounded border border-zinc-800 bg-[#161618] flex items-center justify-center text-zinc-400 shrink-0">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-medium text-zinc-250 truncate">{doc.filename}</h4>
                    <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {doc.status === 'PROCESSING' && (
                    <span className="flex items-center space-x-1 bg-amber-950/20 border border-amber-900/30 text-amber-450 px-2 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase font-mono">
                      <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse"></span>
                      <span>Processing</span>
                    </span>
                  )}
                  {doc.status === 'READY' && (
                    <span className="flex items-center space-x-1 bg-emerald-950/25 border border-emerald-900/30 text-emerald-450 px-2 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase font-mono">
                      <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                      <span>Ready</span>
                    </span>
                  )}
                  {doc.status === 'FAILED' && (
                    <span className="flex items-center space-x-1 bg-red-950/20 border border-red-900/30 text-red-400 px-2 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase font-mono">
                      <span className="h-1 w-1 rounded-full bg-red-500"></span>
                      <span>Failed</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
