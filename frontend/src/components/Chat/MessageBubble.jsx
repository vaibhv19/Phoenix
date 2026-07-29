import React from 'react'
import ReactMarkdown from 'react-markdown'

export default function MessageBubble({ message, onSelect, isActive }) {
  const isUser = message.sender === 'user'

  const markdownComponents = {
    a: ({ href, children }) => {
      if (href?.startsWith('#')) {
        const matchId = href.substring(1)
        return (
          <a 
            href={href}
            onClick={(e) => {
              e.preventDefault()
              onSelect() // Select the message to load its citations/trace in the sidebar
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
      className={`flex flex-col space-y-2 cursor-pointer max-w-2xl p-3.5 rounded border transition duration-150 ${
        isUser 
          ? 'align-self-end bg-[#161618] ml-auto border-zinc-800' 
          : isActive 
            ? 'bg-zinc-900/15 border-zinc-850 mr-auto'
            : 'bg-transparent mr-auto border-transparent hover:bg-zinc-900/10'
      }`}
    >
      <div className="flex items-center space-x-2">
        {!isUser && (
          <div className="h-5 w-5 rounded border border-zinc-700 bg-zinc-800 flex items-center justify-center font-bold text-[9px] text-zinc-350 select-none">
            AI
          </div>
        )}
        <span className="text-[11px] font-semibold text-zinc-400 select-none">
          {isUser ? 'You' : 'Phoenix Retrieval Assistant'}
        </span>
      </div>

      <div className="text-[13px] text-zinc-200 leading-relaxed break-words markdown-container">
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.text}</p>
        ) : (
          <ReactMarkdown components={markdownComponents}>
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
