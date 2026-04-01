import { useMemo } from 'react'

export default function Step1Input({
  version, setVersion,
  date, setDate,
  rawText, setRawText,
  onAnalyze,
}) {
  const detectedCount = useMemo(() => {
    return rawText.split('\n').filter(l => /^\*\s+(Defect|Feature|Common)/i.test(l.trim())).length
  }, [rawText])

  return (
    <div className="space-y-5">
      {/* Version info */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">버전 정보</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">버전명</label>
            <input
              type="text"
              value={version}
              onChange={e => setVersion(e.target.value)}
              placeholder="예: 의사랑 2026년 비정기 5차"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">업데이트 날짜</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Ticket input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-gray-800">레드마인 티켓 붙여넣기</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              형식:{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                * Defect #1234: [모듈명] 기능 설명 - 비고
              </code>
            </p>
          </div>
          {detectedCount > 0 && (
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-full font-medium">
              {detectedCount}개 감지
            </span>
          )}
        </div>

        <textarea
          value={rawText}
          onChange={e => setRawText(e.target.value)}
          placeholder={`* Defect #1001: [진료실] 처방전 출력 시 오류 발생 - 개별대응\n* Feature #1002: [보험청구] DRG 점검표 기능 추가\n* Common #1003: [외래접수실] 알림톡 발송 기능 개선`}
          className="w-full h-72 border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none mt-3 text-gray-800 placeholder-gray-400"
        />

        {/* Filter rules hint */}
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-xs font-medium text-amber-800 mb-1">자동 제외 규칙</p>
          <div className="text-xs text-amber-700 space-y-0.5">
            <div>· 비고에 <strong>개별대응</strong>, <strong>내부재현불가</strong> 포함</div>
            <div>· 모듈: <strong>신이미지</strong>, <strong>IMAGE</strong>, <strong>의사랑Image</strong>, <strong>TYSRCOMBTool</strong>, <strong>FwRcvmap</strong>, <strong>YsrExamPrt.dll</strong></div>
            <div>· <strong>PostgreSQL</strong> 단독 항목, <strong>광고 팝업</strong>, <strong>(작성중)</strong></div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onAnalyze}
          disabled={detectedCount === 0}
          className="bg-blue-800 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-7 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
        >
          티켓 분석하기 →
        </button>
      </div>
    </div>
  )
}
