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

  let prompt = `버전: ${version || '(버전 미입력)'}\n`
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
