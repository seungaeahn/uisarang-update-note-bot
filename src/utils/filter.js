export function filterTickets(tickets, rules) {
  const included = []
  const excluded = []

  for (const ticket of tickets) {
    const reason = getExclusionReason(ticket, rules)
    if (reason) {
      excluded.push({ ...ticket, exclusionReason: reason })
    } else {
      included.push(ticket)
    }
  }

  return { included, excluded }
}

function getExclusionReason(ticket, rules) {
  const notesKws = rules?.notesKeywords ?? []
  const moduleKws = rules?.moduleKeywords ?? []
  const descKws = rules?.descriptionKeywords ?? []

  for (const kw of notesKws) {
    if (ticket.notes.includes(kw)) return `비고: "${kw}"`
  }
  for (const mod of moduleKws) {
    if (ticket.module.includes(mod)) return `모듈: "${mod}"`
  }
  const fullText = `${ticket.description} ${ticket.notes}`
  for (const kw of descKws) {
    if (fullText.includes(kw)) return `설명: "${kw}"`
  }

  // Common 유형 자동 제외 (사용자 노출 기능은 화이트리스트로 유지)
  if (ticket.type === 'Common' && rules?.excludeCommonType !== false) {
    const whitelistKws = rules?.commonTypeIncludeKeywords ?? []
    const isWhitelisted = whitelistKws.some(kw => fullText.includes(kw))
    if (!isWhitelisted) return 'Common 유형 내부 처리 항목'
  }

  return null
}

export function getDefaultCategory(ticket, rules) {
  if (ticket.type === 'Defect') return '오류 수정사항'
  if (ticket.type === 'Feature') {
    const desc = ticket.description
    const impKws = rules?.improvedKeywords ?? []
    if (impKws.some(kw => desc.includes(kw))) return '개선된 기능'
    return '새로운 기능'
  }
  return '개선된 기능'
}
