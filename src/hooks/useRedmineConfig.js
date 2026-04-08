import { useState, useEffect } from 'react'

const STORAGE_KEY = 'uisarang-redmine-config-v1'

function getDefaults() {
  return {
    url: import.meta.env.VITE_REDMINE_URL || 'https://redmine.ubware.com',
    apiKey: '',
    projectId: import.meta.env.VITE_REDMINE_PROJECT || 'ysr',
    parentKeyword: '■ 업데이트 목록',
  }
}

export function useRedmineConfig() {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...getDefaults(), ...JSON.parse(stored) } : getDefaults()
    } catch {
      return getDefaults()
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
  }, [config])

  return { config, setConfig }
}
