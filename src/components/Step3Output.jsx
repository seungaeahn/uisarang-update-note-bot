import { useState } from 'react'
import { generateClaudePrompt, generateGitBookMarkdown } from '../utils/generator.js'

export default function Step3Output({ version, date, tickets, onBack }) {
  const [copiedPrompt, setCopiedPrompt] = useState(false)
  const [previewMode, setPreviewMode] = useState(null) // 'prompt' | 'markdown' | null

  const handleCopyPrompt = async () => {
    const prompt = generateClaudePrompt(version, date, tickets)
    try {
      await navigator.clipboard.writeText(prompt)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    } catch {
      // fallback
      const el = document.createElement('textarea')
      el.value = prompt
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopiedPrompt(true)
      setTimeout(() => setCopiedPrompt(false), 2000)
    }
  }

  const handleDownloadMarkdown = () => {
    const md = generateGitBookMarkdown(version, date, tickets)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeVersion = version.replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim() || '업데이트노트'
    a.download = `${safeVersion}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Category counts
  const newCount = tickets.filter(t => t.category === '새로운 기능').length
  const improvedCount = tickets.filter(t => t.category === '개선된 기능').length
  const bugCount = tickets.filter(t => t.category === '오류 수정사항').length

  const previewContent =
    previewMode === 'prompt'
      ? generateClaudePrompt(version, date, tickets)
      : previewMode === 'markdown'
      ? generateGitBookMarkdown(version, date, tickets)
      : ''

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">최종 출력 요약</h2>
        <div className="flex gap-6 flex-wrap">
          <StatItem label="버전" value={version || '(미입력)'} />
          <StatItem label="날짜" value={date || '(미입력)'} />
          <StatItem label="총 항목" value={`${tickets.length}건`} />
          <StatItem label="새로운 기능" value={`${newCount}건`} color="text-emerald-700" />
          <StatItem label="개선된 기능" value={`${improvedCount}건`} color="text-sky-700" />
          <StatItem label="오류 수정사항" value={`${bugCount}건`} color="text-orange-700" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Claude Prompt */}
        <div className="bg-white rounded-xl border border-blue-200 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">Claude 프롬프트 복사</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                필터링된 티켓 목록과 작성 지시문을 클립보드에 복사해요.
                Claude에 붙여넣으면 바로 업데이트 노트를 작성해줘요.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyPrompt}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                copiedPrompt
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-800 hover:bg-blue-700 text-white'
              }`}
            >
              {copiedPrompt ? '✓ 복사 완료!' : '클립보드에 복사'}
            </button>
            <button
              onClick={() => setPreviewMode(previewMode === 'prompt' ? null : 'prompt')}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {previewMode === 'prompt' ? '접기' : '미리보기'}
            </button>
          </div>
        </div>

        {/* GitBook Markdown */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">📄</span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">GitBook 초안 다운로드</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                GitBook 구조에 맞는 마크다운 스켈레톤을 .md 파일로 저장해요.
                핵심 업데이트, 새로운 기능, 오류 수정 섹션이 포함돼요.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className="flex-1 py-2 rounded-lg text-sm font-medium bg-purple-700 hover:bg-purple-600 text-white transition-colors"
            >
              .md 파일 다운로드
            </button>
            <button
              onClick={() => setPreviewMode(previewMode === 'markdown' ? null : 'markdown')}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              {previewMode === 'markdown' ? '접기' : '미리보기'}
            </button>
          </div>
        </div>
      </div>

      {/* Preview panel */}
      {previewMode && (
        <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
            <span className="text-xs font-medium text-gray-400">
              {previewMode === 'prompt' ? 'Claude 프롬프트 미리보기' : 'GitBook 마크다운 미리보기'}
            </span>
            <button
              onClick={() => setPreviewMode(null)}
              className="text-gray-500 hover:text-gray-300 text-sm"
            >
              ✕
            </button>
          </div>
          <pre className="p-4 text-xs text-gray-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap scrollbar-thin">
            {previewContent}
          </pre>
        </div>
      )}

      {/* Ticket list */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-700">출력 대상 티켓 ({tickets.length}건)</h3>
        </div>
        <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto scrollbar-thin">
          {tickets.map(t => (
            <div key={t.uid} className="flex items-center gap-3 px-5 py-2.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                t.category === '새로운 기능' ? 'bg-emerald-100 text-emerald-700' :
                t.category === '개선된 기능' ? 'bg-sky-100 text-sky-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {t.category}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {t.module}
              </span>
              <span className="flex-1 text-sm text-gray-700 truncate">
                <span className="text-gray-400 mr-1">#{t.ticketId}</span>
                {t.merged
                  ? t.mergedTickets.map(x => x.description).join(' / ')
                  : t.description}
              </span>
              {t.merged && (
                <span className="shrink-0 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                  병합됨
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Back */}
      <div className="flex justify-start">
        <button
          onClick={onBack}
          className="px-5 py-2.5 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← 분석으로 돌아가기
        </button>
      </div>
    </div>
  )
}

function StatItem({ label, value, color = 'text-gray-800' }) {
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-sm font-semibold ${color}`}>{value}</div>
    </div>
  )
}
