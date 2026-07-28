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
    deleteProject,
    setActiveProject, 
    activeView, 
    setView 
  } = useProjectStore()

  const [showNewProjModal, setShowNewProjModal] = useState(false)
  const [newProjName, setNewProjName] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Deletion and Feedback States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

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

  const handleDeleteProject = (projectId) => {
    if (!projectId) return
    const project = projects.find(p => p.id === projectId)
    if (!project) return
    setProjectToDelete(project)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    setIsDeleting(true)
    try {
      await deleteProject(projectToDelete.id)
      setToast({ message: `Successfully deleted project "${projectToDelete.name}"`, type: 'success' })
      setShowDeleteConfirm(false)
      setProjectToDelete(null)
    } catch (err) {
      console.error("Project delete failed:", err)
      setToast({ message: `Failed to delete project: ${err.message}`, type: 'error' })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex h-screen bg-[#09090b] text-[#f4f4f5] overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`bg-[#0c0c0e] border-r border-zinc-800 flex flex-col justify-between transition-all duration-200 z-30 ${isSidebarOpen ? 'w-60' : 'w-16'}`}>
        <div>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-zinc-800">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-2.5">
                <div className="h-7 w-7 rounded border border-zinc-700 bg-zinc-800/50 flex items-center justify-center font-bold text-xs text-zinc-300">
                  P
                </div>
                <div>
                  <h1 className="text-sm font-semibold tracking-tight text-zinc-200">
                    Phoenix Workspace
                  </h1>
                </div>
              </div>
            ) : (
              <div className="h-7 w-7 rounded border border-zinc-700 bg-zinc-800/50 flex items-center justify-center font-bold text-xs text-zinc-300 mx-auto">
                P
              </div>
            )}
            
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="text-zinc-500 hover:text-zinc-200 p-1 rounded hover:bg-zinc-900 transition"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Project Switcher */}
          <div className="p-3 border-b border-zinc-800">
            {isSidebarOpen ? (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <span>Projects</span>
                  <button 
                    onClick={() => setShowNewProjModal(true)} 
                    className="text-blue-500 hover:text-blue-400 font-medium text-sm px-1.5 py-0.5 rounded hover:bg-zinc-800 transition"
                  >
                    + New
                  </button>
                </div>
                
                {projects.length === 0 ? (
                  <button 
                    onClick={() => setShowNewProjModal(true)} 
                    className="w-full text-left text-xs bg-zinc-900/40 border border-zinc-800 p-2 rounded text-zinc-400 hover:border-zinc-700 transition"
                  >
                    + Create a Project
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <select 
                      value={activeProject?.id || ''} 
                      onChange={(e) => {
                        const proj = projects.find(p => p.id === e.target.value)
                        if (proj) setActiveProject(proj)
                      }}
                      className="flex-1 bg-[#161618] border border-zinc-800 text-zinc-300 text-xs rounded px-2.5 py-2 outline-none focus:border-zinc-700 transition cursor-pointer"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <button 
                      onClick={() => handleDeleteProject(activeProject?.id)}
                      className="p-2 bg-[#161618] border border-zinc-800 hover:bg-red-950/20 hover:border-red-900/40 rounded text-zinc-400 hover:text-red-400 transition shrink-0"
                      title="Delete active project"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => setShowNewProjModal(true)} 
                className="h-8 w-8 bg-[#161618] border border-zinc-800 hover:bg-zinc-800 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 mx-auto transition text-sm"
              >
                +
              </button>
            )}
          </div>

          {/* Navigation Views */}
          <nav className="p-2 space-y-1">
            <button 
              onClick={() => setView('chat')}
              className={`w-full flex items-center rounded p-2.5 text-xs font-medium transition duration-150 group ${activeView === 'chat' ? 'bg-[#161618] border border-zinc-800 text-zinc-200' : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-900/60'}`}
            >
              <svg className={`h-4 w-4 ${isSidebarOpen ? 'mr-2.5' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {isSidebarOpen && <span>Retrieval Engine</span>}
            </button>

            <button 
              onClick={() => setView('vault')}
              className={`w-full flex items-center rounded p-2.5 text-xs font-medium transition duration-150 group ${activeView === 'vault' ? 'bg-[#161618] border border-zinc-800 text-zinc-200' : 'text-zinc-400 border border-transparent hover:text-zinc-200 hover:bg-zinc-900/60'}`}
            >
              <svg className={`h-4 w-4 ${isSidebarOpen ? 'mr-2.5' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
              {isSidebarOpen && <span>Documents</span>}
            </button>
          </nav>
        </div>

        {/* Footer / User Profile & Logout */}
        <div className="p-3 border-t border-zinc-800 bg-zinc-950/40 flex flex-col items-center">
          {isSidebarOpen ? (
            <div className="w-full flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <div className="h-7 w-7 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center font-semibold text-[10px] text-zinc-300 shrink-0">
                  {user?.username?.substring(0, 2).toUpperCase() || 'US'}
                </div>
                <div className="truncate max-w-[100px]">
                  <p className="text-xs font-medium text-zinc-250 truncate">{user?.username || 'User'}</p>
                  <p className="text-[9px] text-zinc-500 truncate">{user?.email || 'authenticated'}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="text-zinc-500 hover:text-red-400 p-1.5 rounded hover:bg-zinc-900 transition"
                title="Logout"
              >
                <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          ) : (
            <button 
              onClick={logout}
              className="h-8 w-8 bg-zinc-900 border border-zinc-800 hover:bg-red-950/20 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 mx-auto transition"
              title="Logout"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg w-full max-w-sm p-5 shadow-2xl animate-fade-in">
            <h3 className="text-sm font-bold mb-3 text-zinc-200">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. Gateway Service Auth v2"
                  className="w-full bg-[#161618] border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 outline-none focus:border-blue-500/40 transition"
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-2.5 justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowNewProjModal(false)
                    setNewProjName('')
                  }}
                  className="px-3.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-250 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow transition"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Project Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0c0c0e] border border-zinc-800 rounded-lg w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center space-x-3 text-red-500 mb-4">
              <svg className="h-6 w-6 shrink-0 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-base font-bold text-zinc-100">
                Delete this project?
              </h3>
            </div>
            
            <div className="space-y-3.5 text-xs text-zinc-400 mb-6 leading-relaxed">
              <p>
                This will permanently remove the project <strong className="text-zinc-200">"{projectToDelete?.name}"</strong>, uploaded documents, retrieval index, and chat history.
              </p>
              <p className="text-red-400/95 font-medium bg-red-950/20 border border-red-900/30 p-2.5 rounded">
                ⚠ This action cannot be undone.
              </p>
            </div>
            
            <div className="flex space-x-3 justify-end">
              <button 
                type="button" 
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirm(false)
                  setProjectToDelete(null)
                }}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded shadow transition flex items-center space-x-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Project</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 rounded-lg border shadow-2xl animate-slide-in flex items-center space-x-3 max-w-sm backdrop-blur-md transition-all duration-300 bg-[#0c0c0e]/95 border-zinc-800">
          {toast.type === 'success' ? (
            <div className="h-7 w-7 rounded bg-green-950/40 border border-green-800/60 flex items-center justify-center text-green-400 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="h-7 w-7 rounded bg-red-950/40 border border-red-800/60 flex items-center justify-center text-red-400 shrink-0">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
          <div className="flex-1 text-xs font-medium text-zinc-200 leading-tight">
            {toast.message}
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-zinc-500 hover:text-zinc-300 transition p-0.5"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
