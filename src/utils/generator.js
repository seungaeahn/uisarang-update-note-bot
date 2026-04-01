/**
 * Generate Claude prompt and GitBook markdown from processed tickets.
 */

function groupByModule(tickets) {
  const map = {}
  for (const t of tickets) {
    const key = t.module || '(모듈 미분류)'
    if (!map[key]) map[key] = []
    map[key].push(t)
  }
  return map
}

function toAnchor(num, text) {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\uAC00-\uD7A3a-z0-9-]/g, '')
    .slice(0, 40)
  return `${num}.-${slug}`
}

function splitByCategory(tickets) {
  const newF = tickets.filter(t => t.category === '새로운 기능')
  const improved = tickets.filter(t => t.category === '개선된 기능')
  const bugs = tickets.filter(t => t.category === '오류 수정사항')
  return { newF, improved, bugs }
}

function ticketLabel(t) {
  if (t.merged) {
    const titles = t.mergedTickets.map(x => x.description).join(' / ')
    const bodies = t.mergedTickets
      .filter(x => x.body)
      .map(x => `  #${x.ticketId} 내용: ${x.body}`)
      .join('\n')
    return `[${t.module}] ${titles} (#${t.ticketId})${bodies ? '\n' + bodies : ''}`
  }
  return `[${t.module}] ${t.description} (#${t.ticketId})${t.body ? '\n  내용: ' + t.body : ''}`
}

// ─────────────────────────────────────────────
// Claude Prompt  (CLAUDE.md 핵심 규칙 포함)
// ─────────────────────────────────────────────
export function generateClaudePrompt(version, date, tickets) {
  const { newF, improved, bugs } = splitByCategory(tickets)

  const RULES = `\
당신은 의료 소프트웨어 의사랑의 업데이트 노트를 작성하는 UX Writer입니다.
QA가 입력한 기능 변경 설명을 사용자가 이해하기 쉬운 업데이트 노트 콘텐츠로 변환합니다.

━━━ 출력 구조 ━━━
아래 순서로 GitBook 형식 전체 업데이트 노트를 작성하세요.

## 🔥 핵심 업데이트
새로운 기능·개선된 기능 중 사용자 영향도가 높은 항목 3~5개를
번호 목록으로 나열합니다. **굵은 제목** — 한 줄 설명 형식.

---
## 🆕 새로운 기능
[중요도 순. 각 항목 형식↓]

유형: 새로운 기능
제목: [베네핏 중심 제목]
추천:
- 추천 대상 2~3개
설명: [3~5줄]

---
## ✨ 개선된 기능
[위와 동일 형식]

---
## 🛠 오류 수정사항
[위와 동일 형식]

━━━ 제목 작성 규칙 ━━━
단순 기능명이 아닌 사용자 베네핏 중심으로 작성하세요.
활용 표현: ~을 줄일 수 있어요 / ~을 예방할 수 있어요 / ~을 더 간편하게 했어요 / ~을 한눈에 확인할 수 있어요 / ~을 우리 병원에 맞게 설정할 수 있어요
나쁜 예: DRG 점검표 기능 추가
좋은 예: DRG 점검 누락을 줄이고 청구 관리를 더 쉽게 할 수 있어요

━━━ 추천 항목 ━━━
특정 진료과 / 병원 운영 상황 / 업무 흐름 / 활용 목적 기준으로 2~3개 작성

━━━ 설명 작성 ━━━
- 무엇이 변경되었는지 / 어디서 사용하는지 / 사용자에게 어떤 도움인지 포함
- 3~5줄 이내, 간결하게
- 개발 내부 용어 대신 사용자 중심 표현

━━━ 섹션 내 중요도 정렬 ━━━
1. 법령·고시 적용 → 2. 모든 병원 공통 영향 → 3. 업무 효율화 → 4. 특정 병원/상황 → 5. UI 소폭 개선

━━━ 핵심 업데이트 선정 기준 ━━━
법령·고시 개정 / 모든 병원 영향 신규 기능 / 서비스 종료·대체로 반드시 확인 필요 / 업무 부담을 크게 줄이는 자동화 기능

━━━ 톤 ━━━
~해요 체 / 능동형 / 사용자 관점 / 지나치게 긴 문단 금지 / "기능이 추가되었습니다" 반복 금지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

  let prompt = RULES
  prompt += `버전: ${version || '(버전 미입력)'}\n`
  prompt += `업데이트 날짜: ${date || '(날짜 미입력)'}\n\n`

  if (newF.length > 0) {
    prompt += `### 새로운 기능 티켓\n`
    for (const t of newF) prompt += `- ${ticketLabel(t)}\n`
    prompt += '\n'
  }

  if (improved.length > 0) {
    prompt += `### 개선된 기능 티켓\n`
    for (const t of improved) prompt += `- ${ticketLabel(t)}\n`
    prompt += '\n'
  }

  if (bugs.length > 0) {
    prompt += `### 오류 수정사항 티켓\n`
    for (const t of bugs) prompt += `- ${ticketLabel(t)}\n`
    prompt += '\n'
  }

  prompt += `위 티켓 목록을 분석하여 업데이트 노트를 작성해 주세요.`
  return prompt
}

// ─────────────────────────────────────────────
// GitBook Markdown Skeleton
// ─────────────────────────────────────────────
export function generateGitBookMarkdown(version, date, tickets) {
  const { newF, improved, bugs } = splitByCategory(tickets)

  let md = ''

  // ── Core Updates ──────────────────────────
  const coreItems = [...newF, ...improved].slice(0, 5)
  if (coreItems.length > 0) {
    md += `# :bell: 핵심 업데이트\n\n`
    md += `{% hint style="success" icon="book-medical" %}\n`
    md += `## 관심있는 소식을 클릭하면 상세 정보로 이동해요!\n\n`
    coreItems.forEach((item, idx) => {
      const anchor = toAnchor(idx + 1, item.description)
      const title = item.merged
        ? item.mergedTickets.map(x => x.description).join(' / ')
        : item.description
      md += `### [${idx + 1}. **${title}**](#${anchor})\n`
      md += `(베네핏 중심 한 줄 설명)\n\n`
    })
    md += `{% endhint %}\n\n`
    md += `---\n\n`
  }

  // ── New Features ──────────────────────────
  if (newF.length > 0) {
    md += `# 🔥 새로운 기능\n\n`
    const byModule = groupByModule(newF)
    for (const [module, items] of Object.entries(byModule)) {
      md += `## ${module}\n\n`
      items.forEach((item, idx) => {
        md += featureBlock(idx + 1, item)
      })
    }
  }

  // ── Improvements ──────────────────────────
  if (improved.length > 0) {
    md += `# ✨ 개선된 기능\n\n`
    const byModule = groupByModule(improved)
    for (const [module, items] of Object.entries(byModule)) {
      md += `## ${module}\n\n`
      items.forEach((item, idx) => {
        md += featureBlock(idx + 1, item)
      })
    }
  }

  // ── Bug Fixes ─────────────────────────────
  // CLAUDE.md 12-4: <details> 바로 다음 줄 빈 줄, </details> 다음 빈 줄 없이 바로 다음 <details>
  if (bugs.length > 0) {
    md += `# 💊 오류 수정사항\n\n`
    const byModule = groupByModule(bugs)
    const entries = Object.entries(byModule)
    entries.forEach(([module, items], entryIdx) => {
      md += `<details>\n`
      md += `\n`  // 빈 줄 하나 (CLAUDE.md 규칙)
      md += `<summary><strong>${module}</strong></summary>\n\n`
      items.forEach((item, idx) => {
        const desc = item.merged
          ? item.mergedTickets.map(x => x.description).join(', ')
          : item.description
        md += `${idx + 1}. ${desc}이에요.\n`
      })
      md += `\n</details>`
      // 마지막이 아닐 때만 줄바꿈 없이 바로 다음 <details> (CLAUDE.md 규칙)
      md += entryIdx < entries.length - 1 ? '\n' : '\n'
    })
  }

  return md
}

function featureBlock(num, item) {
  const title = item.merged
    ? item.mergedTickets.map(x => x.description).join(' / ')
    : item.description

  let block = `### ${num}. ${title}\n\n`
  block += `(베네핏 중심 부제목)\n\n`
  block += `> **추천**\n>\n`
  block += `> * 추천 대상 1\n`
  block += `> * 추천 대상 2\n\n`
  block += `(기능 설명 3\\~5줄)\n\n`
  return block
}
