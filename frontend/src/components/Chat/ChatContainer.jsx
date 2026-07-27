import React, { useState, useEffect, useRef } from 'react'
import { useProjectStore } from '../../store/useProjectStore'
import MessageBubble from './MessageBubble'
import CitationMatrix from './CitationMatrix'

export default function ChatContainer() {
  const { 
    activeProject, 
    messages, 
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
      <div className="lg:col-span-2 flex flex-col h-full overflow-hidden border-r border-gray-800">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#0F172A]/30">
          <div>
            <h2 className="text-sm font-bold text-gray-250 truncate max-w-[200px] md:max-w-md">
              {activeProject.name}
            </h2>
            <p className="text-[10px] text-gray-500 font-medium">Hybrid Search Conversation Console</p>
          </div>
          {messages.length > 0 && (
            <button 
              onClick={clearChat}
              className="text-xs text-gray-400 hover:text-red-400 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-gray-800/60 transition flex items-center space-x-1"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Clear Console</span>
            </button>
          )}
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto my-auto space-y-6">
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-gray-200">Start a RAG Conversation</h3>
                <p className="text-xs text-gray-400">
                  Ask a question about your project documents. The engine will retrieve context, score confidence, and route through the fallback state machine.
                </p>
              </div>

              {/* Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-2">
                <button 
                  onClick={() => handleSuggestionClick('Verify deployment.yaml replicas config')}
                  className="glass-panel text-left p-3 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-xs space-y-1 group"
                >
                  <span className="font-semibold text-blue-400 group-hover:text-blue-300">Deployment Replicas</span>
                  <p className="text-[10px] text-gray-500">Test Green verified source path.</p>
                </button>
                <button 
                  onClick={() => handleSuggestionClick('Optimize gateway rate limits rules')}
                  className="glass-panel text-left p-3 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-xs space-y-1 group"
                >
                  <span className="font-semibold text-amber-400 group-hover:text-amber-300">Gateway Limits</span>
                  <p className="text-[10px] text-gray-500">Test Yellow query rewrite path.</p>
                </button>
                <button 
                  onClick={() => handleSuggestionClick('Rerank CORS configuration in WebConfig')}
                  className="glass-panel text-left p-3 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-xs space-y-1 group"
                >
                  <span className="font-semibold text-orange-400 group-hover:text-orange-300">Web CORS Settings</span>
                  <p className="text-[10px] text-gray-500">Test Orange reranker path.</p>
                </button>
                <button 
                  onClick={() => handleSuggestionClick('What is the meaning of life')}
                  className="glass-panel text-left p-3 rounded-xl border border-gray-800 hover:border-blue-500/30 hover:bg-blue-500/5 transition text-xs space-y-1 group"
                >
                  <span className="font-semibold text-red-400 group-hover:text-red-300">Irrelevant Query</span>
                  <p className="text-[10px] text-gray-500">Test Red clarification path.</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col space-y-6">
              {messages.map((msg) => (
                <MessageBubble 
                  key={msg.id} 
                  message={msg}
                  onSelect={() => setSelectedMessageId(msg.id)}
                />
              ))}
              
              {isQuerying && (
                <div className="flex flex-col space-y-2 mr-auto">
                  <div className="flex items-center space-x-2">
                    <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
                      AI
                    </div>
                    <span className="text-xs font-semibold text-gray-400">Thinking...</span>
                  </div>
                  <div className="flex space-x-1.5 p-3.5 bg-gray-850/20 rounded-2xl border border-gray-800">
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-gray-800 bg-[#0B0F19]/40">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Ask a technical question..."
              className="w-full bg-[#1E293B] border border-gray-800 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-gray-250 placeholder-gray-500 outline-none focus:border-blue-500/50 transition"
              disabled={isQuerying}
            />
            <button 
              type="submit"
              disabled={!inputVal.trim() || isQuerying}
              className={`absolute right-2.5 p-2 rounded-xl transition ${inputVal.trim() && !isQuerying ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow shadow-blue-500/10 hover:opacity-90' : 'text-gray-500 bg-transparent'}`}
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9-2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Right Citations Panel */}
      <div className="hidden lg:flex lg:flex-col lg:col-span-1 h-full overflow-hidden p-6 bg-[#0B0F19]/40">
        <CitationMatrix matches={activeMatches} />
      </div>
    </div>
  )
}
