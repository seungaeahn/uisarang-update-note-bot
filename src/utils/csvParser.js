const REQUIRED_HEADERS = ['SORT', '설명', '파일명', '버전', '폴더']

export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV 형식을 확인해 주세요')

  const headers = lines[0].split('\t').map(h => h.trim())
  // 탭 구분자가 아니면 쉼표로 재시도
  const sep = headers.length >= REQUIRED_HEADERS.length ? '\t' : ','
  const finalHeaders = sep === ',' ? lines[0].split(',').map(h => h.trim()) : headers

  for (const h of REQUIRED_HEADERS) {
    if (!finalHeaders.includes(h)) throw new Error(`CSV 형식을 확인해 주세요 (누락된 헤더: ${h})`)
  }

  const rows = lines.slice(1)
    .map(line => {
      const vals = line.split(sep).map(v => v.trim())
      const row = {}
      finalHeaders.forEach((h, i) => { row[h] = vals[i] ?? '' })
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
