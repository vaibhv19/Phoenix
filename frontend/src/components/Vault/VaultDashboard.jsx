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
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Document Vault
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Project: <span className="text-blue-400 font-semibold">{activeProject.name}</span> &bull; Manage manual PDFs and check parser statuses.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone />

      {/* Documents List */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Ingested Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center border border-gray-800">
            <svg className="h-10 w-10 text-gray-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm font-semibold text-gray-400">Vault is Empty</p>
            <p className="text-xs text-gray-500 max-w-[280px] mx-auto mt-1">Upload technical manuals above to enable AI-powered hybrid search.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {documents.map((doc) => (
              <div 
                key={doc.id}
                className="glass-panel p-4 rounded-xl border border-gray-800 flex items-center justify-between hover:border-gray-700 transition"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="h-9 w-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 shrink-0">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="truncate">
                    <h4 className="text-sm font-medium text-gray-200 truncate">{doc.filename}</h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  {doc.status === 'PROCESSING' && (
                    <span className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span>Processing</span>
                    </span>
                  )}
                  {doc.status === 'READY' && (
                    <span className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                      <span>Ready</span>
                    </span>
                  )}
                  {doc.status === 'FAILED' && (
                    <span className="flex items-center space-x-1.5 bg-red-500/10 border border-red-500/20 text-red-400 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-400"></span>
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
