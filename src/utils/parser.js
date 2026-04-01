/**
 * Parse redmine ticket lines.
 * Format: * Defect/Feature/Common #number: [Module] description - notes
 */
export function parseTickets(text) {
  const lines = text.split('\n')
  const tickets = []
  let uid = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Match: * Type #number: [Module] rest
    const match = trimmed.match(
      /^\*\s+(Defect|Feature|Common)\s+#(\d+):\s*(\[[^\]]+\])\s*(.*)/i
    )

    if (match) {
      const rest = match[4] ? match[4].trim() : ''

      // Split at the LAST occurrence of " - " to separate description from notes
      let description = rest
      let notes = ''
      const lastDash = rest.lastIndexOf(' - ')
      if (lastDash > 0) {
        description = rest.substring(0, lastDash).trim()
        notes = rest.substring(lastDash + 3).trim()
      }

      tickets.push({
        uid: ++uid,
        ticketId: match[2],
        type: match[1], // Defect | Feature | Common
        moduleRaw: match[3], // e.g. [진료실]
        module: match[3].replace(/[\[\]]/g, '').trim(),
        description,
        notes,
        raw: trimmed,
      })
    }
  }

  return tickets
}
