import { useState, useRef } from 'react'
import RuleGroupEditor from './RuleGroupEditor.jsx'
import { fetchVersions } from '../utils/redmineApi.js'

const EXCLUDE_GROUPS = [
  {
    key: 'notesKeywords',
    title: '비고 키워드 제외',
    description: '티켓 비고란에 이 키워드가 있으면 자동으로 제외해요.',
  },
  {
    key: 'moduleKeywords',
    title: '내부 모듈명 제외',
    description: '모듈명 [대괄호] 안에 이 값이 포함되면 자동으로 제외해요.',
  },
  {
    key: 'descriptionKeywords',
    title: '설명 키워드 제외',
    description: '티켓 설명 또는 비고에 이 텍스트가 포함되면 자동으로 제외해요.',
  },
]

const CLASSIFICATION_GROUPS = [
  {
    key: 'newFeatureKeywords',
    title: '새로운 기능 키워드',
    description: 'Feature 티켓 설명에 이 키워드가 있으면 "새로운 기능"으로 분류해요.',
    tagColor: 'emerald',
  },
  {
    key: 'improvedKeywords',
    title: '개선된 기능 키워드',
    description: 'Feature 티켓 설명에 이 키워드가 있으면 "개선된 기능"으로 분류해요. (우선순위 높음)',
    tagColor: 'sky',
  },
]

export default function RulesTab({
  rules,
  onUpdateGroup,
  onReset,
  onExport,
  onImport,
  redmineConfig,
  onRedmineConfigChange,
  claudeApiKey,
  onClaudeApiKeyChange,
}) {
  const fileRef = useRef()
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [resetStep, setResetStep] = useState(0) // 0: default, 1: confirm

  // Redmine config local editing state
  const [localConfig, setLocalConfig] = useState({
    url: redmineConfig?.url || '',
    apiKey: redmineConfig?.apiKey || '',
    projectId: redmineConfig?.projectId || '',
    parentKeyword: redmineConfig?.parentKeyword ?? '■ 업데이트 목록',
  })
  const [testStatus, setTestStatus] = useState(null) // null | 'loading' | 'success' | 'error'
  const [testMessage, setTestMessage] = useState('')
  const [configDirty, setConfigDirty] = useState(false)

  const handleFileChange = async e => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await onImport(file)
      setImportError(null)
      setImportSuccess(true)
      setTimeout(() => setImportSuccess(false), 2500)
    } catch (err) {
      setImportError(err.message)
    }
    e.target.value = ''
  }

  const handleResetClick = () => {
    if (resetStep === 1) {
      onReset()
      setResetStep(0)
    } else {
      setResetStep(1)
      setTimeout(() => setResetStep(0), 3500)
    }
  }

  const handleLocalConfigChange = (key, value) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
    setConfigDirty(true)
    setTestStatus(null)
  }

  const handleSaveConfig = () => {
    onRedmineConfigChange(localConfig)
    setConfigDirty(false)
    setTestStatus(null)
  }

  const handleTestConnection = async () => {
    setTestStatus('loading')
    setTestMessage('')
    try {
      const configToTest = configDirty ? localConfig : redmineConfig
      const versions = await fetchVersions(configToTest)
      setTestStatus('success')
      setTestMessage(`연결 성공! 버전 ${versions.length}개를 확인했어요.`)
    } catch (e) {
      setTestStatus('error')
      setTestMessage(e.message)
    }
  }

  return (
    <div className="space-y-7">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">규칙 관리</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            모든 변경 사항은 브라우저에 자동 저장돼요.
            JSON으로 내보내서 팀원들과 공유할 수 있어요.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onExport}
            className="px-3.5 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            📤 규칙 내보내기
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="px-3.5 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            📥 규칙 가져오기
          </button>
          <button
            onClick={handleResetClick}
            className={`px-3.5 py-2 text-sm rounded-lg transition-colors font-medium ${
              resetStep === 1
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'border border-red-200 text-red-600 hover:bg-red-50'
            }`}
          >
            {resetStep === 1 ? '⚠️ 한 번 더 클릭하면 초기화' : '기본값으로 초기화'}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Feedback messages */}
      {importSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
          ✅ 규칙을 성공적으로 가져왔어요.
        </div>
      )}
      {importError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          <span>⚠️ {importError}</span>
          <button onClick={() => setImportError(null)} className="text-red-400 hover:text-red-600 ml-3">✕</button>
        </div>
      )}

      {/* ── Exclude rules ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">제외 규칙</h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="space-y-4">
          {EXCLUDE_GROUPS.map(g => (
            <RuleGroupEditor
              key={g.key}
              title={g.title}
              description={g.description}
              items={rules[g.key] || []}
              onChange={items => onUpdateGroup(g.key, items)}
            />
          ))}
        </div>
      </section>

      {/* ── Common type rule ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Common 유형 처리</h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Common 유형 자동 제외</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  DB 변경, 내부 구현 등 Common 유형 티켓을 기본으로 제외해요.
                  아래 포함 예외 키워드가 있으면 유지해요.
                </p>
              </div>
              <button
                onClick={() => onUpdateGroup('excludeCommonType', !rules.excludeCommonType)}
                className={`relative shrink-0 w-11 h-6 rounded-full transition-colors ${
                  rules.excludeCommonType ? 'bg-blue-700' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                  rules.excludeCommonType ? 'left-5' : 'left-0.5'
                }`} />
              </button>
            </div>
          </div>

          {rules.excludeCommonType && (
            <RuleGroupEditor
              title="Common 유형 포함 예외 키워드"
              description="Common 유형이라도 이 키워드가 설명에 있으면 포함해요."
              items={rules.commonTypeIncludeKeywords || []}
              onChange={items => onUpdateGroup('commonTypeIncludeKeywords', items)}
              tagColor="emerald"
            />
          )}
        </div>
      </section>

      {/* ── Classification rules ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">분류 규칙</h3>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">Feature 티켓 자동 분류에 사용</span>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-amber-700">
            <strong>분류 우선순위:</strong> Defect → 오류 수정사항 / Feature → 개선된 기능 키워드 먼저 확인 후, 없으면 새로운 기능 / Common → 개선된 기능
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CLASSIFICATION_GROUPS.map(g => (
            <RuleGroupEditor
              key={g.key}
              title={g.title}
              description={g.description}
              items={rules[g.key] || []}
              onChange={items => onUpdateGroup(g.key, items)}
              tagColor={g.tagColor}
            />
          ))}
        </div>
      </section>

      {/* ── Rule summary ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">현재 규칙 요약</h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 mb-1">Common 자동 제외</div>
            <div className={`text-sm font-bold px-2 py-1 rounded-md w-fit ${rules.excludeCommonType ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
              {rules.excludeCommonType ? 'ON' : 'OFF'}
            </div>
          </div>
          {[...EXCLUDE_GROUPS, ...CLASSIFICATION_GROUPS].map(g => (
            <div key={g.key}>
              <div className="text-xs font-medium text-gray-500 mb-1">{g.title}</div>
              <div className="text-2xl font-bold text-gray-800">{(rules[g.key] || []).length}개</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Claude API 설정 ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Claude API 설정</h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
          <p className="text-xs text-gray-500">
            노트 자동 생성에 사용해요. Anthropic Console에서 발급한 API 키를 입력하세요.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Claude API 키</label>
            <input
              type="password"
              value={claudeApiKey}
              onChange={e => onClaudeApiKeyChange(e.target.value)}
              placeholder="sk-ant-..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
            />
            <p className="text-xs text-gray-400 mt-1">
              console.anthropic.com → API Keys에서 확인할 수 있어요. 브라우저에만 저장돼요.
            </p>
          </div>
          {claudeApiKey && (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✅ API 키가 설정되어 있어요.
            </div>
          )}
        </div>
      </section>

      {/* ── Redmine 연동 설정 ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">레드마인 연동 설정</h3>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <p className="text-xs text-gray-500">
            설정값은 브라우저에 저장돼요. 팀원과 공유하지 않아도 각자 설정할 수 있어요.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">서버 URL</label>
              <input
                type="text"
                value={localConfig.url}
                onChange={e => handleLocalConfigChange('url', e.target.value)}
                placeholder="https://redmine.example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API 키</label>
              <input
                type="password"
                value={localConfig.apiKey}
                onChange={e => handleLocalConfigChange('apiKey', e.target.value)}
                placeholder="레드마인 개인 API 키를 입력해요"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">레드마인 → 내 계정 → API 액세스 키에서 확인할 수 있어요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">부모 이슈 키워드</label>
              <input
                type="text"
                value={localConfig.parentKeyword ?? '■ 업데이트 목록'}
                onChange={e => handleLocalConfigChange('parentKeyword', e.target.value)}
                placeholder="■ 업데이트 목록"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">이 텍스트가 제목에 포함된 이슈의 하위 일감을 수집해요.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">프로젝트 ID</label>
              <input
                type="text"
                value={localConfig.projectId}
                onChange={e => handleLocalConfigChange('projectId', e.target.value)}
                placeholder="예: my-project"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">레드마인 프로젝트 URL에서 확인할 수 있어요. (예: /projects/my-project)</p>
            </div>
          </div>

          {/* Test result message */}
          {testStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              ✅ {testMessage}
            </div>
          )}
          {testStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              ⚠️ {testMessage}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handleTestConnection}
              disabled={testStatus === 'loading' || (!localConfig.apiKey || !localConfig.projectId)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testStatus === 'loading' ? (
                <>
                  <span className="animate-spin inline-block">⏳</span>
                  연결 확인 중...
                </>
              ) : (
                '🔌 연결 테스트'
              )}
            </button>

            <button
              onClick={handleSaveConfig}
              disabled={!configDirty}
              className="px-5 py-2 text-sm bg-blue-800 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              설정 저장
            </button>
          </div>

          {configDirty && (
            <p className="text-xs text-amber-600">
              변경 사항이 있어요. "설정 저장"을 클릭해야 노트 작성 탭에 반영돼요.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
