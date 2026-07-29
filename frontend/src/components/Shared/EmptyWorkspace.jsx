import React from 'react'
import { useProjectStore } from '../../store/useProjectStore'

export default function EmptyWorkspace() {
  const { setCreateModalOpen } = useProjectStore()

  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-10 bg-[#09090b]">
      <div className="max-w-3xl w-full text-center space-y-10 transform lg:translate-x-6 xl:translate-x-8">
        
        {/* Intro Slogan / Header */}
        <div className="flex flex-col items-center">
          <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-zinc-900/50 border border-zinc-850 text-zinc-400 mb-4 shadow-inner">
            <svg className="h-4.5 w-4.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2L4 10h16L12 2z" />
              <path d="M12 22l8-8H4l8 8z" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <h2 className="text-lg md:text-xl font-medium tracking-tight text-zinc-200">
            Initialize Investigation Workspace
          </h2>
          <p className="text-xs text-zinc-450 max-w-sm mx-auto mt-2 leading-relaxed">
            Phoenix is an engineering environment built to inspect, index, and query technical system documentation.
          </p>
        </div>

        {/* Workflow Steps - 4 Column Layout for Desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5 text-left max-w-3xl mx-auto mt-8">
          
          <div className="py-5.5 px-5 rounded-lg bg-zinc-950/15 border border-zinc-900/50 hover:border-zinc-800/20 hover:bg-zinc-900/10 transition duration-150 group min-h-[150px] flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] font-bold text-zinc-550 bg-zinc-900/40 px-2 py-0.5 rounded select-none group-hover:text-zinc-350 transition duration-150">01</span>
                <span className="text-[8px] text-zinc-650 font-mono tracking-wider uppercase select-none">Setup</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-200 transition duration-155">Define Workspace</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">Create an isolated project boundary for your investigation assets.</p>
              </div>
            </div>
          </div>

          <div className="py-5.5 px-5 rounded-lg bg-zinc-950/15 border border-zinc-900/50 hover:border-zinc-800/20 hover:bg-zinc-900/10 transition duration-150 group min-h-[150px] flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] font-bold text-zinc-550 bg-zinc-900/40 px-2 py-0.5 rounded select-none group-hover:text-zinc-350 transition duration-150">02</span>
                <span className="text-[8px] text-zinc-650 font-mono tracking-wider uppercase select-none">Ingest</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-200 transition duration-155">Ingest Materials</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">Upload engineering manuals, layouts, or configs to the Document Vault.</p>
              </div>
            </div>
          </div>

          <div className="py-5.5 px-5 rounded-lg bg-zinc-950/15 border border-zinc-900/50 hover:border-zinc-800/20 hover:bg-zinc-900/10 transition duration-150 group min-h-[150px] flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] font-bold text-zinc-550 bg-zinc-900/40 px-2 py-0.5 rounded select-none group-hover:text-zinc-350 transition duration-150">03</span>
                <span className="text-[8px] text-zinc-650 font-mono tracking-wider uppercase select-none">Search</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-200 transition duration-155">Query Engine</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">Ask engineering queries and retrieve precise hybrid search responses.</p>
              </div>
            </div>
          </div>

          <div className="py-5.5 px-5 rounded-lg bg-zinc-950/15 border border-zinc-900/50 hover:border-zinc-800/20 hover:bg-zinc-900/10 transition duration-150 group min-h-[150px] flex flex-col justify-between">
            <div className="space-y-3.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] font-bold text-zinc-550 bg-zinc-900/40 px-2 py-0.5 rounded select-none group-hover:text-zinc-350 transition duration-150">04</span>
                <span className="text-[8px] text-zinc-650 font-mono tracking-wider uppercase select-none">Verify</span>
              </div>
              <div className="space-y-1">
                <h4 className="text-[11px] font-semibold text-zinc-300 group-hover:text-zinc-200 transition duration-155">Trace Sources</h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-sans">Audit findings directly via confidence matrices and citation routing.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Obvious CTA - Placed as the logical next step */}
        <div className="pt-2 mt-8 flex justify-center">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded-md transition shadow-md hover:shadow-lg active:scale-95"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Project</span>
          </button>
        </div>

      </div>
    </div>
  )
}
