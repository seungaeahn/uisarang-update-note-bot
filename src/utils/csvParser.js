const REQUIRED_HEADERS = ['구분', '파일명', 'Version', '파일경로', '파일개수']

export function parseCsv(text) {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.trim().split('\n')
  if (lines.length < 2) throw new Error('CSV 형식을 확인해 주세요')

  const headers = lines[0].split(',').map(h => h.trim())
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) throw new Error(`CSV 형식을 확인해 주세요 (누락된 헤더: ${h})`)
  }

  const rows = lines.slice(1)
    .map(line => {
      const vals = line.split(',').map(v => v.trim())
      const row = {}
      headers.forEach((h, i) => { row[h] = vals[i] ?? '' })
      return row
    })
    .filter(r => r['구분'])

  if (rows.length === 0) throw new Error('CSV 형식을 확인해 주세요')
  return rows
}

export function getOutpatientInfo(rows) {
  const row = rows.find(r => r['구분']?.includes('외래접수실'))
  return {
    fileName: row?.['파일명'] || 'X.X.X.X',
    version: row?.['Version'] || 'X.X.X.X',
  }
}
