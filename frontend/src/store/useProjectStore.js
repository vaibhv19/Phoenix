import { create } from 'zustand'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080/api'

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  documents: [],
  messages: [],
  activeDocument: null,
  activeView: 'chat', // 'chat' | 'vault'
  isQuerying: false,
  isUploading: false,
  isDeletingDoc: false,
  isLoadingDocs: false,
  isCreateModalOpen: false,
  error: null,

  setActiveDocument: (doc) => set({ activeDocument: doc }),

  fetchChatHistory: async (projectId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/chat/history?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch chat history')
      const data = await response.json()
      
      const messages = []
      // Reverse to render chronologically (oldest first)
      const chats = [...data].reverse()
      chats.forEach(chat => {
        messages.push({
          id: `msg-${chat.chatId}-user`,
          sender: 'user',
          text: chat.question || '',
          timestamp: new Date().toISOString()
        })
        messages.push({
          id: `msg-${chat.chatId}-ai`,
          sender: 'assistant',
          text: chat.answer || '',
          confidenceScore: chat.confidenceScore,
          reasoningTrace: chat.reasoningTrace || [],
          matches: chat.matches || [],
          timestamp: new Date().toISOString()
        })
      })
      set({ messages })
    } catch (err) {
      console.warn("Failed to fetch chat history, using empty list:", err.message)
      set({ messages: [] })
    }
  },

  setCreateModalOpen: (isOpen) => set({ isCreateModalOpen: isOpen }),

  fetchProjects: async () => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/projects`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch projects')
      const data = await response.json()
      set({ projects: data })
      
      // Auto-set active project if none is active
      if (data.length > 0 && !get().activeProject) {
        get().setActiveProject(data[0])
      }
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  createProject: async (name, description = '') => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, description })
      })
      if (!response.ok) {
        let errorMsg = 'Failed to create project'
        try {
          const errData = await response.json()
          if (errData && errData.message) errorMsg = errData.message
        } catch (_) {}
        throw new Error(errorMsg)
      }
      const newProj = await response.json()
      set(state => ({
        projects: [...state.projects, newProj]
      }))
      get().setActiveProject(newProj)
      return newProj
    } catch (err) {
      set({ error: err.message })
      throw err
    }
  },

  deleteProject: async (projectId) => {
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        let errorMsg = 'Failed to delete project'
        try {
          const errData = await response.json()
          if (errData && errData.message) errorMsg = errData.message
        } catch (_) {}
        throw new Error(errorMsg)
      }
      
      set(state => {
        const remainingProjects = state.projects.filter(p => p.id !== projectId)
        let newActiveProject = state.activeProject
        if (state.activeProject?.id === projectId) {
          newActiveProject = remainingProjects.length > 0 ? remainingProjects[0] : null
        }
        localStorage.removeItem(`docs_${projectId}`)
        localStorage.removeItem(`msgs_${projectId}`)
        return { 
          projects: remainingProjects,
          activeProject: newActiveProject
        }
      })
      
      const nextActive = get().activeProject
      if (nextActive) {
        get().setActiveProject(nextActive)
      } else {
        set({ documents: [], messages: [] })
      }
    } catch (err) {
      set({ error: err.message })
      throw err;
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project, documents: [], messages: [], activeDocument: null, isLoadingDocs: true })
    if (project) {
      // Fetch documents from backend
      get().fetchDocuments(project.id)
      
      // Fetch query logs from DB
      get().fetchChatHistory(project.id)
    } else {
      set({ isLoadingDocs: false })
    }
  },

  fetchDocuments: async (projectId) => {
    set({ isLoadingDocs: true })
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/documents?projectId=${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      const documents = data.map(d => ({
        id: d.id,
        filename: d.fileName || d.filename,
        status: d.status,
        createdAt: d.createdAt || new Date().toISOString()
      }))
      set({ documents })
      localStorage.setItem(`docs_${projectId}`, JSON.stringify(documents))

      // Auto-set active document if none is active and there are ready documents
      const activeDoc = get().activeDocument
      const readyDoc = documents.find(d => d.status === 'READY')
      if (readyDoc && (!activeDoc || !documents.some(d => d.id === activeDoc.id))) {
        set({ activeDocument: readyDoc })
      }
    } catch (err) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isLoadingDocs: false })
    }
  },

  deleteDocument: async (docId) => {
    const activeProject = get().activeProject
    if (!activeProject) return
    
    set({ isDeletingDoc: true })
    const token = localStorage.getItem('token')
    
    // Perform optimistic local state update immediately
    const previousDocs = get().documents
    const remainingDocs = previousDocs.filter(d => d.id !== docId)
    set({ documents: remainingDocs })
    localStorage.setItem(`docs_${activeProject.id}`, JSON.stringify(remainingDocs))

    if (get().activeDocument?.id === docId) {
      const nextActive = remainingDocs.find(d => d.status === 'READY') || null
      set({ activeDocument: nextActive })
    }

    try {
      const response = await fetch(`${BACKEND_URL}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        let errorMsg = 'Failed to delete document'
        try {
          const errData = await response.json()
          if (errData && errData.message) errorMsg = errData.message
        } catch (_) {}
        throw new Error(errorMsg)
      }
    } catch (err) {
      set({ documents: previousDocs })
      localStorage.setItem(`docs_${activeProject.id}`, JSON.stringify(previousDocs))
      throw err
    } finally {
      set({ isDeletingDoc: false })
    }
  },

  setView: (activeView) => set({ activeView }),

  uploadDocument: async (file) => {
    const activeProject = get().activeProject
    if (!activeProject) return
    
    set({ isUploading: true })
    const token = localStorage.getItem('token')
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', activeProject.id)

    try {
      const response = await fetch(`${BACKEND_URL}/documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      if (!response.ok) throw new Error('Upload failed')
      const docData = await response.json()
      
      const newDoc = {
        id: docData.id || `doc-${Date.now()}`,
        filename: file.name,
        status: docData.status || 'PROCESSING',
        createdAt: new Date().toISOString()
      }

      set(state => {
        const updated = [...state.documents, newDoc]
        localStorage.setItem(`docs_${activeProject.id}`, JSON.stringify(updated))
        return { documents: updated }
      })

      // Start status polling
      get()._pollDocumentStatus(newDoc.id)
    } catch (err) {
      set({ error: err.message })
      throw err
    } finally {
      set({ isUploading: false })
    }
  },

  _pollDocumentStatus: async (docId) => {
    const activeProject = get().activeProject
    if (!activeProject) return
    const token = localStorage.getItem('token')
    
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      if (attempts > 30) { // Timeout after ~1 minute
        clearInterval(interval)
        get()._updateDocStatus(docId, 'FAILED')
        return
      }
      
      try {
        const response = await fetch(`${BACKEND_URL}/documents/${docId}/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const docData = await response.json()
          if (docData.status === 'READY' || docData.status === 'COMPLETED') {
            clearInterval(interval)
            get()._updateDocStatus(docId, 'READY')
          } else if (docData.status === 'FAILED') {
            clearInterval(interval)
            get()._updateDocStatus(docId, 'FAILED')
          }
        }
      } catch (err) {
        clearInterval(interval)
        get()._updateDocStatus(docId, 'FAILED')
      }
    }, 2000)
  },

  _pollDocumentStatusMock: (docId) => {
    setTimeout(() => {
      get()._updateDocStatus(docId, 'READY')
    }, 4000)
  },

  _updateDocStatus: (docId, status) => {
    const activeProject = get().activeProject
    if (!activeProject) return
    
    set(state => {
      const updated = state.documents.map(d => 
        d.id === docId ? { ...d, status } : d
      )
      localStorage.setItem(`docs_${activeProject.id}`, JSON.stringify(updated))
      return { documents: updated }
    })
  },

  queryRAG: async (queryText) => {
    const activeProject = get().activeProject
    const activeDocument = get().activeDocument
    if (!activeProject || !activeDocument) return
    
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    }
    
    set(state => {
      const updated = [...state.messages, userMsg]
      return { messages: updated, isQuerying: true }
    })
    
    const token = localStorage.getItem('token')
    try {
      const response = await fetch(`${BACKEND_URL}/chat/query`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          documentId: activeDocument.id,
          query: queryText
        })
      })
      if (!response.ok) throw new Error('RAG query failed')
      const data = await response.json()
      
      const aiMsg = {
        id: `msg-${data.chatId || Date.now() + 1}-ai`,
        sender: 'assistant',
        text: data.answer,
        confidenceScore: data.confidenceScore,
        reasoningTrace: data.reasoningTrace || [],
        matches: data.matches || [],
        timestamp: new Date().toISOString()
      }
      
      set(state => ({
        messages: [...state.messages, aiMsg]
      }))
    } catch (err) {
      console.error("Gateway RAG query failed:", err.message)
      const errorMsg = {
        id: `msg-${Date.now() + 1}-error`,
        sender: 'assistant',
        text: `Error executing query: ${err.message}. Please verify the backend and retrieval services are operational.`,
        confidenceScore: 0.0,
        reasoningTrace: [
          { state: 'FALLBACK_CLARIFY', confidenceScore: 0.0, description: `Gateway error: ${err.message}` }
        ],
        matches: [],
        timestamp: new Date().toISOString()
      }
      set(state => ({
        messages: [...state.messages, errorMsg]
      }))
    } finally {
      set({ isQuerying: false })
    }
  },

  clearChat: () => {
    const activeProject = get().activeProject
    if (!activeProject) return
    set({ messages: [] })
  }
}))
