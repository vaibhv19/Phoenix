import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjectStore } from '../store/useProjectStore'

// Helper to get fresh store state
const getStore = () => useProjectStore.getState()

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
    // Setup mock fetch for DELETE
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
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

  it('deletes mock project on API failure', async () => {
    // Setup mock fetch that fails
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
    })
    global.fetch = fetchMock

    const mockProjects = [
      { id: 'proj-1', name: 'Mock Project' }
    ]
    useProjectStore.setState({
      projects: mockProjects,
      activeProject: mockProjects[0],
    })

    localStorage.setItem('mock_projects', JSON.stringify(mockProjects))
    localStorage.setItem('docs_proj-1', JSON.stringify([{ id: 'doc-1' }]))

    // Call deleteProject
    await getStore().deleteProject('proj-1')

    // Verify state cleaned up
    expect(getStore().projects).toHaveLength(0)
    expect(getStore().activeProject).toBeNull()
    expect(getStore().documents).toHaveLength(0)

    // Verify localStorage cleaned up
    const storedProjects = JSON.parse(localStorage.getItem('mock_projects'))
    expect(storedProjects).toHaveLength(0)
    expect(localStorage.getItem('docs_proj-1')).toBeNull()
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
