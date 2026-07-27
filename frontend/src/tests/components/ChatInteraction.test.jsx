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

    expect(screen.getByText('No Active Project Selected')).toBeInTheDocument()
    expect(screen.getByText(/Please create or select a project/)).toBeInTheDocument()
  })

  it('renders suggestions and input on initial load with no messages', () => {
    render(<ChatContainer />)

    expect(screen.getByText('Phoenix Test App')).toBeInTheDocument()
    expect(screen.getByText('Start a RAG Conversation')).toBeInTheDocument()
    expect(screen.getByText('Deployment Replicas')).toBeInTheDocument()
    expect(screen.getByText('Gateway Limits')).toBeInTheDocument()
    expect(screen.getByText('Web CORS Settings')).toBeInTheDocument()
    expect(screen.getByText('Irrelevant Query')).toBeInTheDocument()

    // Test suggestion button click
    const suggestionBtn = screen.getByText('Deployment Replicas').closest('button')
    fireEvent.click(suggestionBtn)
    expect(mockQueryRAG).toHaveBeenCalledWith('Verify deployment.yaml replicas config')
  })

  it('submits query from the input text field', () => {
    render(<ChatContainer />)

    const input = screen.getByPlaceholderText('Ask a technical question...')
    const submitBtn = screen.getByRole('button', { name: '' }) // Right side SVG button

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

    // Verify confidence badge and console headers
    expect(screen.getByText(/95%/)).toBeInTheDocument() // Confidence level
    expect(screen.getByText('Clear Console')).toBeInTheDocument()

    // Verify citation matrix rendering
    expect(screen.getByText('Source Citations Matrix')).toBeInTheDocument()
    expect(screen.getByText('deployment.yaml')).toBeInTheDocument()
    expect(screen.getByText('p. 2')).toBeInTheDocument()
    expect(screen.getByText(/replicas: 3/)).toBeInTheDocument()
  })

  it('collapses and expands the reasoning timeline trace', async () => {
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

    // Initially, toggle button is 'View Retrieval Trace'
    const toggleBtn = screen.getByText('View Retrieval Trace')
    expect(screen.getByText('Retrieval Logic Execution Trace')).toBeInTheDocument() // rendered in DOM but hidden via style height in real browser

    // Click to toggle
    fireEvent.click(toggleBtn)

    // Button updates to 'Hide Retrieval Trace'
    expect(screen.getByText('Hide Retrieval Trace')).toBeInTheDocument()
    expect(screen.getByText('Found matching document.')).toBeInTheDocument()

    // Collapse trace again
    fireEvent.click(screen.getByText('Hide Retrieval Trace'))
    // React state toggle should update wording back to 'View Retrieval Trace'
    expect(screen.getByText('View Retrieval Trace')).toBeInTheDocument()
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
