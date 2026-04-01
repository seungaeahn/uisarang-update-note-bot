/**
 * Detect tickets that should be merged (same module + overlapping keywords).
 */

const STOPWORDS = new Set([
  '이', '가', '을', '를', '은', '는', '의', '에', '에서', '으로', '로',
  '와', '과', '도', '만', '에게', '부터', '까지', '하여', '하고', '하면',
  '수', '있', '없', '됨', '됩', '기능', '화면', '항목', '버튼',
])

function extractKeywords(text) {
  return text
    .split(/[\s,./()[\]{}|]+/)
    .map(w => w.replace(/[^\uAC00-\uD7A3\u1100-\u11FFa-zA-Z0-9]/g, ''))
    .filter(w => w.length >= 2)
    .filter(w => !STOPWORDS.has(w))
}

function similarityScore(a, b) {
  const aWords = new Set(extractKeywords(a.description))
  const bWords = extractKeywords(b.description)
  const common = bWords.filter(w => aWords.has(w))
  return common.length
}

export function detectMergeGroups(tickets) {
  const groups = []
  const processed = new Set()

  for (let i = 0; i < tickets.length; i++) {
    if (processed.has(tickets[i].uid)) continue

    const group = [tickets[i]]

    for (let j = i + 1; j < tickets.length; j++) {
      if (processed.has(tickets[j].uid)) continue

      const a = tickets[i]
      const b = tickets[j]

      // Must be same module and similar type category
      if (a.module !== b.module) continue

      // Need at least 2 common meaningful keywords
      if (similarityScore(a, b) >= 2) {
        group.push(tickets[j])
        processed.add(tickets[j].uid)
      }
    }

    if (group.length > 1) {
      processed.add(tickets[i].uid)
      groups.push({
        id: `merge-${i}`,
        module: tickets[i].module,
        tickets: group,
      })
    }
  }

  return groups
}
