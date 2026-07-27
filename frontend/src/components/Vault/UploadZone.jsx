import React, { useState, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'

export default function UploadZone() {
  const { uploadDocument, isUploading } = useProjectStore()
  const [isDragActive, setIsDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        uploadDocument(file)
      } else {
        alert('Please upload a PDF file.')
      }
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        uploadDocument(file)
      } else {
        alert('Please upload a PDF file.')
      }
    }
  }

  return (
    <div 
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`glass-panel border-2 border-dashed rounded p-6 text-center cursor-pointer transition duration-150 flex flex-col items-center justify-center min-h-[180px] ${isDragActive ? 'border-zinc-500 bg-zinc-900/40' : 'border-zinc-850 bg-zinc-950/20 hover:border-zinc-700 hover:bg-zinc-900/10'}`}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="h-9 w-9 rounded border border-zinc-800 bg-[#161618] flex items-center justify-center text-zinc-450 mb-3">
        <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-xs font-semibold text-zinc-300 mb-1">
        {isUploading ? 'Uploading Document...' : 'Drag & Drop PDF Document'}
      </h3>
      <p className="text-[11px] text-zinc-500 max-w-[280px]">
        {isUploading ? 'Sending file to the AI ingestion engine.' : 'Click anywhere to browse. Only PDF manuals are supported.'}
      </p>
    </div>
  )
}
