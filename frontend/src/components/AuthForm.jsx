import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthForm() {
  const { login, register, isAuthLoading, error } = useAuthStore()
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!username.trim() || !password.trim()) {
      setLocalError('Username and password are required.')
      return
    }
    if (!isLoginTab && !email.trim()) {
      setLocalError('Email is required for registration.')
      return
    }

    let success
    if (isLoginTab) {
      success = await login(username.trim(), password)
    } else {
      success = await register(username.trim(), email.trim(), password)
    }

    if (!success) {
      setLocalError(error || 'Authentication action failed.')
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex overflow-hidden font-sans relative">
      {/* Quiet Engineering Dot-Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.07] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#a1a1aa 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px'
        }}
      />
      <div className="absolute inset-0 bg-radial-glow pointer-events-none" />

      {/* Split-Screen: Left Info Panel (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-zinc-900 bg-zinc-950/40 relative z-10">
        {/* Top: Geometric Brand Mark */}
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded border border-zinc-800 bg-[#161618] flex items-center justify-center text-zinc-350 shrink-0 shadow-inner">
            <svg className="h-5 w-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L4 10h16L12 2z" />
              <path d="M12 22l8-8H4l8 8z" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-zinc-200 uppercase font-mono">Phoenix</span>
        </div>

        {/* Center: Storytelling / Product Explanation */}
        <div className="max-w-md space-y-6">
          <div className="space-y-3.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-150 leading-tight">
              Investigate technical documentation with absolute confidence.
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Phoenix parses and catalogs manuals, specifications, and architecture guides, tracing every query response back to its exact segment. No guesswork, no hallucinations.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="grid grid-cols-1 gap-4 pt-2">
            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">Transparent Citations</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Trace answers back to source page numbers and exact markdown paragraphs.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">Confidence-Aware Retrieval</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Similarity matrix checks prevent false assertions when search confidence is low.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">Explainable Processing Trace</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Inspect fallback query rewrites, chunk scoring matrices, and reranking logs.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="h-5 w-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-zinc-350" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-300">Project Workspace Boundaries</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Completely isolate technical logs, documents, and vectors across projects.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Footer Info */}
        <div className="text-[10px] font-mono text-zinc-500">
          SECURE TECHNICAL VAULT &bull; VERSION 1.1.0
        </div>
      </div>

      {/* Split-Screen: Right Authentication Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative z-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Mobile Header Branding (Visible on mobile only) */}
          <div className="lg:hidden flex flex-col items-center text-center space-y-3 mb-4">
            <div className="h-9 w-9 rounded border border-zinc-800 bg-[#161618] flex items-center justify-center text-zinc-350 shadow-inner">
              <svg className="h-5 w-5 text-zinc-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L4 10h16L12 2z" />
                <path d="M12 22l8-8H4l8 8z" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-200 uppercase font-mono">Phoenix</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Technical Document Investigation Workspace</p>
            </div>
          </div>

          {/* Form Header */}
          <div className="space-y-1 text-center lg:text-left">
            <h2 className="text-xl font-bold tracking-tight text-zinc-200">
              {isLoginTab ? 'Access Workspace' : 'Create Account'}
            </h2>
            <p className="text-xs text-zinc-500">
              {isLoginTab ? 'Enter your workspace credentials.' : 'Set up a new developer profile.'}
            </p>
          </div>

          {/* Authentication Form Box */}
          <div className="glass-panel border border-zinc-850 rounded-lg p-5 md:p-6 bg-zinc-950/20 shadow-2xl space-y-5">
            {/* Tabs */}
            <div className="flex bg-[#0c0c0e]/80 border border-zinc-850 p-1 rounded">
              <button 
                type="button"
                onClick={() => {
                  setIsLoginTab(true)
                  setLocalError('')
                }}
                className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition duration-150 outline-none focus:ring-1 focus:ring-zinc-700 ${isLoginTab ? 'bg-[#161618] text-zinc-250 border border-zinc-800 shadow-inner' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => {
                  setIsLoginTab(false)
                  setLocalError('')
                }}
                className={`flex-1 text-center py-1.5 rounded text-xs font-semibold transition duration-150 outline-none focus:ring-1 focus:ring-zinc-700 ${!isLoginTab ? 'bg-[#161618] text-zinc-250 border border-zinc-800 shadow-inner' : 'text-zinc-500 hover:text-zinc-350'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Email or Username
                </label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="developer"
                  className="w-full bg-[#161618] border border-zinc-850 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                  required
                />
              </div>

              {!isLoginTab && (
                <div className="animate-slide-in">
                  <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@phoenix.io"
                    className="w-full bg-[#161618] border border-zinc-850 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                    required={!isLoginTab}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161618] border border-zinc-850 rounded pl-3 pr-10 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" style={{ width: '16px', height: '16px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {(localError || error) && (
                <div className="text-[11px] text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded animate-slide-in">
                  {localError || error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isAuthLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2.5 px-4 rounded shadow transition-colors flex items-center justify-center space-x-2 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#09090b] disabled:opacity-50"
              >
                {isAuthLoading ? (
                  <>
                    <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isLoginTab ? 'Access Workspace' : 'Create Account'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
