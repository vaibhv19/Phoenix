import React, { useState } from 'react'
import { useAuthStore } from '../store/useAuthStore'

export default function AuthForm() {
  const { login, register, isAuthLoading, error } = useAuthStore()
  const [isLoginTab, setIsLoginTab] = useState(true)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="w-full max-w-sm z-10">
        <div className="flex flex-col items-center mb-6">
          <div className="h-9 w-9 rounded border border-zinc-700 bg-zinc-800/50 flex items-center justify-center font-bold text-sm text-zinc-300 mb-2.5">
            P
          </div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-200">
            Phoenix Platform
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Hybrid RAG Knowledge Retrieval System</p>
        </div>

        <div className="glass-panel border border-zinc-800 rounded-lg p-6 shadow-xl relative">
          <div className="flex bg-[#0c0c0e] border border-zinc-800 p-1 rounded mb-5">
            <button 
              onClick={() => {
                setIsLoginTab(true)
                setLocalError('')
              }}
              className={`flex-1 text-center py-2 rounded text-xs font-semibold tracking-wide uppercase transition duration-150 ${isLoginTab ? 'bg-[#161618] text-zinc-100 border border-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setIsLoginTab(false)
                setLocalError('')
              }}
              className={`flex-1 text-center py-2 rounded text-xs font-semibold tracking-wide uppercase transition duration-150 ${!isLoginTab ? 'bg-[#161618] text-zinc-100 border border-zinc-800 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer"
                className="w-full bg-[#161618] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 transition"
              />
            </div>

            {!isLoginTab && (
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@phoenix.io"
                  className="w-full bg-[#161618] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#161618] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-650 outline-none focus:border-zinc-700 transition"
              />
            </div>

            {(localError || error) && (
              <div className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded">
                {localError || error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded shadow transition-colors flex items-center justify-center space-x-2"
            >
              {isAuthLoading ? (
                <span>Loading Account...</span>
              ) : (
                <span>{isLoginTab ? 'Authenticate' : 'Create Account'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
