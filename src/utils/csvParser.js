const REQUIRED_HEADERS = ['SORT', '설명', '파일명', '버전', '폴더']

export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV 형식을 확인해 주세요')

  // 구분자 자동 감지 (탭 → 쉼표 → 세미콜론 순)
  const firstLine = lines[0]
  let sep = null
  for (const candidate of ['\t', ',', ';']) {
    const testHeaders = firstLine.split(candidate).map(h => h.trim())
    if (REQUIRED_HEADERS.every(h => testHeaders.includes(h))) {
      sep = candidate
      break
    }
  }

  const headers = firstLine.split(sep ?? ',').map(h => h.trim())

  if (!sep) {
    const missing = REQUIRED_HEADERS.filter(h => !headers.includes(h))
    throw new Error(`CSV 형식을 확인해 주세요 (누락된 헤더: ${missing.join(', ')})`)
  }

  const rows = lines.slice(1)
    .map(line => {
      const vals = line.split(sep).map(v => v.trim())
      const row = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
    .filter(r => r['설명'] || r['파일명'])

  if (rows.length === 0) throw new Error('CSV 형식을 확인해 주세요')
  return rows
}

export function getOutpatientInfo(rows) {
  const row = rows.find(r => r['설명']?.includes('외래접수실'))
  return {
    fileName: row?.['파일명'] || 'X.X.X.X',
    version: row?.['버전'] || 'X.X.X.X',
  }
}
