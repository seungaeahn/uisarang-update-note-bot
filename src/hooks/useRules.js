import { useState, useEffect } from 'react'
import { DEFAULT_RULES } from '../utils/defaultRules.js'

const STORAGE_KEY = 'uisarang-rules-v1'

export function useRules() {
  const [rules, setRules] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) return { ...DEFAULT_RULES, ...JSON.parse(stored) }
    } catch {}
    return { ...DEFAULT_RULES }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
  }, [rules])

  const updateGroup = (key, items) =>
    setRules(prev => ({ ...prev, [key]: items }))

  const reset = () => setRules({ ...DEFAULT_RULES })

  const exportRules = () => {
    const blob = new Blob([JSON.stringify(rules, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'uisarang-rules.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importRules = file =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => {
        try {
          const data = JSON.parse(e.target.result)
          setRules({ ...DEFAULT_RULES, ...data })
          resolve()
        } catch {
          reject(new Error('올바른 JSON 파일이 아니에요.'))
        }
      }
      reader.readAsText(file)
    })

  return { rules, updateGroup, reset, exportRules, importRules }
}
