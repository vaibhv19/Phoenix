import React, { useState } from 'react'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import ConfidenceBadge from '../Shared/ConfidenceBadge'
import ReasoningTimeline from './ReasoningTimeline'

export default function MessageBubble({ message, onSelect }) {
  const isUser = message.sender === 'user'
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  const markdownComponents = {
    a: ({ href, children }) => {
      if (href?.startsWith('#')) {
        const matchId = href.substring(1)
        return (
          <a 
            href={href}
            onClick={(e) => {
              e.preventDefault()
              onSelect() // Select the message to load its citations in the sidebar
              setTimeout(() => {
                const element = document.getElementById(`citation-card-${matchId}`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  element.classList.add('animate-pulse-highlight')
                  setTimeout(() => {
                    element.classList.remove('animate-pulse-highlight')
                  }, 2000)
                }
              }, 100)
            }}
            className="text-blue-400 hover:text-blue-300 font-semibold underline underline-offset-2 cursor-pointer font-mono text-[11px] bg-blue-500/10 border border-blue-500/20 px-1 py-0.5 rounded"
          >
            {children}
          </a>
        )
      }
      return <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">{children}</a>
    }
  }

  return (
    <div 
      onClick={onSelect}
      className={`flex flex-col space-y-2 cursor-pointer max-w-3xl p-4 rounded-2xl transition duration-200 hover:bg-[#1E293B]/20 ${isUser ? 'align-self-end bg-[#1E293B]/40 ml-auto border border-gray-800' : 'bg-transparent mr-auto'}`}
    >
      <div className="flex items-center space-x-2">
        {!isUser && (
          <div className="h-6 w-6 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
            AI
          </div>
        )}
        <span className="text-xs font-semibold text-gray-400">
          {isUser ? 'You' : 'Phoenix Retrieval Assistant'}
        </span>
        {!isUser && message.confidenceScore !== undefined && (
          <ConfidenceBadge score={message.confidenceScore} />
        )}
      </div>

      <div className="text-sm text-gray-200 leading-relaxed break-words markdown-container">
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <ReactMarkdown components={markdownComponents}>
            {message.text}
          </ReactMarkdown>
        )}
      </div>

      {!isUser && message.reasoningTrace && message.reasoningTrace.length > 0 && (
        <div className="pt-2">
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setIsTimelineOpen(!isTimelineOpen)
            }}
            className="flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-semibold transition"
          >
            <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${isTimelineOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
            <span>{isTimelineOpen ? 'Hide Retrieval Trace' : 'View Retrieval Trace'}</span>
          </button>

          <motion.div
            initial={false}
            animate={{ height: isTimelineOpen ? 'auto' : 0, opacity: isTimelineOpen ? 1 : 0 }}
            className="overflow-hidden"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            <div className="pt-3">
              <ReasoningTimeline steps={message.reasoningTrace} />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
