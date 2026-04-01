/**
 * Claude API utility.
 * Requests go through vite's dev proxy at /api/claude → https://api.anthropic.com
 */

export async function generateNotes(apiKey, prompt) {
  if (!apiKey) throw new Error('Claude API 키가 설정되어 있지 않아요. 규칙 관리 탭에서 설정해 주세요.')

  let res
  try {
    res = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 8096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
  } catch {
    throw new Error('Claude API에 연결할 수 없어요. 개발 서버(npm run dev)가 실행 중인지 확인해 주세요.')
  }

  if (res.status === 401) throw new Error('Claude API 키가 올바르지 않아요. 규칙 관리 탭에서 확인해 주세요.')
  if (res.status === 429) throw new Error('API 요청 한도를 초과했어요. 잠시 후 다시 시도해 주세요.')
  if (!res.ok) {
    let detail = ''
    try { const d = await res.json(); detail = d?.error?.message || '' } catch { /* ignore */ }
    throw new Error(`Claude API 오류 (HTTP ${res.status})${detail ? ': ' + detail : ''}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}
