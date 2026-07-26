import { create } from 'zustand'

export const useAppStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  activeProject: null,
  documents: [],
  chatHistory: [],
  isProcessing: false,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setActiveProject: (activeProject) => set({ activeProject }),
  setDocuments: (documents) => set({ documents }),
  setChatHistory: (chatHistory) => set({ chatHistory }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  
  reset: () => set({ user: null, isAuthenticated: false, activeProject: null, documents: [], chatHistory: [] })
}))
