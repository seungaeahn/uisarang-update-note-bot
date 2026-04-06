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
