import React from 'react'
import { motion } from 'framer-motion'

export default function ReasoningTimeline({ steps }) {
  if (!steps || steps.length === 0) return null

  const getStateConfig = (state) => {
    switch (state) {
      case 'INITIAL_RETRIEVAL':
        return { bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400', label: 'Initial Retrieval' }
      case 'FALLBACK_REWRITE':
        return { bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Query Rewrite' }
      case 'FALLBACK_RERANK':
      case 'RERANK_EVALUATION':
        return { bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400', label: 'Cross Rerank' }
      case 'FALLBACK_CLARIFY':
      case 'CLARIFICATION_GENERATION':
        return { bg: 'bg-red-500/10 border-red-500/30 text-red-400', label: 'Clarify Fallback' }
      case 'ANSWER_GENERATION':
        return { bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'Synthesis' }
      default:
        return { bg: 'bg-slate-700/50 border-slate-600/30 text-slate-400', label: 'Escalation' }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -15 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
  }

  return (
    <div className="p-4 bg-[#1E293B]/20 border border-gray-800 rounded-xl space-y-4">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Retrieval Logic Execution Trace
      </h4>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="relative border-l border-gray-800 pl-4 ml-2 space-y-5"
      >
        {steps.map((step, idx) => {
          const config = getStateConfig(step.state)
          return (
            <motion.div 
              key={idx} 
              variants={itemVariants}
              className="relative group"
            >
              <span className={`absolute -left-[26px] top-0.5 h-4.5 w-4.5 rounded-full border flex items-center justify-center text-[9px] font-bold ${config.bg}`}>
                {idx + 1}
              </span>

              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-200">{config.label}</span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    CS: {step.confidenceScore.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          )
        })}
      </motion.div>
    </div>
  )
}
