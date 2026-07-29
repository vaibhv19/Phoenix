import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import ChatContainer from '../../components/Chat/ChatContainer'
import { useProjectStore } from '../../store/useProjectStore'

// Mock framer-motion to simplify rendering and avoid JSDOM animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => (
      <div ref={ref} {...props}>{children}</div>
    )),
    span: React.forwardRef(({ children, ...props }, ref) => (
      <span ref={ref} {...props}>{children}</span>
    )),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}))

// Mock the useProjectStore zustand store hook
vi.mock('../../store/useProjectStore', () => ({
  useProjectStore: vi.fn(),
}))

describe('ChatContainer Component tests', () => {
  const mockQueryRAG = vi.fn()
  const mockClearChat = vi.fn()

  const defaultStoreState = {
    activeProject: { id: 'proj-123', name: 'Phoenix Test App' },
    messages: [],
    documents: [{ id: 'doc-1', filename: 'doc.pdf', status: 'READY', chunkCount: 10 }],
    queryRAG: mockQueryRAG,
    isQuerying: false,
    clearChat: mockClearChat,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    useProjectStore.mockImplementation((selector) => {
      // Simple selector implementation
      if (typeof selector === 'function') {
        return selector(defaultStoreState)
      }
      return defaultStoreState
    })
  })

  it('renders no active project message if no project is active', () => {
    useProjectStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, activeProject: null }
      return selector ? selector(state) : state
    })

    render(<ChatContainer />)

    expect(screen.getByText('Initialize Investigation Workspace')).toBeInTheDocument()
    expect(screen.getByText(/Phoenix is an engineering environment/)).toBeInTheDocument()
  })

  it('renders suggestions and input on initial load with no messages', () => {
    render(<ChatContainer />)

    expect(screen.getByText('Phoenix Test App')).toBeInTheDocument()
    expect(screen.getByText('Workspace')).toBeInTheDocument()
    expect(screen.getByText('Engine')).toBeInTheDocument()
    expect(screen.getByText('Verify replica configuration in deployment.yaml')).toBeInTheDocument()
    expect(screen.getByText('Optimize gateway rate limits rules')).toBeInTheDocument()
    expect(screen.getByText('Trace CORS configurations in WebConfig.java')).toBeInTheDocument()

    // Test suggestion button click
    const suggestionBtn = screen.getByText('Verify replica configuration in deployment.yaml').closest('button')
    fireEvent.click(suggestionBtn)
    expect(mockQueryRAG).toHaveBeenCalledWith('Verify deployment.yaml replicas config')
  })

  it('submits query from the input text field', () => {
    render(<ChatContainer />)

    const input = screen.getByPlaceholderText('Search index or ask an engineering question...')
    const submitBtn = screen.getByRole('button', { name: 'Submit query' })

    fireEvent.change(input, { target: { value: 'How to configure postgres?' } })
    fireEvent.click(submitBtn)

    expect(mockQueryRAG).toHaveBeenCalledWith('How to configure postgres?')
  })

  it('renders chat messages list, badge, and citation matrix', () => {
    const messages = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'How to scale application?',
        timestamp: new Date().toISOString()
      },
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'You can scale by updating replication factor in deployment.yaml. See citation [1](#match-1).',
        confidenceScore: 0.95,
        reasoningTrace: [
          { state: 'INITIAL_RETRIEVAL', confidenceScore: 0.95, description: 'Found configuration files.' },
          { state: 'ANSWER_GENERATION', confidenceScore: 0.95, description: 'Synthesized reply.' }
        ],
        matches: [
          {
            id: 'match-1',
            content: 'spec:\n  replicas: 3',
            chunk_metadata: { source: 'deployment.yaml', page: 2 },
            score: 0.98
          }
        ],
        timestamp: new Date().toISOString()
      }
    ]

    useProjectStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, messages }
      return selector ? selector(state) : state
    })

    render(<ChatContainer />)

    // Verify messages
    expect(screen.getByText('How to scale application?')).toBeInTheDocument()
    expect(screen.getByText(/You can scale by updating replication factor/)).toBeInTheDocument()

    // Verify confidence score and console headers
    expect(screen.getByText(/95%/)).toBeInTheDocument() // Confidence level
    expect(screen.getByText('Clear Console')).toBeInTheDocument()

    // Verify citation matrix rendering
    expect(screen.getByText('Retrieved Evidence')).toBeInTheDocument()
    expect(screen.getByText('deployment.yaml')).toBeInTheDocument()
    expect(screen.getByText('p. 2')).toBeInTheDocument()
    expect(screen.getByText(/replicas: 3/)).toBeInTheDocument()
  })

  it('renders the reasoning timeline trace in the inspector', () => {
    const messages = [
      {
        id: 'msg-2',
        sender: 'assistant',
        text: 'Response text',
        confidenceScore: 0.85,
        reasoningTrace: [
          { state: 'INITIAL_RETRIEVAL', confidenceScore: 0.85, description: 'Found matching document.' },
          { state: 'ANSWER_GENERATION', confidenceScore: 0.85, description: 'Synthesized reply.' }
        ],
        matches: [],
        timestamp: new Date().toISOString()
      }
    ]

    useProjectStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, messages }
      return selector ? selector(state) : state
    })

    render(<ChatContainer />)

    // Trace is rendered in the Inspector sidebar
    expect(screen.getByText('Execution Trace')).toBeInTheDocument()
    expect(screen.getByText('Found matching document.')).toBeInTheDocument()
  })

  it('triggers clearChat when clicking the clear button', () => {
    const messages = [
      {
        id: 'msg-1',
        sender: 'user',
        text: 'Hello',
        timestamp: new Date().toISOString()
      }
    ]

    useProjectStore.mockImplementation((selector) => {
      const state = { ...defaultStoreState, messages }
      return selector ? selector(state) : state
    })

    render(<ChatContainer />)

    const clearBtn = screen.getByText('Clear Console')
    fireEvent.click(clearBtn)

    expect(mockClearChat).toHaveBeenCalled()
  })
})
