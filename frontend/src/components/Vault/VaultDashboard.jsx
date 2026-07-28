import React, { useState, useEffect } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import UploadZone from './UploadZone'

export default function VaultDashboard() {
  const { activeProject, documents, deleteDocument, fetchDocuments, isDeletingDoc } = useProjectStore()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  const [toast, setToast] = useState(null)

  // Auto-clear toast feedback
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  // Support Escape key to close the confirmation modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showConfirmDelete) {
        setShowConfirmDelete(false)
        setDocToDelete(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showConfirmDelete])

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-[#09090b]">
        <svg className="h-10 w-10 text-zinc-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-sm font-bold text-zinc-300 mb-1.5">No Active Project Selected</h3>
        <p className="text-xs text-zinc-500 max-w-xs">Please create or select a workspace project from the sidebar to access the document vault.</p>
      </div>
    )
  }

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    if (!docToDelete) return
    try {
      await deleteDocument(docToDelete.id)
      setToast({ message: `Successfully deleted document "${docToDelete.filename}"`, type: 'success' })
      setShowConfirmDelete(false)
      setDocToDelete(null)
    } catch (err) {
      setToast({ message: `Failed to delete document: ${err.message}`, type: 'error' })
    }
  }

  // Calculate detailed ingestion status stage
  const getIngestionStage = (doc) => {
    if (doc.status !== 'PROCESSING') return null
    const ageMs = Date.now() - new Date(doc.createdAt).getTime()
    if (ageMs < 4000) return 'Parsing layout...'
    if (ageMs < 8000) return 'Splitting chunks...'
    if (ageMs < 14000) return 'Generating embeddings...'
    return 'Finalizing index...'
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
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Ingested Documents ({documents.length})
          </h3>
          <button 
            onClick={() => fetchDocuments(activeProject.id)}
            className="text-[10px] font-semibold text-blue-500 hover:text-blue-400 flex items-center space-x-1 transition"
            title="Refresh document list"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="glass-panel rounded p-6 text-center border border-zinc-800 bg-zinc-950/20">
            <svg className="h-8 w-8 text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs font-semibold text-zinc-400">Vault is Empty</p>
            <p className="text-[11px] text-zinc-500 max-w-[240px] mx-auto mt-0.5">Upload technical manuals above to enable AI-powered hybrid search.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {documents.map((doc) => {
              const stage = getIngestionStage(doc)
              return (
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

                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="flex items-center space-x-2">
                      {doc.status === 'PROCESSING' && (
                        <div className="flex flex-col items-end">
                          <span className="flex items-center space-x-1 bg-amber-950/20 border border-amber-900/30 text-amber-450 px-2 py-0.5 rounded text-[9px] font-medium tracking-wide uppercase font-mono">
                            <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>Processing</span>
                          </span>
                          {stage && <span className="text-[8px] text-zinc-500 font-mono mt-0.5">{stage}</span>}
                        </div>
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

                    <button 
                      onClick={() => handleDeleteClick(doc)}
                      className="p-1.5 bg-zinc-900/40 border border-zinc-800/80 hover:bg-red-950/20 hover:border-red-900/30 rounded text-zinc-500 hover:text-red-400 transition"
                      title="Delete document"
                    >
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Delete Document Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-red-500 mb-3.5">
              <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-sm font-bold text-zinc-100">
                Delete this document?
              </h3>
            </div>
            
            <div className="space-y-3 text-xs text-zinc-400 mb-5 leading-relaxed">
              <p>
                This will permanently remove the manual <strong className="text-zinc-200">"{docToDelete?.filename}"</strong>, its parsed text chunks, and corresponding vector index embeddings.
              </p>
              <p className="text-red-400/90 font-medium bg-red-950/20 border border-red-900/30 p-2 rounded">
                ⚠ This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-2.5 justify-end">
              <button 
                type="button" 
                disabled={isDeletingDoc}
                onClick={() => {
                  setShowConfirmDelete(false)
                  setDocToDelete(null)
                }}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isDeletingDoc}
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded shadow transition flex items-center space-x-1 disabled:opacity-50"
              >
                {isDeletingDoc ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-lg border shadow-2xl animate-slide-in flex items-center space-x-3 max-w-sm backdrop-blur-md bg-[#0c0c0e]/95 border-zinc-800">
          {toast.type === 'success' ? (
            <div className="h-7 w-7 rounded bg-green-950/40 border border-green-800/60 flex items-center justify-center text-green-400 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="h-7 w-7 rounded bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <div className="flex-1 text-xs font-medium text-zinc-200 leading-tight">
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
