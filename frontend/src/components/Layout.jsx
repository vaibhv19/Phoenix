import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'
import { useProjectStore } from '../store/useProjectStore'

export default function Layout({ children }) {
  const { user, logout } = useAuthStore()
  const { 
    projects, 
    activeProject, 
    fetchProjects, 
    createProject, 
    setActiveProject, 
    activeView, 
    setView 
  } = useProjectStore()

  const [showNewProjModal, setShowNewProjModal] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProjName.trim()) return
    await createProject(newProjName.trim())
    setNewProjName('')
    setShowNewProjModal(false)
  }

  return (
    <div className="flex h-screen bg-[#0B0F19] text-[#F8FAFC] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#0F172A] border-r border-gray-800 flex flex-col justify-between transition-all duration-300 z-30 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">
                  P
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                    Phoenix
                  </h1>
                </div>
              </div>
            ) : (
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white mx-auto shadow-lg">
                P
              </div>
            )}
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Project Switcher */}
          <div className="p-4 border-b border-gray-800">
            {isSidebarOpen ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span>Projects</span>
                  <button 
                    onClick={() => setShowNewProjModal(true)} 
                    className="text-blue-400 hover:text-blue-300 font-bold text-lg p-0.5 leading-none transition"
                  >
                    +
                  </button>
                </div>
                
                {projects.length === 0 ? (
                  <button 
                    onClick={() => setShowNewProjModal(true)} 
                    className="w-full text-left text-xs bg-gray-800/40 border border-gray-850 p-2.5 rounded-xl text-gray-400 hover:border-gray-700 transition"
                  >
                    + Create a Project
                  </button>
                ) : (
                  <select 
                    value={activeProject?.id || ''} 
                    onChange={(e) => {
                      const proj = projects.find(p => p.id === e.target.value)
                      if (proj) setActiveProject(proj)
                    }}
                    className="w-full bg-[#1E293B] border border-gray-800 text-gray-200 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-blue-500/50 transition cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowNewProjModal(true)} 
                className="h-10 w-10 bg-[#1E293B] hover:bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 hover:text-white mx-auto transition"
              >
                +
              </button>
            )}
          </div>

          {/* Navigation Views */}
          <nav className="p-3 space-y-1.5">
            <button 
              onClick={() => setView('chat')}
              className={`w-full flex items-center rounded-xl p-3 text-sm font-medium transition duration-200 group ${activeView === 'chat' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
            >
              <svg className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {isSidebarOpen && <span>Conversation Console</span>}
            </button>

            <button 
              onClick={() => setView('vault')}
              className={`w-full flex items-center rounded-xl p-3 text-sm font-medium transition duration-200 group ${activeView === 'vault' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/10' : 'text-gray-400 hover:text-white hover:bg-gray-800/60'}`}
            >
              <svg className={`h-5 w-5 ${isSidebarOpen ? 'mr-3' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              {isSidebarOpen && <span>Document Vault</span>}
            </button>
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-4 border-t border-gray-800 bg-[#0B0F19]/40 flex flex-col items-center">
          {isSidebarOpen ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white">
                  {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="truncate max-w-[120px]">
                  <p className="text-xs font-semibold text-gray-200 truncate">{user?.username || 'User'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{user?.email || 'authenticated'}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-800 transition"
                title="Logout"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={logout}
              className="h-10 w-10 bg-gray-850 hover:bg-red-500/10 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 mx-auto transition"
              title="Logout"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {children}
      </main>

      {/* New Project Modal */}
      {showNewProjModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0F172A] border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Project Name</label>
                <input 
                  type="text" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Gateway Service Auth v2"
                  className="w-full bg-[#1E293B] border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50 transition"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewProjModal(false)
                    setNewProjName('')
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-blue-500/10 transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
