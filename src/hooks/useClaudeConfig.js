import { useState, useEffect } from 'react'

const STORAGE_KEY = 'uisarang-claude-config-v1'

export function useClaudeConfig() {
  const [claudeApiKey, setClaudeApiKey] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored).apiKey || '' : (import.meta.env.VITE_CLAUDE_KEY || '')
    } catch {
      return import.meta.env.VITE_CLAUDE_KEY || ''
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiKey: claudeApiKey }))
  }, [claudeApiKey])

  return { claudeApiKey, setClaudeApiKey }
}
