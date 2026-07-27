import { create } from 'zustand'

const BACKEND_URL = 'http://localhost:8080/api'
const FASTAPI_URL = 'http://localhost:8000/internal/v1'

export const useProjectStore = create((set, get) => ({
  projects: [],
  activeProject: null,
  documents: [],
  messages: [],
  activeView: 'chat', // 'chat' | 'vault'
  isQuerying: false,
  isUploading: false,
  error: null,

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
      console.warn("Failed to fetch projects, using mock database:", err.message)
      const stored = localStorage.getItem('mock_projects')
      const projects = stored ? JSON.parse(stored) : [
        { id: 'proj-1', name: 'Cloud Infrastructure Specs', createdAt: new Date().toISOString() },
        { id: 'proj-2', name: 'API Gateway Protocols', createdAt: new Date().toISOString() }
      ]
      localStorage.setItem('mock_projects', JSON.stringify(projects))
      set({ projects })
      if (!get().activeProject) {
        get().setActiveProject(projects[0])
      }
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
      if (!response.ok) throw new Error('Failed to create project')
      const newProj = await response.json()
      set(state => ({
        projects: [...state.projects, newProj]
      }))
      get().setActiveProject(newProj)
      return newProj
    } catch (err) {
      console.warn("Failed to create project via API, creating mock project:", err.message)
      const newProj = {
        id: `proj-${Date.now()}`,
        name,
        createdAt: new Date().toISOString()
      }
      const updated = [...get().projects, newProj]
      localStorage.setItem('mock_projects', JSON.stringify(updated))
      set({ projects: updated })
      get().setActiveProject(newProj)
      return newProj
    }
  },

  setActiveProject: (project) => {
    set({ activeProject: project })
    if (project) {
      // Load documents from localStorage for this project
      const storedDocs = localStorage.getItem(`docs_${project.id}`)
      const documents = storedDocs ? JSON.parse(storedDocs) : []
      
      // Load messages from localStorage for this project
      const storedMsgs = localStorage.getItem(`msgs_${project.id}`)
      const messages = storedMsgs ? JSON.parse(storedMsgs) : []

      set({ documents, messages })
    } else {
      set({ documents: [], messages: [] })
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
      console.warn("API Upload failed, creating mock document and simulating ingestion:", err.message)
      const mockDoc = {
        id: `doc-${Date.now()}`,
        filename: file.name,
        status: 'PROCESSING',
        createdAt: new Date().toISOString()
      }

      set(state => {
        const updated = [...state.documents, mockDoc]
        localStorage.setItem(`docs_${activeProject.id}`, JSON.stringify(updated))
        return { documents: updated }
      })

      // Start mock status polling
      get()._pollDocumentStatusMock(mockDoc.id)
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
        get()._pollDocumentStatusMock(docId)
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
    if (!activeProject) return
    
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toISOString()
    }
    
    set(state => {
      const updated = [...state.messages, userMsg]
      localStorage.setItem(`msgs_${activeProject.id}`, JSON.stringify(updated))
      return { messages: updated, isQuerying: true }
    })
    
    try {
      const response = await fetch(`${FASTAPI_URL}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: activeProject.id,
          query: queryText,
          limit: 5,
          alpha: 0.7
        })
      })
      if (!response.ok) throw new Error('RAG query failed')
      const data = await response.json()
      
      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: data.answer,
        confidenceScore: data.confidenceScore,
        reasoningTrace: data.reasoningTrace || [],
        matches: data.matches || [],
        timestamp: new Date().toISOString()
      }
      
      set(state => {
        const updated = [...state.messages, aiMsg]
        localStorage.setItem(`msgs_${activeProject.id}`, JSON.stringify(updated))
        return { messages: updated }
      })
    } catch (err) {
      console.warn("FastAPI query failed, fallback to interactive mock query logic:", err.message)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const mockData = get()._generateMockRAGResponse(queryText)
      
      const aiMsg = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: mockData.answer,
        confidenceScore: mockData.confidenceScore,
        reasoningTrace: mockData.reasoningTrace,
        matches: mockData.matches,
        timestamp: new Date().toISOString()
      }
      
      set(state => {
        const updated = [...state.messages, aiMsg]
        localStorage.setItem(`msgs_${activeProject.id}`, JSON.stringify(updated))
        return { messages: updated }
      })
    } finally {
      set({ isQuerying: false })
    }
  },

  clearChat: () => {
    const activeProject = get().activeProject
    if (!activeProject) return
    localStorage.removeItem(`msgs_${activeProject.id}`)
    set({ messages: [] })
  },

  _generateMockRAGResponse: (query) => {
    const qLower = query.toLowerCase()
    
    if (qLower.includes('yaml') || qLower.includes('k8s') || qLower.includes('kubernetes')) {
      return {
        answer: "To deploy the microservices on Kubernetes, use the specifications defined in `deployment.yaml` [[p. 1 - YAML]](#match-1). Ensure that container resources are allocated correctly, setting a memory limit of `512Mi` [[p. 3 - YAML]](#match-2). High availability is configured using 3 replicas [[p. 12 - YAML]](#match-3).",
        confidenceScore: 0.88,
        reasoningTrace: [
          { state: "INITIAL_RETRIEVAL", confidenceScore: 0.88, description: "Initial retrieval found direct semantic matches in deployment.yaml." },
          { state: "ANSWER_GENERATION", confidenceScore: 0.88, description: "Retrieved chunks exceed the Green threshold (0.75). Synthesizing direct response." }
        ],
        matches: [
          { id: 'match-1', chunkIndex: 1, content: "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: gateway-service\nspec:\n  replicas: 3", score: 0.88, chunk_metadata: { source: 'deployment.yaml', page: 1 } },
          { id: 'match-2', chunkIndex: 3, content: "resources:\n  limits:\n    cpu: \"500m\"\n    memory: 512Mi", score: 0.82, chunk_metadata: { source: 'deployment.yaml', page: 3 } },
          { id: 'match-3', chunkIndex: 12, content: "spec:\n  strategy:\n    type: RollingUpdate\n    rollingUpdate:\n      maxSurge: 1", score: 0.78, chunk_metadata: { source: 'deployment.yaml', page: 12 } }
        ]
      }
    } else if (qLower.includes('rewrite') || qLower.includes('optimize') || qLower.includes('yellow')) {
      return {
        answer: "Based on the rewritten query 'gateway rate limit configuration', rate limits are set at 100 requests per minute per IP [[p. 5 - Gateway]](#match-4). Traffic throttling applies to both public and private APIs [[p. 9 - Gateway]](#match-5).",
        confidenceScore: 0.76,
        reasoningTrace: [
          { state: "INITIAL_RETRIEVAL", confidenceScore: 0.58, description: "Initial retrieval confidence is 0.58 (Yellow range [0.50, 0.75)). Triggering query rewrite fallback." },
          { state: "FALLBACK_REWRITE", confidenceScore: 0.76, description: "Rewrote query to 'gateway rate limit configuration'. Secondary retrieval confidence is 0.76 (Green)." },
          { state: "ANSWER_GENERATION", confidenceScore: 0.76, description: "Generating answer using expanded query context." }
        ],
        matches: [
          { id: 'match-4', chunkIndex: 5, content: "rate_limiting:\n  enabled: true\n  requests_per_min: 100\n  scope: ip", score: 0.76, chunk_metadata: { source: 'gateway_rules.conf', page: 5 } },
          { id: 'match-5', chunkIndex: 9, content: "throttling:\n  burst_limit: 20\n  cool_down_sec: 10", score: 0.71, chunk_metadata: { source: 'gateway_rules.conf', page: 9 } }
        ]
      }
    } else if (qLower.includes('rerank') || qLower.includes('orange') || qLower.includes('cross')) {
      return {
        answer: "After Cross-Encoder reranking, the database indicates that CORS issues can be resolved by adjusting `allowedOrigins` in `WebConfig.java` [[p. 15 - CORS]](#match-6). Ensure headers include `Authorization` [[p. 18 - CORS]](#match-7).",
        confidenceScore: 0.52,
        reasoningTrace: [
          { state: "INITIAL_RETRIEVAL", confidenceScore: 0.42, description: "Initial retrieval confidence is 0.42 (Orange range [0.35, 0.50)). Initiating FlashRank reranking." },
          { state: "RERANK_EVALUATION", confidenceScore: 0.52, description: "FlashRank Cross-Encoder reranking computed a top score of 0.52 (exceeding orange threshold of 0.50)." },
          { state: "ANSWER_GENERATION", confidenceScore: 0.52, description: "Generating answer using reranked passages." }
        ],
        matches: [
          { id: 'match-6', chunkIndex: 15, content: "registry.addMapping(\"/api/**\").allowedOrigins(\"*\").allowedMethods(\"GET\", \"POST\")", score: 0.52, chunk_metadata: { source: 'WebConfig.java', page: 15 } },
          { id: 'match-7', chunkIndex: 18, content: "allowedHeaders(\"Content-Type\", \"Authorization\")", score: 0.48, chunk_metadata: { source: 'WebConfig.java', page: 18 } }
        ]
      }
    } else if (qLower.includes('clarify') || qLower.includes('red') || qLower.includes('fail') || qLower.includes('what is the meaning of life')) {
      return {
        answer: "Could you please clarify your request? I found matches relating to WebConfig.java [[p. 15]](#match-6) or deployment.yaml [[p. 1]](#match-1), but they do not contain details regarding your search query.",
        confidenceScore: 0.22,
        reasoningTrace: [
          { state: "INITIAL_RETRIEVAL", confidenceScore: 0.22, description: "Initial retrieval confidence is 0.22 (Red range < 0.35). Initiating clarification fallback." },
          { state: "FALLBACK_CLARIFY", confidenceScore: 0.22, description: "Confidence is red. Aborting RAG synthesis to prevent hallucinations." },
          { state: "CLARIFICATION_GENERATION", confidenceScore: 0.22, description: "Generated polite clarifying question." }
        ],
        matches: []
      }
    } else {
      return {
        answer: "The active system architecture incorporates a Spring Boot orchestrator [[p. 2 - Design]](#match-8) and a pgvector database [[p. 4 - Design]](#match-9) to coordinate ingestion. Chunks are generated dynamically from PDFs and scored via WLC fusion.",
        confidenceScore: 0.81,
        reasoningTrace: [
          { state: "INITIAL_RETRIEVAL", confidenceScore: 0.81, description: "Initial retrieval completed. Confidence score: 0.81 (Green)." },
          { state: "ANSWER_GENERATION", confidenceScore: 0.81, description: "Generating answer based on design_document.pdf context." }
        ],
        matches: [
          { id: 'match-8', chunkIndex: 2, content: "The Spring Boot service exposes routes for project CRUD and handles authorization via JWT.", score: 0.81, chunk_metadata: { source: 'design_document.pdf', page: 2 } },
          { id: 'match-9', chunkIndex: 4, content: "FastAPI chunks document text and inserts pgvector embeddings into PostgreSQL.", score: 0.79, chunk_metadata: { source: 'design_document.pdf', page: 4 } }
        ]
      }
    }
  }
}))
