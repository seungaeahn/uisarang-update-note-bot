import { useState, useMemo, useEffect, useCallback } from 'react'
import { parseTickets } from '../utils/parser.js'
import { filterTickets, getDefaultCategory } from '../utils/filter.js'
import { detectMergeGroups } from '../utils/merger.js'
import { generateClaudePrompt, generateGitBookMarkdown } from '../utils/generator.js'
import { fetchVersions, fetchTicketsForVersion, issueToTicket } from '../utils/redmineApi.js'
import Step2Analysis from './Step2Analysis.jsx'

export default function NoteTab({ rules, redmineConfig }) {
  // ── Input ──────────────────────────────────
  const [version, setVersion] = useState('')
  const [date, setDate] = useState('')
  const [rawText, setRawText] = useState('')
  const [inputMode, setInputMode] = useState('redmine') // 'redmine' | 'paste'

  // ── Redmine fetch state ────────────────────
  const [versions, setVersions] = useState([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [versionsError, setVersionsError] = useState(null)
  const [selectedVersionId, setSelectedVersionId] = useState('')
  const [fetchingIssues, setFetchingIssues] = useState(false)
  const [fetchProgress, setFetchProgress] = useState(null) // { label, current, total }
  const [fetchError, setFetchError] = useState(null)

  // ── Analysis ───────────────────────────────
  const [analyzed, setAnalyzed] = useState(false)
  const [allTickets, setAllTickets] = useState([])
  const [ruleExcluded, setRuleExcluded] = useState({})
  const [mergeGroups, setMergeGroups] = useState([])

  // ── User state ─────────────────────────────
  const [overrides, setOverrides] = useState({})
  const [categories, setCategories] = useState({})
  const [selectedMerges, setSelectedMerges] = useState({})

  // ── Output ────────────────────────────────
  const [promptCopied, setPromptCopied] = useState(false)
  const [mdCopied, setMdCopied] = useState(false)
  const [promptPreview, setPromptPreview] = useState(false)

  // ── Load versions on mount / mode switch ───
  const loadVersions = useCallback(async () => {
    if (!redmineConfig?.apiKey || !redmineConfig?.projectId) return
    setVersionsLoading(true)
    setVersionsError(null)
    try {
      const vers = await fetchVersions(redmineConfig)
      setVersions(vers)
      if (vers.length > 0) setSelectedVersionId(String(vers[0].id))
    } catch (e) {
      setVersionsError(e.message)
    } finally {
      setVersionsLoading(false)
    }
  }, [redmineConfig])

  useEffect(() => {
    if (inputMode === 'redmine') loadVersions()
  }, [inputMode, loadVersions])

  // ── Derived ────────────────────────────────
  const detectedCount = useMemo(
    () => rawText.split('\n').filter(l => /^\*\s+(Defect|Feature|Common)/i.test(l.trim())).length,
    [rawText],
  )

  const effectiveIncluded = useMemo(
    () => allTickets.filter(t => {
      const ov = overrides[t.uid]
      if (ov === 'include') return true
      if (ov === 'exclude') return false
      return !ruleExcluded[t.uid]
    }),
    [allTickets, overrides, ruleExcluded],
  )

  const effectiveExcluded = useMemo(
    () => allTickets.filter(t => {
      const ov = overrides[t.uid]
      if (ov === 'include') return false
      if (ov === 'exclude') return true
      return !!ruleExcluded[t.uid]
    }),
    [allTickets, overrides, ruleExcluded],
  )

  const outputTickets = useMemo(() => {
    const mergedUids = new Set()
    const mergedEntries = []

    for (const group of mergeGroups) {
      if (!selectedMerges[group.id]) continue
      const active = group.tickets.filter(t => effectiveIncluded.some(et => et.uid === t.uid))
      if (active.length < 2) continue
      active.forEach(t => mergedUids.add(t.uid))
      const first = active[0]
      mergedEntries.push({
        uid: group.id,
        ticketId: active.map(t => t.ticketId).join(', '),
        type: first.type,
        module: group.module,
        description: active.map(t => t.description).join(' / '),
        notes: '',
        merged: true,
        mergedTickets: active,
        category: categories[first.uid] || getDefaultCategory(first, rules),
      })
    }

    const singles = effectiveIncluded
      .filter(t => !mergedUids.has(t.uid))
      .map(t => ({ ...t, category: categories[t.uid] || getDefaultCategory(t, rules) }))

    return [...singles, ...mergedEntries]
  }, [effectiveIncluded, mergeGroups, selectedMerges, categories, rules])

  // ── Core analysis function ─────────────────
  const analyzeTickets = useCallback((parsed) => {
    const { included, excluded } = filterTickets(parsed, rules)
    const exMap = {}
    excluded.forEach(t => { exMap[t.uid] = t.exclusionReason })
    const defCats = {}
    parsed.forEach(t => { defCats[t.uid] = getDefaultCategory(t, rules) })
    const merges = detectMergeGroups(included)
    const defMerges = {}
    merges.forEach(g => { defMerges[g.id] = true })

    setAllTickets(parsed)
    setRuleExcluded(exMap)
    setCategories(defCats)
    setMergeGroups(merges)
    setSelectedMerges(defMerges)
    setOverrides({})
    setAnalyzed(true)
    setResultTab('included')
  }, [rules])

  // ── Handlers ───────────────────────────────
  const handleAnalyzeFromText = () => {
    const parsed = parseTickets(rawText)
    analyzeTickets(parsed)
  }

  const handleFetchFromRedmine = async () => {
    if (!selectedVersionId) return
    setFetchingIssues(true)
    setFetchError(null)
    setFetchProgress({ label: '수집 중...', current: 0, total: null })

    try {
      const issues = await fetchTicketsForVersion(
        redmineConfig,
        selectedVersionId,
        (labelOrCurrent, total) => {
          if (typeof labelOrCurrent === 'string') {
            setFetchProgress({ label: labelOrCurrent, current: null, total: null })
          } else {
            setFetchProgress({ label: '수집 중', current: labelOrCurrent, total })
          }
        }
      )

      const tickets = issues.map((issue, i) => issueToTicket(issue, i + 1))

      // Auto-fill version name from selected version
      const selectedVer = versions.find(v => String(v.id) === selectedVersionId)
      if (selectedVer && !version) {
        setVersion(`의사랑 ${selectedVer.name}`)
      }

      analyzeTickets(tickets)
    } catch (e) {
      setFetchError(e.message)
    } finally {
      setFetchingIssues(false)
      setFetchProgress(null)
    }
  }

  const toggleTicket = uid => {
    const isIncluded = effectiveIncluded.some(t => t.uid === uid)
    const ruleIncludes = !ruleExcluded[uid]
    setOverrides(prev => {
      const next = { ...prev }
      if (isIncluded) {
        ruleIncludes ? (next[uid] = 'exclude') : delete next[uid]
      } else {
        !ruleIncludes ? (next[uid] = 'include') : delete next[uid]
      }
      return next
    })
  }

  const getExclusionReason = uid => {
    if (overrides[uid] === 'exclude') return '사용자 제외'
    return ruleExcluded[uid] || ''
  }

  const handleCopyPrompt = async () => {
    const prompt = generateClaudePrompt(version, date, outputTickets)
    try { await navigator.clipboard.writeText(prompt) } catch {
      const el = document.createElement('textarea')
      el.value = prompt
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setPromptCopied(true)
    setTimeout(() => setPromptCopied(false), 2000)
  }

  const handleDownloadMd = () => {
    const md = generateGitBookMarkdown(version, date, outputTickets)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(version || '업데이트노트').replace(/[^\uAC00-\uD7A3a-zA-Z0-9\s]/g, '').trim()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopySkeletonMd = async () => {
    const md = generateGitBookMarkdown(version, date, outputTickets)
    try { await navigator.clipboard.writeText(md) } catch {
      const el = document.createElement('textarea')
      el.value = md
      document.body.appendChild(el); el.select(); document.execCommand('copy'); document.body.removeChild(el)
    }
    setMdCopied(true)
    setTimeout(() => setMdCopied(false), 2000)
  }

  // ── Render ─────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Version info ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">버전 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">버전명</label>
            <input
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="예: 의사랑 2026년 비정기 5차"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업데이트 날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Input mode card ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-5 w-fit">
          <ModeBtn
            label="🔗 Redmine에서 가져오기"
            active={inputMode === 'redmine'}
            onClick={() => setInputMode('redmine')}
          />
          <ModeBtn
            label="📋 직접 붙여넣기"
            active={inputMode === 'paste'}
            onClick={() => setInputMode('paste')}
          />
        </div>

        {inputMode === 'redmine' ? (
          /* ── Redmine mode ── */
          <div className="space-y-4">
            {!redmineConfig?.apiKey ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                ⚙️ 레드마인 API 설정이 필요해요. <strong>규칙 관리 탭</strong>의 "레드마인 연동" 섹션에서 설정해 주세요.
              </div>
            ) : (
              <>
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      로드맵 버전 선택
                    </label>
                    {versionsLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-2">
                        <span className="animate-spin inline-block">⏳</span> 버전 목록 불러오는 중...
                      </div>
                    ) : versionsError ? (
                      <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        ⚠️ {versionsError}
                      </div>
                    ) : (
                      <select
                        value={selectedVersionId}
                        onChange={e => setSelectedVersionId(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        {versions.length === 0 && <option value="">버전 없음</option>}
                        {versions.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.name} {v.status === 'open' ? '🟢' : v.status === 'locked' ? '🔒' : '✅'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <button
                    onClick={loadVersions}
                    disabled={versionsLoading}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
                    title="버전 목록 새로고침"
                  >
                    🔄
                  </button>
                </div>

                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  💡 버전 안에 <strong>업데이트개발대상일감</strong> 상위 이슈가 있으면 그 하위 일감을 자동으로 수집해요.
                </div>

                {fetchError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    ⚠️ {fetchError}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleFetchFromRedmine}
                    disabled={fetchingIssues || !selectedVersionId || versionsLoading}
                    className="bg-blue-800 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm flex items-center gap-2"
                  >
                    {fetchingIssues ? (
                      <>
                        <span className="animate-spin inline-block">⏳</span>
                        {fetchProgress
                          ? typeof fetchProgress.label === 'string' && fetchProgress.current === null
                            ? fetchProgress.label
                            : `${fetchProgress.current} / ${fetchProgress.total ?? '?'}건 수집 중...`
                          : '수집 중...'}
                      </>
                    ) : (
                      '티켓 가져오기 →'
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ── Paste mode ── */
          <div>
            <div className="flex items-end justify-between mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">레드마인 티켓 목록</label>
                <p className="text-xs text-gray-400 mt-0.5">
                  형식:{' '}
                  <code className="bg-gray-100 px-1 rounded">* Defect #1234: [모듈명] 설명 - 비고</code>
                </p>
              </div>
              {detectedCount > 0 && (
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-medium">
                  {detectedCount}개 감지
                </span>
              )}
            </div>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              rows={10}
              placeholder={`* Defect #1001: [진료실] 처방전 출력 시 오류 발생 - 개별대응\n* Feature #1002: [보험청구] DRG 점검표 기능 추가\n* Common #1003: [외래접수실] 알림톡 발송 기능 개선`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mt-2 text-gray-800 placeholder-gray-400"
            />
            <div className="flex justify-end mt-3">
              <button
                onClick={handleAnalyzeFromText}
                disabled={detectedCount === 0}
                className="bg-blue-800 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
              >
                티켓 분석하기 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Analysis results ── */}
      {analyzed && (
        <>
          <Step2Analysis
            includedTickets={effectiveIncluded}
            excludedTickets={effectiveExcluded.map(t => ({ ...t, exclusionReason: getExclusionReason(t.uid) }))}
            mergeGroups={mergeGroups}
            categories={categories}
            selectedMerges={selectedMerges}
            onCategoryChange={(uid, cat) => setCategories(prev => ({ ...prev, [uid]: cat }))}
            onMergeToggle={id => setSelectedMerges(prev => ({ ...prev, [id]: !prev[id] }))}
            onTicketToggle={toggleTicket}
          />

          {/* ── Output ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">출력</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                출력 대상 {outputTickets.length}건 ·{' '}
                새로운 기능 {outputTickets.filter(t => t.category === '새로운 기능').length} /{' '}
                개선된 기능 {outputTickets.filter(t => t.category === '개선된 기능').length} /{' '}
                오류 수정사항 {outputTickets.filter(t => t.category === '오류 수정사항').length}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleCopyPrompt}
                disabled={outputTickets.length === 0}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed ${
                  promptCopied ? 'bg-green-600 text-white' : 'bg-blue-800 hover:bg-blue-700 text-white'
                }`}
              >
                {promptCopied ? '✓ 복사 완료!' : '🤖 Claude 프롬프트 복사'}
              </button>
              <button
                onClick={() => setPromptPreview(v => !v)}
                disabled={outputTickets.length === 0}
                className="px-4 py-2.5 rounded-lg font-medium text-sm border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {promptPreview ? '접기' : '미리보기'}
              </button>
              <button
                onClick={handleCopySkeletonMd}
                disabled={outputTickets.length === 0}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border disabled:opacity-40 disabled:cursor-not-allowed ${
                  mdCopied ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mdCopied ? '✓ 복사 완료!' : '📄 GitBook 초안 복사'}
              </button>
              <button
                onClick={handleDownloadMd}
                disabled={outputTickets.length === 0}
                className="px-6 py-2.5 rounded-lg font-medium text-sm transition-colors border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                💾 초안 다운로드
              </button>
            </div>
            {promptPreview && (
              <div className="bg-gray-900 rounded-xl border border-gray-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                  <span className="text-xs font-medium text-gray-400">Claude 프롬프트 미리보기</span>
                  <button
                    onClick={() => setPromptPreview(false)}
                    className="text-gray-500 hover:text-gray-300 text-sm"
                  >
                    ✕
                  </button>
                </div>
                <pre className="p-4 text-xs text-gray-300 font-mono overflow-auto max-h-96 whitespace-pre-wrap">
                  {generateClaudePrompt(version, date, outputTickets)}
                </pre>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function ModeBtn({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        active ? 'bg-white text-blue-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {label}
    </button>
  )
}
