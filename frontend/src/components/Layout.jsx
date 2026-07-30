import React, { useState, useEffect, useRef } from 'react'
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
    setView,
    isCreateModalOpen,
    setCreateModalOpen
  } = useProjectStore()

  const [newProjName, setNewProjName] = useState('')
  const [isCreatingProject, setIsCreatingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Deletion and Feedback States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [toast, setToast] = useState(null)

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)

  const getUserDisplayName = () => {
    if (!user) return 'User'
    return user.username || 'User'
  }

  const userDisplayName = getUserDisplayName()

  const getUserInitials = (username) => {
    if (!username) return 'US'
    const cleanUsername = username.trim()
    const parts = cleanUsername.split(/[._\-]/)
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return cleanUsername.substring(0, 2).toUpperCase()
  }

  const userInitials = getUserInitials(userDisplayName)

  const handleLogout = () => {
    logout()
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      documents: [],
      messages: [],
      activeView: 'chat',
      error: null
    })
  }

  // Custom Workspace Dropdown Selector States & Handlers
  const [isWorkspaceDropdownOpen, setIsWorkspaceDropdownOpen] = useState(false)
  const [focusedWorkspaceIndex, setFocusedWorkspaceIndex] = useState(-1)
  const workspaceDropdownRef = useRef(null)
  const workspaceTriggerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        workspaceDropdownRef.current && 
        !workspaceDropdownRef.current.contains(e.target) && 
        workspaceTriggerRef.current && 
        !workspaceTriggerRef.current.contains(e.target)
      ) {
        setIsWorkspaceDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleWorkspaceKeyDown = (e) => {
    if (!isWorkspaceDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsWorkspaceDropdownOpen(true)
        const idx = projects.findIndex(p => p.id === activeProject?.id)
        setFocusedWorkspaceIndex(idx >= 0 ? idx : 0)
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedWorkspaceIndex(prev => (prev + 1) % projects.length)
        break;
      case 'ArrowUp':
        e.preventDefault()
        setFocusedWorkspaceIndex(prev => (prev - 1 + projects.length) % projects.length)
        break;
      case 'Enter':
        e.preventDefault()
        if (focusedWorkspaceIndex >= 0 && focusedWorkspaceIndex < projects.length) {
          setActiveProject(projects[focusedWorkspaceIndex])
        }
        setIsWorkspaceDropdownOpen(false)
        workspaceTriggerRef.current?.focus()
        break;
      case 'Escape':
        e.preventDefault()
        setIsWorkspaceDropdownOpen(false)
        workspaceTriggerRef.current?.focus()
        break;
      case 'Tab':
        setIsWorkspaceDropdownOpen(false)
        break;
      default:
        break;
    }
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isCreateModalOpen && !isCreatingProject) {
          setCreateModalOpen(false)
          setNewProjName('')
          setCreateProjectError(null)
        }
        if (showDeleteConfirm && !isDeleting) {
          setShowDeleteConfirm(false)
          setProjectToDelete(null)
        }
        if (isProfileMenuOpen) {
          setIsProfileMenuOpen(false)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCreateModalOpen, isCreatingProject, showDeleteConfirm, isDeleting, isProfileMenuOpen])


  const handleCreateProject = async (e) => {
    e.preventDefault()
    const trimmedName = newProjName.trim()
    if (!trimmedName || isCreatingProject) return
    
    setIsCreatingProject(true)
    setCreateProjectError(null)
    
    try {
      await createProject(trimmedName)
      setToast({ message: 'Workspace created', type: 'success' })
      setNewProjName('')
      setCreateModalOpen(false)
    } catch (err) {
      console.error("Workspace creation failed:", err)
      setCreateProjectError(err.message || 'Unable to create workspace. Please try again.')
    } finally {
      setIsCreatingProject(false)
    }
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
    <div className="h-screen w-screen bg-[#030303] p-1.5 md:p-2 flex overflow-hidden text-[#f4f4f5] font-sans">
      <div className="flex-1 flex bg-[#09090b] rounded-xl border border-zinc-900/50 overflow-hidden shadow-2xl">
        {/* Sidebar */}
        <aside className={`bg-[#060607] border-r border-zinc-900/20 flex flex-col justify-between transition-all duration-200 z-30 ${isSidebarOpen ? 'w-60' : 'w-16'}`}>
          <div>
            {/* Header (Logo Click Toggles Sidebar) */}
            <div className="px-4.5 py-5 flex items-center justify-start">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="flex items-center space-x-2.5 text-left focus:outline-none transition duration-150 hover:opacity-85"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
              >
                <div className="h-6 w-6 rounded bg-zinc-900 flex items-center justify-center text-zinc-350 shrink-0">
                  <svg className="h-3.5 w-3.5 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M12 2L4 10h16L12 2z" />
                    <path d="M12 22l8-8H4l8 8z" />
                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                  </svg>
                </div>
                {isSidebarOpen && (
                  <span className="text-xs font-semibold tracking-[0.2em] text-zinc-250 uppercase select-none">
                    Phoenix
                  </span>
                )}
              </button>
            </div>

            <div className="flex flex-col space-y-6 pt-1">
              {/* Project Switcher */}
              <div className="px-4.5 py-1">
                {isSidebarOpen ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-zinc-550 uppercase tracking-widest">
                      <span>Workspace</span>
                      <button 
                        onClick={() => setCreateModalOpen(true)} 
                        className="text-zinc-500 hover:text-zinc-200 font-semibold px-1 rounded transition duration-150"
                      >
                        + New
                      </button>
                    </div>
                    
                    {projects.length === 0 ? (
                      <button 
                        onClick={() => setCreateModalOpen(true)} 
                        className="w-full text-left text-xs bg-zinc-900/30 border border-zinc-900/50 p-2 rounded text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-250 transition duration-150"
                      >
                        + Create Project
                      </button>
                    ) : (
                      <div className="flex items-center space-x-1.5 relative">
                        {/* Custom Workspace Dropdown Selector */}
                        <div className="flex-1 relative">
                          <button
                            ref={workspaceTriggerRef}
                            onClick={() => setIsWorkspaceDropdownOpen(!isWorkspaceDropdownOpen)}
                            onKeyDown={handleWorkspaceKeyDown}
                            className="w-full flex items-center justify-between bg-[#060607]/80 border border-zinc-850 hover:border-zinc-800 text-zinc-200 text-[11px] font-medium rounded-md px-2.5 py-1.5 transition cursor-pointer select-none outline-none focus:border-zinc-700"
                            aria-haspopup="listbox"
                            aria-expanded={isWorkspaceDropdownOpen}
                            aria-label="Select workspace"
                          >
                            <span className="truncate max-w-[120px]">{activeProject?.name || 'Select Workspace'}</span>
                            <span className="text-[8px] text-zinc-550 select-none ml-1">
                              {isWorkspaceDropdownOpen ? '▲' : '▼'}
                            </span>
                          </button>

                          {isWorkspaceDropdownOpen && (
                            <div 
                              ref={workspaceDropdownRef}
                              className="absolute z-50 left-0 right-0 mt-1.5 bg-[#0e0e11] border border-zinc-850 rounded-lg shadow-2xl py-1 max-h-48 overflow-y-auto animate-slide-in"
                              role="listbox"
                            >
                              {projects.map((p, idx) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setActiveProject(p)
                                    setIsWorkspaceDropdownOpen(false)
                                    workspaceTriggerRef.current?.focus()
                                  }}
                                  onMouseEnter={() => setFocusedWorkspaceIndex(idx)}
                                  className={`px-2.5 py-2 text-[11px] font-sans font-medium cursor-pointer flex items-center space-x-2 transition-colors duration-150 ${
                                    idx === focusedWorkspaceIndex ? 'bg-zinc-900/50 text-zinc-150' : 'text-zinc-400'
                                  }`}
                                  role="option"
                                  aria-selected={p.id === activeProject?.id}
                                >
                                  <span className={`w-3.5 h-3.5 text-[10px] font-bold text-emerald-500 flex items-center justify-center shrink-0 ${p.id === activeProject?.id ? 'opacity-100' : 'opacity-0'}`}>
                                    ✓
                                  </span>
                                  <span className="truncate flex-1">{p.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => handleDeleteProject(activeProject?.id)}
                          className="p-1.5 bg-zinc-900/60 border border-zinc-850 hover:bg-red-950/20 hover:border-red-900/40 rounded text-zinc-500 hover:text-red-400 transition shrink-0"
                          title="Delete active project"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={() => setCreateModalOpen(true)} 
                    className="h-8 w-8 bg-zinc-900/60 border border-zinc-855 hover:bg-zinc-850 rounded flex items-center justify-center text-zinc-400 hover:text-zinc-200 mx-auto transition duration-150 text-xs font-semibold"
                    title="Create Project"
                  >
                    +
                  </button>
                )}
              </div>

              {/* Navigation Views */}
              <div className="px-4.5 py-1 space-y-2">
                {activeProject ? (
                  <>
                    {isSidebarOpen && (
                      <div className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest mb-0.5">
                        Investigation
                      </div>
                    )}
                    <nav className="space-y-1">
                      <button 
                        onClick={() => setView('chat')}
                        className={`w-full flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition duration-155 ${activeView === 'chat' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/35'}`}
                      >
                        <svg className={`h-4 w-4 shrink-0 ${isSidebarOpen ? 'mr-2.5' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {isSidebarOpen && <span>Retrieval Console</span>}
                      </button>

                      <button 
                        onClick={() => setView('vault')}
                        className={`w-full flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition duration-155 ${activeView === 'vault' ? 'bg-zinc-900 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/35'}`}
                      >
                        <svg className={`h-4 w-4 shrink-0 ${isSidebarOpen ? 'mr-2.5' : 'mx-auto'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        {isSidebarOpen && <span>Document Vault</span>}
                      </button>
                    </nav>
                  </>
                ) : (
                  <>
                    {isSidebarOpen ? (
                      <div className="space-y-1.5 p-3 rounded-lg bg-zinc-950/20 border border-zinc-900/60 text-left select-none">
                        <div className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">
                          No Active Project
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-normal">
                          Select or create a project to access investigation tools.
                        </p>
                      </div>
                    ) : (
                      <div 
                        className="h-8 w-8 bg-zinc-900/10 border border-zinc-900/40 rounded flex items-center justify-center text-zinc-650 mx-auto transition duration-150 text-xs font-semibold cursor-not-allowed select-none"
                        title="No active project. Select a workspace."
                      >
                        ∅
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer / User Profile & Logout */}
          <div className="relative p-3 border-t border-zinc-900 bg-zinc-950/20 w-full flex items-center justify-between">
            {/* Profile Menu Dropdown */}
            {isProfileMenuOpen && (
              <div className={`absolute bottom-16 left-3 bg-[#0e0e11] border border-zinc-855 rounded-lg p-2 shadow-2xl z-50 animate-slide-in ${isSidebarOpen ? 'right-3' : 'w-48'}`}>
                <div className="p-2 text-xs border-b border-zinc-855 select-none">
                  <p className="font-semibold text-zinc-300 truncate">{userDisplayName}</p>
                  <p className="text-[10px] text-zinc-500 truncate mt-0.5">{user?.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 mt-1 rounded text-left text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition duration-150"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}

            {isSidebarOpen ? (
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-full flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <div className="h-7 w-7 rounded bg-zinc-900 flex items-center justify-center font-bold text-[10px] text-zinc-350 shrink-0 group-hover:text-zinc-200 transition">
                    {userInitials}
                  </div>
                  <div className="truncate max-w-[110px]">
                    <p className="text-xs font-medium text-zinc-300 truncate group-hover:text-zinc-150 transition">{userDisplayName}</p>
                    <p className="text-[9px] text-zinc-500 truncate">{user?.email}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition duration-150"
                  title="Profile options"
                  aria-label="Profile options"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                  </svg>
                </button>
              </div>
            ) : (
              <div 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="h-8 w-8 rounded bg-zinc-900 hover:bg-zinc-850 flex items-center justify-center text-zinc-350 cursor-pointer mx-auto transition duration-150 group"
                title="Profile options"
              >
                <span className="font-semibold text-[10px] text-zinc-400 group-hover:text-zinc-200 font-sans">
                  {userInitials}
                </span>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </main>
      </div>

      {/* New Project Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0c0c0e] border border-zinc-850 rounded-lg w-full max-w-sm p-5 shadow-2xl animate-fade-in">
            <h3 className="text-sm font-bold mb-3 text-zinc-200">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Project Name</label>
                <input 
                  type="text" 
                  value={newProjName}
                  onChange={(e) => {
                    setNewProjName(e.target.value)
                    if (createProjectError) setCreateProjectError(null)
                  }}
                  placeholder="e.g. Gateway Service Auth v2"
                  className="w-full bg-zinc-900/85 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-250 placeholder-zinc-650 outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition disabled:opacity-50"
                  disabled={isCreatingProject}
                  autoFocus
                />
              </div>

              {createProjectError && (
                <div className="text-[10px] text-red-400 bg-red-955/10 border border-red-950/40 px-3 py-2 rounded-md flex items-center space-x-1.5 animate-slide-in select-none">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{createProjectError}</span>
                </div>
              )}
              
              <div className="flex space-x-2.5 justify-end pt-1">
                <button 
                  type="button" 
                  onClick={() => {
                    if (isCreatingProject) return
                    setCreateModalOpen(false)
                    setNewProjName('')
                    setCreateProjectError(null)
                  }}
                  className="px-3.5 py-1.5 text-xs text-zinc-500 hover:text-zinc-350 transition disabled:opacity-30 disabled:cursor-not-allowed"
                  disabled={isCreatingProject}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isCreatingProject || !newProjName.trim()}
                  className="px-3.5 py-1.5 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-semibold rounded shadow transition flex items-center space-x-1.5 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed"
                >
                  {isCreatingProject && (
                    <svg className="animate-spin h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  <span>{isCreatingProject ? 'Creating...' : 'Create Project'}</span>
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
