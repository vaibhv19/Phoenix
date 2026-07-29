import React, { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import MessageBubble from './MessageBubble'
import CitationMatrix from './CitationMatrix'
import ReasoningTimeline from './ReasoningTimeline'
import EmptyWorkspace from '../Shared/EmptyWorkspace'

export default function ChatContainer() {
  const { 
    activeProject, 
    messages, 
    documents = [],
    queryRAG, 
    isQuerying, 
    clearChat,
    isLoadingDocs
  } = useProjectStore()

  const [inputVal, setInputVal] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isQuerying])

  if (!activeProject) {
    return <EmptyWorkspace />
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!inputVal.trim() || isQuerying) return
    queryRAG(inputVal.trim())
    setInputVal('')
  }

  const handleSuggestionClick = (query) => {
    if (isQuerying) return
    queryRAG(query)
  }

  const getActiveMessage = () => {
    if (selectedMessageId) {
      const msg = messages.find(m => m.id === selectedMessageId)
      if (msg && msg.sender === 'assistant') return msg
    }
    const assistantMsgs = messages.filter(m => m.sender === 'assistant')
    return assistantMsgs[assistantMsgs.length - 1] || null
  }

  const activeAssistantMsg = getActiveMessage()

  const renderInputForm = (isCentered = false) => {
    return (
      <form onSubmit={handleSend} className="relative flex items-center w-full">
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder={documents.length === 0 ? "Ingest specifications in the Document Vault to begin investigation..." : "Search index or ask an engineering question..."}
          className={`w-full bg-[#121214] border border-zinc-800 focus:border-zinc-705 rounded-md pl-4 pr-11 py-3 text-xs text-zinc-250 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-800/40 transition duration-155 disabled:opacity-50 disabled:cursor-not-allowed font-sans tracking-wide ${isCentered ? 'shadow-lg shadow-black/10' : ''}`}
          disabled={isQuerying || documents.length === 0}
          aria-label="RAG query input field"
        />
        <button 
          type="submit"
          disabled={!inputVal.trim() || isQuerying || documents.length === 0}
          className={`absolute right-2.5 p-1.5 rounded-md transition duration-150 ${inputVal.trim() && !isQuerying && documents.length > 0 ? 'text-zinc-150 hover:text-white hover:bg-zinc-900/60' : 'text-zinc-655 bg-transparent cursor-not-allowed'}`}
          aria-label="Submit query"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </form>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden lg:grid lg:grid-cols-3">
      {/* Left Chat Column */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden border-r border-zinc-900">
        
        {/* Header */}
        <div className="px-4.5 py-3 border-b border-zinc-900 flex justify-between items-center bg-[#070708]/40 select-none">
          <div className="flex items-center space-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" title="Engine Connected"></span>
            <h2 className="text-xs font-semibold text-zinc-200 truncate font-mono">
              {activeProject.name}
            </h2>
            <span className="text-[10px] text-zinc-650 font-mono">/</span>
            <span className="text-[10px] text-zinc-500 font-mono">
              {documents.length} spec{documents.length !== 1 ? 's' : ''}
            </span>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="text-[10px] text-zinc-455 hover:text-red-400 font-semibold px-2 py-1 rounded hover:bg-zinc-900/40 transition flex items-center space-x-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Console</span>
            </button>
          )}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="pt-16 max-w-2xl mx-auto space-y-6 select-none">
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-zinc-300 font-sans">Retrieval Console</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-sans">
                  Index, trace, and inspect software systems documentation. Query specs to retrieve evidence and synthesize diagnostic answers.
                </p>
              </div>

              {/* Main Query Input (Inline for Empty State) */}
              <div className="pt-1.5">
                {renderInputForm(true)}
              </div>

              {/* Suggested Investigations (Operational query triggers) */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Suggested Traces</h4>
                <div className="flex flex-col space-y-1.5">
                  <button 
                    onClick={() => handleSuggestionClick('Verify deployment.yaml replicas config')}
                    className="w-full text-left py-2 px-3 rounded bg-zinc-950/20 border border-zinc-900/60 hover:border-zinc-800/80 hover:bg-zinc-900/10 transition duration-150 text-[11px] font-mono text-zinc-450 hover:text-zinc-200 flex justify-between items-center group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-zinc-650 font-mono select-none">&gt;</span>
                      <span className="truncate">Verify replica configuration in deployment.yaml</span>
                    </div>
                    <span className="text-[9px] text-zinc-650 font-sans opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">Run Query ➔</span>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Optimize gateway rate limits rules')}
                    className="w-full text-left py-2 px-3 rounded bg-zinc-950/20 border border-zinc-900/60 hover:border-zinc-800/80 hover:bg-zinc-900/10 transition duration-150 text-[11px] font-mono text-zinc-450 hover:text-zinc-200 flex justify-between items-center group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-zinc-650 font-mono select-none">&gt;</span>
                      <span className="truncate">Optimize gateway rate limits rules</span>
                    </div>
                    <span className="text-[9px] text-zinc-655 font-sans opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">Run Query ➔</span>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Rerank CORS configuration in WebConfig')}
                    className="w-full text-left py-2 px-3 rounded bg-zinc-950/20 border border-zinc-900/60 hover:border-zinc-800/80 hover:bg-zinc-900/10 transition duration-150 text-[11px] font-mono text-zinc-450 hover:text-zinc-200 flex justify-between items-center group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-zinc-650 font-mono select-none">&gt;</span>
                      <span className="truncate">Trace CORS configurations in WebConfig.java</span>
                    </div>
                    <span className="text-[9px] text-zinc-650 font-sans opacity-0 group-hover:opacity-100 transition duration-150 shrink-0">Run Query ➔</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-5">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg}
                  isActive={activeAssistantMsg?.id === msg.id}
                  onSelect={() => {
                    if (msg.sender === 'assistant') {
                      setSelectedMessageId(msg.id)
                    }
                  }}
                />
              ))}
              
              {isQuerying && (
                <div className="flex flex-col space-y-1.5 mr-auto">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">
                      AI
                    </div>
                    <span className="text-[11px] font-medium text-zinc-500 font-sans">Thinking...</span>
                  </div>
                  <div className="flex space-x-1 p-2 bg-[#161618] rounded border border-zinc-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar (Only visible when message history is present) */}
        {messages.length > 0 && (
          <div className="p-4 border-t border-zinc-900 bg-[#09090b]/80">
            <div className="max-w-2xl mx-auto w-full">
              {renderInputForm(false)}
            </div>
          </div>
        )}
      </div>

      {/* Right Citations / Diagnostics Inspector Panel */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-1 h-full overflow-hidden p-5 bg-[#0c0c0e]">
        {messages.length === 0 ? (
          <div className="space-y-6 font-sans h-full flex flex-col justify-start select-none">
            
            {/* Workspace Context Section */}
            <div className="space-y-3">
              <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">
                Workspace
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-zinc-900/40">
                  <span className="text-zinc-500 font-sans">Specifications Indexed</span>
                  <span className="text-zinc-300 font-mono font-semibold">
                    {isLoadingDocs ? '...' : `${documents.length} Files`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-zinc-900/40">
                  <span className="text-zinc-500 font-sans">Index Status</span>
                  <span className={`font-mono font-bold text-[9px] px-1.5 py-0.5 rounded border ${
                    isLoadingDocs 
                      ? 'bg-zinc-950/20 text-zinc-500 border-zinc-900/10 animate-pulse'
                      : 'bg-emerald-950/20 text-emerald-500 border-emerald-900/10'
                  }`}>
                    {isLoadingDocs ? 'LOADING' : 'READY'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs py-0.5 border-b border-zinc-905/20">
                  <span className="text-zinc-500 font-sans">Total Text Chunks</span>
                  <span className="text-zinc-300 font-mono">
                    {isLoadingDocs ? '...' : `${documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0)} Chunks`}
                  </span>
                </div>
              </div>
              
              {/* Simple Document List */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-bold text-[#45454b] uppercase tracking-widest block">Indexed Catalog</span>
                {isLoadingDocs ? (
                  <div className="space-y-1.5 py-1 select-none animate-pulse">
                    <div className="h-2.5 w-28 bg-zinc-900 rounded opacity-60"></div>
                    <div className="h-2.5 w-20 bg-zinc-900 rounded opacity-60"></div>
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-[10px] text-zinc-555 italic leading-relaxed font-sans">No specifications uploaded. Go to Document Vault to ingest specs.</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {documents.map(d => (
                      <div key={d.id} className="flex justify-between items-center text-[10px] font-mono text-zinc-455 py-0.5 border-b border-zinc-955/40">
                        <span className="truncate max-w-[180px]">{d.filename}</span>
                        <span className="text-zinc-650 shrink-0">{d.chunkCount || 0} chunks</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Engine Settings Section */}
            <div className="space-y-3 pt-2">
              <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">
                Engine
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-950/20 pb-1.5">
                  <span className="text-zinc-500 font-sans">Retrieval Mode</span>
                  <span className="text-zinc-300 font-mono text-[10px]">Hybrid (Vector + BM25)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-950/20 pb-1.5">
                  <span className="text-zinc-500 font-sans">Embedder</span>
                  <span className="text-zinc-300 font-mono text-[10px]">all-MiniLM-L6-v2</span>
                </div>
                <div className="flex justify-between border-b border-zinc-950/20 pb-1.5">
                  <span className="text-zinc-500 font-sans">Vector Dimensions</span>
                  <span className="text-zinc-300 font-mono text-[10px]">384 (pgvector)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-950/20 pb-1.5">
                  <span className="text-zinc-500 font-sans">Reranker</span>
                  <span className="text-zinc-300 font-mono text-[10px]">FlashRank (Tiny)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-sans">Database State</span>
                  <span className="text-emerald-500 font-mono text-[10px] font-bold">CONNECTED</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col h-full overflow-hidden space-y-6">
            
            {/* Title */}
            <div className="space-y-1 mb-2 select-none">
              <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">
                Investigation Inspector
              </h3>
              <p className="text-[10px] text-zinc-550 truncate max-w-full">
                Response details and execution trace.
              </p>
            </div>

            {/* Diagnosis & Confidence Metrics */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 select-none">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest block">Confidence</span>
                <span className="text-lg font-mono font-bold text-zinc-200">
                  {activeAssistantMsg ? `${(activeAssistantMsg.confidenceScore * 100).toFixed(0)}%` : '—'}
                </span>
              </div>
              {activeAssistantMsg && (
                <div className="text-right">
                  <span className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest block">Diagnosis</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border border-zinc-900/10 ${
                    activeAssistantMsg.confidenceScore >= 0.75 ? 'bg-emerald-955/20 text-emerald-500' :
                    activeAssistantMsg.confidenceScore >= 0.5 ? 'bg-amber-955/20 text-amber-500' :
                    activeAssistantMsg.confidenceScore >= 0.35 ? 'bg-orange-955/20 text-orange-500' :
                    'bg-red-955/20 text-red-500'
                  }`}>
                    {activeAssistantMsg.confidenceScore >= 0.75 ? 'Direct Match' :
                     activeAssistantMsg.confidenceScore >= 0.5 ? 'Query Rewrite' :
                     activeAssistantMsg.confidenceScore >= 0.35 ? 'Cross Rerank' :
                     'Clarification'}
                  </span>
                </div>
              )}
            </div>

            {/* Reasoning Timeline (collapsible or scrollable container) */}
            {activeAssistantMsg?.reasoningTrace && activeAssistantMsg.reasoningTrace.length > 0 && (
              <div className="space-y-3 pb-4 border-b border-[#141416] overflow-y-auto max-h-[220px] shrink-0">
                <h4 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest select-none">
                  Execution Trace
                </h4>
                <ReasoningTimeline steps={activeAssistantMsg.reasoningTrace} />
              </div>
            )}

            {/* Evidence (Source Citations Matrix) */}
            <div className="flex-1 flex flex-col overflow-hidden min-h-0">
              <h4 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest mb-3 select-none">
                Retrieved Evidence
              </h4>
              <div className="flex-1 overflow-y-auto pr-1">
                <CitationMatrix matches={activeAssistantMsg ? activeAssistantMsg.matches : []} />
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
