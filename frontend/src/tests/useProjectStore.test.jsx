import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useProjectStore } from '../store/useProjectStore'

const originalFetch = global.fetch
const getStore = () => useProjectStore.getState()

afterEach(() => {
  global.fetch = originalFetch
})

describe('useProjectStore - deleteProject', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    
    // Reset Zustand store state
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      documents: [],
      messages: [],
    })
  })

  it('successfully deletes a project via API and transitions active project', async () => {
    // Setup mock fetch for DELETE and side-effects
    const fetchMock = vi.fn().mockImplementation((url) => {
      if (url.includes('/projects/')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      }
      if (url.includes('/documents')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      if (url.includes('/chat/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        })
      }
      return Promise.resolve({ ok: false })
    })
    global.fetch = fetchMock

    // Set initial state
    const mockProjects = [
      { id: 'proj-1', name: 'Project 1' },
      { id: 'proj-2', name: 'Project 2' }
    ]
    useProjectStore.setState({
      projects: mockProjects,
      activeProject: mockProjects[0],
    })

    // Setup local storage items to verify deletion
    localStorage.setItem('docs_proj-1', JSON.stringify([{ id: 'doc-1' }]))
    localStorage.setItem('msgs_proj-1', JSON.stringify([{ id: 'msg-1' }]))

    // Call deleteProject
    await getStore().deleteProject('proj-1')

    // Verify API call
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/projects/proj-1'),
      expect.objectContaining({ method: 'DELETE' })
    )

    // Verify projects are updated
    expect(getStore().projects).toHaveLength(1)
    expect(getStore().projects[0].id).toBe('proj-2')

    // Verify active project transitioned
    expect(getStore().activeProject.id).toBe('proj-2')

    // Verify local storage was cleaned up
    expect(localStorage.getItem('docs_proj-1')).toBeNull()
    expect(localStorage.getItem('msgs_proj-1')).toBeNull()
  })

  it('fails to delete a project on API failure', async () => {
    // Setup mock fetch that fails
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ message: 'Delete forbidden' })
    })
    global.fetch = fetchMock

    const mockProjects = [
      { id: 'proj-1', name: 'Mock Project' }
    ]
    useProjectStore.setState({
      projects: mockProjects,
      activeProject: mockProjects[0],
    })

    // Call deleteProject and expect it to throw
    await expect(getStore().deleteProject('proj-1')).rejects.toThrow('Delete forbidden')

    // Verify state is not cleaned up (retained on API failure)
    expect(getStore().projects).toHaveLength(1)
    expect(getStore().activeProject.id).toBe('proj-1')
  })
})

describe('useProjectStore - fetchDocuments & deleteDocument', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    
    useProjectStore.setState({
      projects: [],
      activeProject: null,
      documents: [],
      messages: [],
    })
  })

  it('successfully fetches documents via API', async () => {
    const mockDocs = [{ id: 'doc-1', fileName: 'test.pdf', status: 'READY' }]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockDocs),
    })
    global.fetch = fetchMock

    await getStore().fetchDocuments('proj-1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/documents?projectId=proj-1'),
      expect.anything()
    )
    expect(getStore().documents).toHaveLength(1)
    expect(getStore().documents[0].filename).toBe('test.pdf')
    expect(localStorage.getItem('docs_proj-1')).toContain('test.pdf')
  })

  it('successfully deletes a document via API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
    })
    global.fetch = fetchMock

    useProjectStore.setState({
      activeProject: { id: 'proj-1' },
      documents: [{ id: 'doc-1', filename: 'test.pdf', status: 'READY' }]
    })
    localStorage.setItem('docs_proj-1', JSON.stringify([{ id: 'doc-1' }]))

    await getStore().deleteDocument('doc-1')

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/documents/doc-1'),
      expect.objectContaining({ method: 'DELETE' })
    )
    expect(getStore().documents).toHaveLength(0)
    expect(JSON.parse(localStorage.getItem('docs_proj-1'))).toHaveLength(0)
  })
})
