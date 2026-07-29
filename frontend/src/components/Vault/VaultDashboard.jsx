import React, { useState, useEffect } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import UploadZone from './UploadZone'
import EmptyWorkspace from '../Shared/EmptyWorkspace'

export default function VaultDashboard() {
  const { activeProject, documents, deleteDocument, fetchDocuments, isDeletingDoc, isLoadingDocs, activeDocument, setActiveDocument } = useProjectStore()
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
    return <EmptyWorkspace />
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
    if (doc.status === 'READY') return 'Ready'
    if (doc.status === 'FAILED') return 'Failed'
    if (doc.status !== 'PROCESSING') return doc.status
    const ageMs = Date.now() - new Date(doc.createdAt).getTime()
    if (ageMs < 3000) return 'Uploading'
    if (ageMs < 6000) return 'Parsing'
    if (ageMs < 9000) return 'Extracting text'
    if (ageMs < 12000) return 'Chunking'
    if (ageMs < 15000) return 'Embedding'
    return 'Indexing'
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 space-y-6 bg-[#09090b]">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-3.5 select-none">
        <h2 className="text-sm font-semibold text-zinc-200">
          Document Vault
        </h2>
        <p className="text-[11px] text-zinc-500 mt-1 leading-relaxed font-sans">
          Ingest technical PDF manuals, specifications, and layout catalogs into the workspace search index.
        </p>
      </div>

      {/* Upload Zone */}
      <UploadZone />

      {/* Documents List / Pipeline Status Table */}
      <div className="space-y-3.5">
        <div className="flex justify-between items-center select-none">
          <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">
            Ingested Documents ({documents.length})
          </h3>
          <button 
            onClick={() => fetchDocuments(activeProject.id)}
            className="text-[10px] font-semibold text-zinc-450 hover:text-zinc-200 flex items-center space-x-1 transition duration-150"
            title="Refresh document status"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {isLoadingDocs ? (
          <div className="overflow-hidden border border-zinc-900 rounded-lg bg-zinc-950/10 animate-pulse select-none">
            <div className="bg-[#070708]/30 px-4 py-2.5 flex justify-between border-b border-zinc-900">
              <div className="h-3.5 w-24 bg-zinc-800 rounded opacity-60"></div>
              <div className="h-3.5 w-16 bg-zinc-800 rounded opacity-60"></div>
              <div className="h-3.5 w-12 bg-zinc-800 rounded opacity-60"></div>
            </div>
            <div className="divide-y divide-zinc-950/40 px-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="py-3 flex justify-between items-center">
                  <div className="h-3 w-48 bg-zinc-900 rounded opacity-50"></div>
                  <div className="h-3 w-16 bg-zinc-900 rounded opacity-50"></div>
                  <div className="h-3 w-12 bg-zinc-900 rounded opacity-50"></div>
                </div>
              ))}
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center rounded-lg bg-zinc-950/10 border border-dashed border-zinc-900 select-none">
            <svg className="h-6 w-6 text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-xs font-semibold text-zinc-400">No specifications ingested</h4>
            <p className="text-[11px] text-zinc-555 max-w-xs mx-auto mt-1 leading-relaxed">
              Upload system manuals, API specs, or deployment configs (PDF) above to compile your workspace retrieval engine.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden border border-zinc-900 rounded-lg bg-zinc-950/10">
            <table className="min-w-full divide-y divide-zinc-950/60 text-left">
              <thead className="bg-[#070708]/30 text-[9px] font-bold text-zinc-555 uppercase tracking-widest select-none">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Document File</th>
                  <th scope="col" className="px-4 py-2.5">Uploaded</th>
                  <th scope="col" className="px-4 py-2.5">Chunks</th>
                  <th scope="col" className="px-4 py-2.5">Pipeline Stage</th>
                  <th scope="col" className="px-4 py-2.5">Context Scope</th>
                  <th scope="col" className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-950/40 text-xs text-zinc-300">
                {documents.map((doc) => {
                  const stage = getIngestionStage(doc)
                  return (
                    <tr key={doc.id} className="hover:bg-zinc-900/10 transition duration-150">
                      {/* File Name */}
                      <td className="px-4 py-3 truncate max-w-xs font-medium text-zinc-200">
                        <div className="flex items-center space-x-2.5">
                          <svg className="h-3.5 w-3.5 text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate" title={doc.filename}>{doc.filename}</span>
                        </div>
                      </td>

                      {/* Upload Time */}
                      <td className="px-4 py-3 text-zinc-500 font-mono text-[11px] whitespace-nowrap">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </td>

                      {/* Chunk Count */}
                      <td className="px-4 py-3 font-mono text-zinc-400 text-[11px]">
                        {doc.status === 'READY' ? `${doc.chunkCount} chunks` : '—'}
                      </td>

                      {/* Status Pipeline Stage */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {doc.status === 'READY' && (
                          <span className="inline-flex items-center space-x-1.5 text-emerald-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            <span className="font-mono text-[10px] font-bold tracking-wide uppercase select-none">Ready</span>
                          </span>
                        )}
                        {doc.status === 'FAILED' && (
                          <span className="inline-flex items-center space-x-1.5 text-red-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                            <span className="font-mono text-[10px] font-bold tracking-wide uppercase select-none">Failed</span>
                          </span>
                        )}
                        {doc.status === 'PROCESSING' && (
                          <span className="inline-flex items-center space-x-1.5 text-amber-500 font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            <span className="font-mono text-[10px] font-bold tracking-wide uppercase select-none">
                              {stage}...
                            </span>
                          </span>
                        )}
                      </td>

                      {/* Context Scope (Active Selection) */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {doc.status === 'READY' ? (
                          <button
                            onClick={() => setActiveDocument(activeDocument?.id === doc.id ? null : doc)}
                            className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border transition duration-150 ${
                              activeDocument?.id === doc.id
                                ? 'bg-emerald-955/20 text-emerald-500 border-emerald-900/30'
                                : 'bg-zinc-950/20 text-zinc-500 border-zinc-900 hover:border-zinc-800 hover:text-zinc-300'
                            }`}
                          >
                            {activeDocument?.id === doc.id ? 'Active' : 'Set Active'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-mono">Not Available</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleDeleteClick(doc)}
                          className="p-1 rounded hover:bg-red-950/20 hover:border-red-900/40 text-zinc-500 hover:text-red-400 transition"
                          title="Delete specification file"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Document Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg w-full max-w-sm p-5 shadow-2xl">
            <div className="flex items-center space-x-2.5 text-red-500 mb-3.5 select-none">
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
              <p className="text-red-400/90 font-medium bg-red-955/10 border border-red-900/30 p-2 rounded">
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
            <div className="h-7 w-7 rounded bg-green-955/10 border border-green-800/60 flex items-center justify-center text-green-400 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="h-7 w-7 rounded bg-red-955/10 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
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
