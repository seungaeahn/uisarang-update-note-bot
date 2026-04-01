/**
 * Redmine REST API utility.
 * Requests go through vite's dev proxy at /api/redmine → https://redmine.ubware.com
 */

export async function fetchVersions(config) {
  const { apiKey, projectId } = config
  let res
  try {
    res = await fetch(
      `/api/redmine/projects/${encodeURIComponent(projectId)}/versions.json`,
      { headers: { 'X-Redmine-API-Key': apiKey } }
    )
  } catch {
    throw new Error('서버에 연결할 수 없어요. 개발 서버(npm run dev)가 실행 중인지 확인해 주세요.')
  }
  if (res.status === 404) throw new Error(`프로젝트를 찾을 수 없어요 (HTTP 404). 프로젝트 ID를 확인해 주세요. 레드마인 URL의 /projects/[여기] 부분을 입력해야 해요.`)
  if (res.status === 401 || res.status === 403) throw new Error(`인증 실패 (HTTP ${res.status}). API 키가 올바른지 확인해 주세요.`)
  if (!res.ok) throw new Error(`버전 목록 수집 실패 (HTTP ${res.status})`)
  const data = await res.json()
  // Sort: open first, then by date desc
  return (data.versions || []).sort((a, b) => {
    if (a.status === b.status) return new Date(b.created_on) - new Date(a.created_on)
    return a.status === 'open' ? -1 : 1
  })
}

/**
 * 버전에 속한 티켓 수집.
 * "업데이트개발대상일감" 키워드를 가진 부모 이슈가 있으면 그 하위 일감을,
 * 없으면 버전의 전체 이슈를 반환합니다.
 */
export async function fetchTicketsForVersion(config, versionId, onProgress) {
  const { apiKey, projectId } = config

  onProgress?.('버전 이슈 조회 중...', null)

  // 1단계: 해당 버전의 이슈 목록 조회 (부모 이슈 찾기 목적)
  const params = new URLSearchParams({
    project_id: projectId,
    fixed_version_id: versionId,
    status_id: '*',
    limit: 100,
  })

  let res
  try {
    res = await fetch(`/api/redmine/issues.json?${params}`, {
      headers: { 'X-Redmine-API-Key': apiKey },
    })
  } catch {
    throw new Error('서버에 연결할 수 없어요. 개발 서버(npm run dev)가 실행 중인지 확인해 주세요.')
  }
  if (res.status === 404) throw new Error('프로젝트 ID를 확인해 주세요 (HTTP 404).')
  if (res.status === 401 || res.status === 403) throw new Error(`인증 실패 (HTTP ${res.status}).`)
  if (!res.ok) throw new Error(`이슈 수집 실패 (HTTP ${res.status})`)

  const data = await res.json()
  const versionIssues = data.issues || []

  // 2단계: 부모 이슈 탐색 (기본 키워드: "■ 업데이트 목록")
  const keyword = config.parentKeyword || '■ 업데이트 목록'
  const parentIssue = versionIssues.find(i =>
    i.subject && i.subject.includes(keyword)
  )

  if (parentIssue) {
    // 3단계: 하위 일감 수집
    onProgress?.(`"${parentIssue.subject}" 하위 일감 수집 중 (#${parentIssue.id})...`, null)
    return fetchSubIssues(apiKey, parentIssue.id, onProgress)
  }

  // 폴백: 버전 전체 이슈 사용 (부모 이슈를 찾지 못한 경우)
  onProgress?.(versionIssues.length, data.total_count)
  return versionIssues
}

async function fetchSubIssues(apiKey, parentId, onProgress) {
  const allIssues = []
  let offset = 0
  const limit = 100

  while (true) {
    const params = new URLSearchParams({
      parent_id: parentId,
      status_id: '*',
      limit,
      offset,
    })

    let res
    try {
      res = await fetch(`/api/redmine/issues.json?${params}`, {
        headers: { 'X-Redmine-API-Key': apiKey },
      })
    } catch {
      throw new Error('서버에 연결할 수 없어요.')
    }
    if (!res.ok) throw new Error(`하위 이슈 수집 실패 (HTTP ${res.status})`)
    const data = await res.json()

    allIssues.push(...(data.issues || []))
    onProgress?.(allIssues.length, data.total_count)

    if (allIssues.length >= data.total_count || (data.issues || []).length === 0) break
    offset += limit
  }

  return fetchIssueDetails(apiKey, allIssues, onProgress)
}

async function fetchIssueDetails(apiKey, issues, onProgress) {
  const BATCH = 10
  const results = []

  for (let i = 0; i < issues.length; i += BATCH) {
    const batch = issues.slice(i, i + BATCH)
    const details = await Promise.all(
      batch.map(async issue => {
        try {
          const res = await fetch(`/api/redmine/issues/${issue.id}.json`, {
            headers: { 'X-Redmine-API-Key': apiKey },
          })
          if (!res.ok) return issue
          const data = await res.json()
          return { ...issue, description: data.issue?.description || '' }
        } catch {
          return issue
        }
      })
    )
    results.push(...details)
    onProgress?.(results.length, issues.length)
  }

  return results
}

export function issueToTicket(issue, uid) {
  const trackerName = issue.tracker?.name || 'Common'
  const type = mapType(trackerName)
  const subject = issue.subject || ''

  // Extract [Module] from subject
  const moduleMatch = subject.match(/^(\[[^\]]+\])\s*(.*)/)
  const moduleRaw = moduleMatch ? moduleMatch[1] : ''
  const module = moduleRaw.replace(/[\[\]]/g, '').trim()
  const description = (moduleMatch ? moduleMatch[2] : subject).trim()

  // Look for 비고 in custom fields
  const noteField = issue.custom_fields?.find(f =>
    f.name && ['비고', '처리', 'note', 'remark'].some(n =>
      f.name.toLowerCase().includes(n.toLowerCase())
    )
  )
  const notes = String(noteField?.value || '').trim()

  const body = String(issue.description || '').trim()

  return {
    uid,
    ticketId: String(issue.id),
    type,
    moduleRaw,
    module,
    description,
    notes,
    body,
    raw: `* ${type} #${issue.id}: ${moduleRaw} ${description}${notes ? ' - ' + notes : ''}`.trim(),
  }
}

function mapType(trackerName) {
  const n = trackerName.toLowerCase()
  if (n === 'defect' || n.includes('버그') || n.includes('결함')) return 'Defect'
  if (n === 'feature' || n.includes('기능') || n.includes('개발') || n.includes('요청')) return 'Feature'
  return 'Common'
}
