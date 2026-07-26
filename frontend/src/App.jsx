import React from 'react'
import { motion } from 'framer-motion'
import { useAppStore } from './store/store'

function App() {
  const { isProcessing, setProcessing } = useAppStore()

  const services = [
    { name: 'Spring Boot Backend', port: '8080', status: 'ready', desc: 'API Orchestration & Relational Storage' },
    { name: 'FastAPI AI Engine', port: '8000', status: 'ready', desc: 'Text Splitting, Embeddings & Hybrid Search' },
    { name: 'PostgreSQL Database', port: '5432', status: 'ready', desc: 'Relational Metadata & pgvector Store' },
    { name: 'React Frontend Client', port: '5173', status: 'ready', desc: 'Vite-powered Observable Chat & Vault UI' },
  ]

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col items-center justify-between p-6">
      {/* Header */}
      <header className="w-full max-w-6xl flex justify-between items-center py-4 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-blue-500/20">
            P
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              Phoenix
            </h1>
            <p className="text-xs text-gray-400">Hybrid RAG over Technical Documentation</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-semibold text-blue-400">
          <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span>Phase 01: Project Setup Active</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl my-auto grid grid-cols-1 md:grid-cols-3 gap-8 py-12">
        {/* Left Column - System Overview */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-panel p-8 rounded-2xl border border-gray-800 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Welcome to the Phoenix Monorepo
            </h2>
            <p className="text-gray-300 leading-relaxed text-sm mb-6">
              Phoenix is a state-of-the-art hybrid RAG implementation designed to demonstrate transparent retrieval confidence scoring, query rewriting, Cross-Encoder re-ranking, and clarification fallback strategies.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="glass-card p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-semibold text-blue-400 mb-1">Hybrid Retrieval</h3>
                <p className="text-xs text-gray-400">Combining semantic vector search with BM25 keyword matching for term-sensitive technical lookups.</p>
              </div>
              <div className="glass-card p-4 rounded-xl border border-gray-800">
                <h3 className="text-sm font-semibold text-blue-400 mb-1">Decoupled Architecture</h3>
                <p className="text-xs text-gray-400">Independent Spring Boot orchestration API, FastAPI AI extraction engine, and concurrent React UI.</p>
              </div>
            </div>
          </motion.div>

          {/* Grid of Microservices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {services.map((svc, index) => (
              <motion.div
                key={svc.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-panel p-5 rounded-xl border border-gray-800 flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 group"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors">
                      {svc.name}
                    </h3>
                    <span className="text-xs font-mono bg-gray-855 text-gray-300 px-2 py-0.5 rounded">
                      :{svc.port}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {svc.desc}
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-800/50">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Service Status</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-xs font-medium text-emerald-400">Ready</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Column - Architecture Details */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-panel p-6 rounded-2xl border border-gray-800 flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              RAG Lifecycle Overview
            </h3>
            <div className="space-y-4 text-xs">
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-400 before:content-['']">
                <span className="font-semibold text-gray-300 block mb-0.5">1. PDF Ingestion</span>
                <span className="text-gray-400">Spring Boot uploads physical files and delegates ingestion to FastAPI. Recursive splitters generate chunks.</span>
              </div>
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-400 before:content-['']">
                <span className="font-semibold text-gray-300 block mb-0.5">2. Vector & BM25 Indexing</span>
                <span className="text-gray-400">Embeddings populated into pgvector. Term frequencies stored in BM25 indices.</span>
              </div>
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-400 before:content-['']">
                <span className="font-semibold text-gray-300 block mb-0.5">3. Score Fusion & Confidence</span>
                <span className="text-gray-400">MinMaxScaler scales Vector & BM25 results; Weighted Linear Combination (WLC) generates confidence scores.</span>
              </div>
              <div className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-blue-400 before:content-['']">
                <span className="font-semibold text-gray-300 block mb-0.5">4. Tiered Fallbacks</span>
                <span className="text-gray-400">Query expansion/rewriting, FlashRank Cross-Encoder re-scoring, or terminal clarification response.</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-800">
            <button
              onClick={() => {
                setProcessing(!isProcessing)
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>{isProcessing ? 'Simulating Retrieval...' : 'Simulate RAG Retrieval'}</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl text-center py-4 border-t border-gray-800 text-xs text-gray-500">
        Phoenix App Stack &copy; {new Date().getFullYear()} &bull; Architecture & Code Setup Complete
      </footer>
    </div>
  )
}

export default App
