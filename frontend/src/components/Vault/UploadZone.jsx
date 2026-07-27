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
      className={`glass-panel border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center min-h-[220px] ${isDragActive ? 'border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/5Scale' : 'border-gray-800 hover:border-gray-700 hover:bg-gray-800/10'}`}
    >
      <input 
        ref={fileInputRef}
        type="file" 
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>

      <h3 className="text-sm font-bold text-gray-200 mb-1">
        {isUploading ? 'Uploading Document...' : 'Drag & Drop PDF Document'}
      </h3>
      <p className="text-xs text-gray-400 max-w-[280px]">
        {isUploading ? 'Sending file to the AI ingestion engine.' : 'Click anywhere to browse. Only PDF manuals are supported.'}
      </p>
    </div>
  )
}
