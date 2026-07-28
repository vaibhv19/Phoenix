import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../store/useProjectStore'

export default function UploadZone() {
  const { uploadDocument, isUploading } = useProjectStore()
  const [isDragActive, setIsDragActive] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  // Auto-clear validation errors after 4 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (isUploading) return

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const validateAndUpload = (file) => {
    setError(null)
    if (isUploading) {
      setError("An upload is already in progress.")
      return
    }
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError("Invalid file type. Only PDF documents are supported.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the maximum size limit of 10MB.")
      return
    }
    uploadDocument(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
    if (isUploading) return

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (isUploading) return
    if (e.target.files && e.target.files[0]) {
      validateAndUpload(e.target.files[0])
    }
  }

  return (
    <div className="w-full">
      <div 
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) fileInputRef.current?.click()
        }}
        className={`glass-panel border-2 border-dashed rounded p-6 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center min-h-[180px] outline-none focus:border-zinc-500 ${isUploading ? 'opacity-70 cursor-not-allowed border-zinc-800 bg-zinc-950/10' : isDragActive ? 'border-zinc-500 bg-zinc-900/40' : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/10'}`}
        tabIndex={isUploading ? -1 : 0}
        aria-label="Upload zone for technical manuals"
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          accept=".pdf"
          disabled={isUploading}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="h-9 w-9 rounded border border-zinc-800 bg-[#161618] flex items-center justify-center text-zinc-450 mb-3">
          {isUploading ? (
            <svg className="animate-spin h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        <h3 className="text-xs font-semibold text-zinc-300 mb-1">
          {isUploading ? 'Uploading Manual...' : 'Drag & Drop PDF Document'}
        </h3>
        <p className="text-[11px] text-zinc-500 max-w-[280px]">
          {isUploading ? 'Transferring file to secure storage workspace.' : 'Click anywhere to browse. Only PDF manuals are supported (Max 10MB).'}
        </p>
      </div>

      {error && (
        <div className="mt-3 text-[10px] text-red-400 bg-red-950/25 border border-red-900/30 px-3 py-2 rounded flex items-center space-x-1.5 animate-slide-in">
          <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
