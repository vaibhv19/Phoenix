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
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 h-72 w-72 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 h-80 w-80 bg-indigo-500/10 rounded-full blur-3xl"></div>

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-blue-500/20 mb-3">
            P
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Phoenix Platform
          </h1>
          <p className="text-xs text-gray-400 mt-1.5">Hybrid RAG Knowledge Retrieval System</p>
        </div>

        <div className="glass-panel border border-gray-800 rounded-3xl p-8 shadow-2xl relative">
          <div className="flex bg-[#0F172A]/80 border border-gray-850 p-1.5 rounded-xl mb-6">
            <button 
              onClick={() => {
                setIsLoginTab(true)
                setLocalError('')
              }}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition duration-200 ${isLoginTab ? 'bg-[#1E293B] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Sign In
            </button>
            <button 
              onClick={() => {
                setIsLoginTab(false)
                setLocalError('')
              }}
              className={`flex-1 text-center py-2.5 rounded-lg text-xs font-semibold tracking-wide uppercase transition duration-200 ${!isLoginTab ? 'bg-[#1E293B] text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer"
                className="w-full bg-[#1E293B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50 transition"
              />
            </div>

            {!isLoginTab && (
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@phoenix.io"
                  className="w-full bg-[#1E293B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1E293B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50 transition"
              />
            </div>

            {(localError || error) && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3.5 py-2.5 rounded-xl">
                {localError || error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isAuthLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold uppercase tracking-wider py-3.5 px-4 rounded-xl shadow-lg shadow-blue-500/10 transition-all duration-300 flex items-center justify-center space-x-2"
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
