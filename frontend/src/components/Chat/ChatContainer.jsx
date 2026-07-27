import React, { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import MessageBubble from './MessageBubble'
import CitationMatrix from './CitationMatrix'

export default function ChatContainer() {
  const { 
    activeProject, 
    messages, 
    documents = [],
    queryRAG, 
    isQuerying, 
    clearChat 
  } = useProjectStore()

  const [inputVal, setInputVal] = useState('')
  const [selectedMessageId, setSelectedMessageId] = useState(null)
  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isQuerying])

  if (!activeProject) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <h3 className="text-lg font-bold text-gray-400 mb-2">No Active Project Selected</h3>
        <p className="text-sm text-gray-500 max-w-sm">Please create or select a project from the sidebar to start RAG conversation.</p>
      </div>
    )
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
  const activeMatches = activeAssistantMsg ? activeAssistantMsg.matches : []

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden lg:grid lg:grid-cols-3">
      {/* Left Chat Column */}
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden border-r border-zinc-800">
        {/* Header */}
        <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/40">
          <div>
            <h2 className="text-xs font-semibold text-zinc-200 truncate max-w-[200px] md:max-w-md">
              {activeProject.name}
            </h2>
            <p className="text-[9px] text-zinc-500 font-medium">Retrieval Engine Workspace</p>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="text-xs text-zinc-400 hover:text-red-400 font-semibold px-2 py-1 rounded hover:bg-zinc-900 transition flex items-center space-x-1"
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
            <div className="h-full flex flex-col justify-start p-2 space-y-5 max-w-2xl mx-auto my-auto">
              {/* Workspace Status Card */}
              <div className="glass-panel border border-zinc-800 rounded p-4 space-y-3.5 bg-zinc-950/20">
                <div className="flex items-center space-x-2">
                  <div className="h-4.5 w-4.5 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-mono text-[9px] font-bold">i</div>
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Workspace Diagnostic Summary</h3>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div className="bg-[#161618] border border-zinc-800 p-2.5 rounded text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Documents</p>
                    <p className="text-lg font-mono font-semibold text-zinc-300 mt-0.5">{documents.length}</p>
                  </div>
                  <div className="bg-[#161618] border border-zinc-800 p-2.5 rounded text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Index Status</p>
                    <p className="text-lg font-mono font-semibold text-emerald-400 mt-0.5">READY</p>
                  </div>
                  <div className="bg-[#161618] border border-zinc-800 p-2.5 rounded text-center">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Total Chunks</p>
                    <p className="text-lg font-mono font-semibold text-zinc-300 mt-0.5">
                      {documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0)}
                    </p>
                  </div>
                </div>

                <div className="text-xs text-zinc-400 space-y-1.5 pt-1.5 border-t border-zinc-800/60">
                  <p className="font-medium text-zinc-300">Indexed Document Catalog:</p>
                  {documents.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic">No files uploaded. Go to Document Vault to ingest PDFs.</p>
                  ) : (
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {documents.map(d => (
                        <div key={d.id} className="flex justify-between items-center text-[10px] bg-[#161618]/50 border border-zinc-850 px-2 py-1 rounded font-mono">
                          <span className="text-zinc-400 truncate max-w-[280px]">{d.filename}</span>
                          <span className="text-zinc-500 shrink-0">{(d.chunkCount || 0)} chunks</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Orchestrator Escalation Query Templates */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Escalation Route Templates</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button 
                    onClick={() => handleSuggestionClick('Verify deployment.yaml replicas config')}
                    className="bg-[#161618] text-left p-3 rounded border border-zinc-800 hover:border-zinc-700 transition duration-150 text-xs space-y-0.5 group"
                  >
                    <span className="font-mono text-zinc-300 group-hover:text-zinc-150">Verify deployment.yaml replicas config</span>
                    <p className="text-[10px] text-emerald-500 font-mono">➔ Route: Direct Match (Green)</p>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Optimize gateway rate limits rules')}
                    className="bg-[#161618] text-left p-3 rounded border border-zinc-800 hover:border-zinc-700 transition duration-150 text-xs space-y-0.5 group"
                  >
                    <span className="font-mono text-zinc-300 group-hover:text-zinc-150">Optimize gateway rate limits rules</span>
                    <p className="text-[10px] text-amber-500 font-mono">➔ Route: Query Rewrite (Yellow)</p>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('Rerank CORS configuration in WebConfig')}
                    className="bg-[#161618] text-left p-3 rounded border border-zinc-800 hover:border-zinc-700 transition duration-150 text-xs space-y-0.5 group"
                  >
                    <span className="font-mono text-zinc-300 group-hover:text-zinc-150">Rerank CORS configuration in WebConfig</span>
                    <p className="text-[10px] text-orange-500 font-mono">➔ Route: Cross-Encoder Rerank (Orange)</p>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick('What is the meaning of life')}
                    className="bg-[#161618] text-left p-3 rounded border border-zinc-800 hover:border-zinc-700 transition duration-150 text-xs space-y-0.5 group"
                  >
                    <span className="font-mono text-zinc-300 group-hover:text-zinc-150">What is the meaning of life</span>
                    <p className="text-[10px] text-red-500 font-mono">➔ Route: Clarify Question (Red)</p>
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
                  onSelect={() => setSelectedMessageId(msg.id)}
                />
              ))}
              
              {isQuerying && (
                <div className="flex flex-col space-y-1.5 mr-auto">
                  <div className="flex items-center space-x-2">
                    <div className="h-5 w-5 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-300">
                      AI
                    </div>
                    <span className="text-[11px] font-medium text-zinc-500">Thinking...</span>
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

        {/* Input Bar */}
        <div className="p-3 border-t border-zinc-800 bg-[#09090b]">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a technical question..."
              className="w-full bg-[#161618] border border-zinc-800 rounded pl-3 pr-10 py-2.5 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-zinc-700 transition"
              disabled={isQuerying}
            />
            <button 
              type="submit"
              disabled={!inputVal.trim() || isQuerying}
              className={`absolute right-2 p-1.5 rounded transition ${inputVal.trim() && !isQuerying ? 'text-blue-500 hover:text-blue-400' : 'text-zinc-650 bg-transparent'}`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Right Citations Panel */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-1 h-full overflow-hidden p-5 bg-[#0c0c0e]">
        {messages.length === 0 ? (
          <div className="space-y-4 font-sans h-full flex flex-col justify-start">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Diagnostic Workspace Engine Settings
            </h3>
            
            <div className="bg-[#161618] border border-zinc-800 rounded p-4 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-medium">Retrieval Mode</span>
                  <span className="text-zinc-300 font-mono text-[11px]">Hybrid (Vector + BM25)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-medium">Dense Embedder</span>
                  <span className="text-zinc-300 font-mono text-[11px]">all-MiniLM-L6-v2</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-medium">Vector Dimension</span>
                  <span className="text-zinc-300 font-mono text-[11px]">384 (pgvector)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-medium">Reranker Model</span>
                  <span className="text-zinc-300 font-mono text-[11px]">FlashRank (ms-marco-Tiny)</span>
                </div>
                <div className="flex justify-between border-b border-zinc-850 pb-2">
                  <span className="text-zinc-500 font-medium">Confidence Engine</span>
                  <span className="text-zinc-300 font-mono text-[11px]">Agreement Matrix Scoring</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500 font-medium">Database State</span>
                  <span className="text-emerald-500 font-mono text-[11px]">CONNECTED</span>
                </div>
              </div>
            </div>

            <div className="mt-auto border border-zinc-800 bg-[#161618]/30 rounded p-3 text-[11px] text-zinc-500 leading-relaxed font-mono">
              <p>Ready to index and retrieve technical information. Ingest PDF manuals under the "Document Vault" navigation tab.</p>
            </div>
          </div>
        ) : (
          <CitationMatrix matches={activeMatches} />
        )}
      </div>
    </div>
  )
}
