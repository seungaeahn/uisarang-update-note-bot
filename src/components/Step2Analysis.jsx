import { useState, useMemo } from 'react'

const CATEGORIES = ['새로운 기능', '개선된 기능', '오류 수정사항']

const TYPE_BADGE = {
  Defect: 'bg-red-100 text-red-700 border-red-200',
  Feature: 'bg-blue-100 text-blue-700 border-blue-200',
  Common: 'bg-purple-100 text-purple-700 border-purple-200',
}

export default function Step2Analysis({
  includedTickets,
  excludedTickets,
  mergeGroups,
  categories,
  selectedMerges,
  onCategoryChange,
  onMergeToggle,
  onTicketToggle,
  onAddMergeGroup,
  onAddToMergeGroup,
  onRemoveMergeGroup,
  onRemoveFromMergeGroup,
}) {
  const [step, setStep] = useState(1)  // 1: 포함/제외, 2: 병합
  const [selectedUid, setSelectedUid] = useState(null)
  const [search, setSearch] = useState('')

  const allTickets = useMemo(() => [...includedTickets, ...excludedTickets], [includedTickets, excludedTickets])
  const selected = allTickets.find(t => t.uid === selectedUid) ?? null

  const mergeGroupByUid = useMemo(() => {
    const map = {}
    for (const g of mergeGroups) for (const t of g.tickets) map[t.uid] = g
    return map
  }, [mergeGroups])

  const activeMergeGroups = useMemo(() =>
    mergeGroups.filter(g => g.tickets.some(t => includedTickets.some(it => it.uid === t.uid))),
    [mergeGroups, includedTickets]
  )

  const matchSearch = t => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      t.description?.toLowerCase().includes(q) ||
      t.module?.toLowerCase().includes(q) ||
      String(t.ticketId).includes(q) ||
      t.body?.toLowerCase().includes(q)
    )
  }

  return (
    <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" style={{ height: '640px' }}>

      {/* ── 왼쪽 패널 ── */}
      <div className="w-2/5 shrink-0 border-r border-gray-200 flex flex-col">

        {/* 단계 인디케이터 */}
        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-3 py-2.5">
          <div className="flex items-center gap-1.5">
            <StepDot
              num={1}
              label="포함 / 제외"
              active={step === 1}
              done={step > 1}
              onClick={() => setStep(1)}
            />
            <div className="flex-1 h-px bg-gray-300 mx-1" />
            <StepDot
              num={2}
              label="병합"
              active={step === 2}
              done={false}
              badge={activeMergeGroups.length > 0 ? `${activeMergeGroups.length}그룹` : null}
              onClick={() => setStep(2)}
            />
          </div>
        </div>

        {/* 검색 */}
        <div className="px-3 py-2 border-b border-gray-100 shrink-0">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="번호, 모듈, 제목 검색..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* 탭 콘텐츠 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {step === 1 ? (
            <FilterPanel
              includedTickets={includedTickets}
              excludedTickets={excludedTickets}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              onToggle={uid => onTicketToggle?.(uid)}
              matchSearch={matchSearch}
            />
          ) : (
            <MergePanel
              includedTickets={includedTickets}
              activeMergeGroups={activeMergeGroups}
              mergeGroupByUid={mergeGroupByUid}
              selectedMerges={selectedMerges}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              onMergeToggle={onMergeToggle}
              onRemoveMergeGroup={onRemoveMergeGroup}
              onRemoveFromMergeGroup={onRemoveFromMergeGroup}
              onAddMergeGroup={onAddMergeGroup}
              onAddToMergeGroup={onAddToMergeGroup}
              matchSearch={matchSearch}
            />
          )}
        </div>

        {/* 하단 내비게이션 */}
        <div className="shrink-0 border-t border-gray-200 px-3 py-2.5 bg-gray-50">
          {step === 1 ? (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                포함 {includedTickets.length}건 · 제외 {excludedTickets.length}건
              </span>
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-1.5 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
              >
                다음: 병합 →
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-white transition-colors"
              >
                ← 포함/제외 수정
              </button>
              <span className="text-xs text-gray-400">
                {activeMergeGroups.length > 0 ? `${activeMergeGroups.length}개 그룹` : '그룹 없음'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── 오른쪽 상세 패널 ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        {selected ? (
          <TicketDetailPanel
            ticket={selected}
            included={includedTickets.some(t => t.uid === selected.uid)}
            category={categories[selected.uid]}
            onCategoryChange={cat => onCategoryChange(selected.uid, cat)}
            onToggle={() => {
              onTicketToggle?.(selected.uid)
              // 포함/제외 수정 시 1단계로 안내
              if (step === 2) setStep(1)
            }}
            mergeGroup={mergeGroupByUid[selected.uid] ?? null}
            isMerged={!!selectedMerges[mergeGroupByUid[selected.uid]?.id]}
            onMergeToggle={() => { const g = mergeGroupByUid[selected.uid]; if (g) onMergeToggle(g.id) }}
            currentStep={step}
            onGoToStep={setStep}
          />
        ) : (
          <EmptyDetail step={step} />
        )}
      </div>
    </div>
  )
}

// ─── 단계 표시 버튼 ──────────────────────────────────────────────────────────

function StepDot({ num, label, active, done, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 group"
    >
      <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center transition-colors ${
        active ? 'bg-blue-700 text-white' :
        done   ? 'bg-green-500 text-white' :
                 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'
      }`}>
        {done ? '✓' : num}
      </span>
      <span className={`text-xs font-medium transition-colors ${
        active ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'
      }`}>
        {label}
      </span>
      {badge && (
        <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-600">
          {badge}
        </span>
      )}
    </button>
  )
}

// ─── 1단계: 포함/제외 ──────────────────────────────────────────────────────────

function FilterPanel({ includedTickets, excludedTickets, selectedUid, onSelect, onToggle, matchSearch }) {
  const allTickets = useMemo(() => [...includedTickets, ...excludedTickets], [includedTickets, excludedTickets])
  const includedUidSet = useMemo(() => new Set(includedTickets.map(t => t.uid)), [includedTickets])

  // 목록 내 ticketId 집합
  const ticketIdSet = useMemo(() => new Set(allTickets.map(t => t.ticketId)), [allTickets])

  // ticketId → 하위 일감 목록 (parentId가 목록 내 티켓을 가리키는 경우만)
  const subTaskMap = useMemo(() => {
    const map = {}
    allTickets.forEach(t => {
      if (t.parentId && ticketIdSet.has(t.parentId)) {
        if (!map[t.parentId]) map[t.parentId] = []
        map[t.parentId].push(t)
      }
    })
    return map
  }, [allTickets, ticketIdSet])

  // 하위 일감 uid 집합 (최상위 목록에서 제외)
  const subTaskUids = useMemo(() => {
    const s = new Set()
    allTickets.forEach(t => { if (t.parentId && ticketIdSet.has(t.parentId)) s.add(t.uid) })
    return s
  }, [allTickets, ticketIdSet])

  const topIncluded = includedTickets.filter(matchSearch).filter(t => !subTaskUids.has(t.uid))
  const topExcluded = excludedTickets.filter(matchSearch).filter(t => !subTaskUids.has(t.uid))

  return (
    <>
      {topIncluded.map(t => (
        <div key={t.uid}>
          <SimpleTicketRow
            ticket={t}
            checked
            selected={selectedUid === t.uid}
            onSelect={() => onSelect(t.uid)}
            onToggle={() => onToggle(t.uid)}
          />
          {subTaskMap[t.ticketId]?.map(sub => (
            <SubTaskRow key={sub.uid} ticket={sub} checked={includedUidSet.has(sub.uid)} selected={selectedUid === sub.uid} onSelect={() => onSelect(sub.uid)} onToggle={() => onToggle(sub.uid)} />
          ))}
        </div>
      ))}

      {topExcluded.length > 0 && (
        <div className="px-3 py-1.5 bg-gray-50 border-y border-gray-100 sticky top-0 z-10">
          <span className="text-xs font-medium text-gray-400">
            제외된 티켓 {topExcluded.length}건
          </span>
        </div>
      )}

      {topExcluded.map(t => (
        <div key={t.uid}>
          <SimpleTicketRow
            ticket={t}
            checked={false}
            selected={selectedUid === t.uid}
            onSelect={() => onSelect(t.uid)}
            onToggle={() => onToggle(t.uid)}
          />
          {subTaskMap[t.ticketId]?.map(sub => (
            <SubTaskRow key={sub.uid} ticket={sub} checked={includedUidSet.has(sub.uid)} selected={selectedUid === sub.uid} onSelect={() => onSelect(sub.uid)} onToggle={() => onToggle(sub.uid)} />
          ))}
        </div>
      ))}
    </>
  )
}

function SimpleTicketRow({ ticket, checked, selected, onSelect, onToggle }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-2 px-3 py-2.5 cursor-pointer border-b border-gray-100 transition-colors ${
        selected ? 'bg-blue-50 border-l-2 border-l-blue-600' :
        checked   ? 'hover:bg-gray-50 border-l-2 border-l-transparent' :
                    'opacity-50 hover:opacity-80 bg-gray-50/50 border-l-2 border-l-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle()}
        onClick={e => e.stopPropagation()}
        className="mt-0.5 w-3.5 h-3.5 accent-blue-700 cursor-pointer shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
          <TypeBadge type={ticket.type} />
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded">{ticket.module || '모듈없음'}</span>
          {!checked && ticket.exclusionReason && (
            <span className="text-xs text-red-400">· {ticket.exclusionReason}</span>
          )}
        </div>
        <p className="text-xs text-gray-700 leading-snug line-clamp-2">
          <span className="text-gray-400 mr-1">#{ticket.ticketId}</span>
          {ticket.description}
        </p>
      </div>
    </div>
  )
}

function SubTaskRow({ ticket, checked, selected, onSelect, onToggle }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-2 pl-7 pr-3 py-1.5 border-b border-gray-100 cursor-pointer transition-colors ${
        selected ? 'bg-blue-50 border-l-2 border-l-blue-400' :
        checked  ? 'bg-gray-50/60 hover:bg-gray-100/80 border-l-2 border-l-transparent' :
                   'opacity-50 hover:opacity-80 bg-gray-50/50 border-l-2 border-l-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={!!checked}
        onChange={() => onToggle?.()}
        onClick={e => e.stopPropagation()}
        className="mt-0.5 w-3.5 h-3.5 accent-blue-700 cursor-pointer shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
          <TypeBadge type={ticket.type} />
          {ticket.module && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1.5 rounded">{ticket.module}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 leading-snug">
          <span className="text-gray-400 mr-1">#{ticket.ticketId}</span>
          {ticket.description}
        </p>
      </div>
    </div>
  )
}

// ─── 2단계: 병합 ──────────────────────────────────────────────────────────────

function MergePanel({
  includedTickets, activeMergeGroups, mergeGroupByUid, selectedMerges,
  selectedUid, onSelect, onMergeToggle, onRemoveMergeGroup, onRemoveFromMergeGroup, onAddMergeGroup, onAddToMergeGroup, matchSearch,
}) {
  const [mergeSelection, setMergeSelection] = useState(new Set())

  const toggleMergeSelect = (uid, e) => {
    e.stopPropagation()
    setMergeSelection(prev => {
      const next = new Set(prev)
      next.has(uid) ? next.delete(uid) : next.add(uid)
      return next
    })
  }

  const clearSelection = () => setMergeSelection(new Set())

  const handleMerge = () => {
    const uids = [...mergeSelection]
    if (uids.length < 2) return
    onAddMergeGroup?.(uids)
    clearSelection()
  }

  const handleAddToGroup = (groupId) => {
    const uids = [...mergeSelection]
    if (!uids.length) return
    onAddToMergeGroup?.(groupId, uids)
    clearSelection()
  }

  const mergedUids = useMemo(() => {
    const s = new Set()
    activeMergeGroups.forEach(g => g.tickets.forEach(t => s.add(t.uid)))
    return s
  }, [activeMergeGroups])

  const unmerged = includedTickets.filter(t => !mergedUids.has(t.uid))
  const selCount = mergeSelection.size

  return (
    <>
      {/* 선택 병합 액션 바 */}
      {selCount >= 2 ? (
        <div className="sticky top-0 z-20 bg-purple-600 text-white flex items-center justify-between px-3 py-2 gap-2 shadow-md">
          <span className="text-xs font-medium">{selCount}개 선택됨</span>
          <div className="flex gap-2">
            <button
              onClick={clearSelection}
              className="text-xs px-2 py-1 rounded bg-purple-500 hover:bg-purple-400 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleMerge}
              className="text-xs font-semibold px-3 py-1 rounded bg-white text-purple-700 hover:bg-purple-50 transition-colors"
            >
              그룹으로 묶기
            </button>
          </div>
        </div>
      ) : selCount === 1 ? (
        <div className="sticky top-0 z-20 bg-purple-50 border-b border-purple-200 flex items-center justify-between px-3 py-2">
          <span className="text-xs text-purple-600">1개 선택 — 다른 티켓을 더 선택하세요</span>
          <button onClick={clearSelection} className="text-xs text-purple-400 hover:text-purple-600">취소</button>
        </div>
      ) : (
        <div className="sticky top-0 z-20 bg-gray-50 border-b border-gray-100 px-3 py-2">
          <span className="text-xs text-gray-400">체크박스로 묶을 티켓을 선택하세요</span>
        </div>
      )}

      {/* 병합 그룹 목록 */}
      {activeMergeGroups.map(group => {
        const isMerged = !!selectedMerges[group.id]
        const groupTickets = group.tickets.filter(t => includedTickets.some(it => it.uid === t.uid))

        return (
          <div key={group.id} className={`border-b border-gray-200 ${isMerged ? 'bg-purple-50/30' : ''}`}>
            {/* 그룹 헤더 — 체크 토글 시 하위 티켓도 동일하게 반영 */}
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50/70">
              <input
                type="checkbox"
                checked={isMerged}
                onChange={() => onMergeToggle(group.id)}
                className="w-3.5 h-3.5 accent-purple-600 cursor-pointer shrink-0"
                title={isMerged ? '병합 해제' : '병합 적용'}
              />
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded border shrink-0 ${
                isMerged ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'
              }`}>
                {group.manual ? '수동' : '자동'}
              </span>
              <span className="text-xs font-medium text-gray-600 flex-1 truncate">
                {groupTickets.length}개 티켓
              </span>
              {selCount >= 1 && (
                <button
                  onClick={() => handleAddToGroup(group.id)}
                  className="text-xs px-2 py-0.5 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors shrink-0"
                >+ 여기에 추가</button>
              )}
              {group.manual && selCount === 0 && (
                <button
                  onClick={() => onRemoveMergeGroup?.(group.id)}
                  className="text-gray-400 hover:text-red-500 transition-colors px-1 text-xs"
                  title="그룹 해제"
                >✕</button>
              )}
            </div>
            {/* 하위 티켓 — 개별 체크 해제 시 그룹에서 해당 티켓만 제거 */}
            {groupTickets.filter(matchSearch).map(ticket => (
              <MergeTicketRow
                key={ticket.uid}
                ticket={ticket}
                indented
                selected={selectedUid === ticket.uid}
                mergeChecked={isMerged}
                onSelect={() => onSelect(ticket.uid)}
                onMergeCheck={e => { e.stopPropagation(); onRemoveFromMergeGroup?.(group.id, ticket.uid) }}
              />
            ))}
          </div>
        )
      })}

      {/* 미병합 티켓 */}
      {unmerged.filter(matchSearch).length > 0 && (
        <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
          <span className="text-xs font-medium text-gray-400">
            단독 티켓 {unmerged.filter(matchSearch).length}건
          </span>
        </div>
      )}

      {unmerged.filter(matchSearch).map(ticket => (
        <MergeTicketRow
          key={ticket.uid}
          ticket={ticket}
          selected={selectedUid === ticket.uid}
          mergeChecked={mergeSelection.has(ticket.uid)}
          onSelect={() => onSelect(ticket.uid)}
          onMergeCheck={e => toggleMergeSelect(ticket.uid, e)}
        />
      ))}

      {activeMergeGroups.length === 0 && unmerged.length === 0 && (
        <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
          <span className="text-2xl">📭</span>
          포함된 티켓이 없어요
        </div>
      )}
    </>
  )
}

function MergeTicketRow({ ticket, indented, selected, mergeChecked, onSelect, onMergeCheck }) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-start gap-2 py-2 pr-3 cursor-pointer border-b border-gray-100 transition-colors ${
        indented ? 'pl-6' : 'pl-3'
      } ${
        mergeChecked  ? 'bg-purple-50 border-l-2 border-l-purple-500' :
        selected      ? 'bg-blue-50 border-l-2 border-l-blue-600' :
                        'hover:bg-gray-50 border-l-2 border-l-transparent'
      }`}
    >
      <input
        type="checkbox"
        checked={mergeChecked}
        onChange={onMergeCheck}
        onClick={e => e.stopPropagation()}
        className="mt-0.5 w-3.5 h-3.5 accent-purple-600 cursor-pointer shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
          <TypeBadge type={ticket.type} />
          <span className="text-xs text-gray-500 bg-gray-100 px-1.5 rounded">{ticket.module || '모듈없음'}</span>
        </div>
        <p className="text-xs text-gray-700 leading-snug line-clamp-2">
          <span className="text-gray-400 mr-1">#{ticket.ticketId}</span>
          {ticket.description}
        </p>
      </div>
    </div>
  )
}

// ─── 오른쪽 상세 패널 ─────────────────────────────────────────────────────────

function TicketDetailPanel({ ticket, included, category, onCategoryChange, onToggle, mergeGroup, isMerged, onMergeToggle, currentStep, onGoToStep }) {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-400 font-mono">#{ticket.ticketId}</span>
          <TypeBadge type={ticket.type} />
          <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            {ticket.module || '모듈없음'}
          </span>
          {ticket.notes && (
            <span className="text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
              {ticket.notes}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
            included
              ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
              : 'bg-blue-700 border-blue-700 text-white hover:bg-blue-800'
          }`}
        >
          {included ? '제외하기' : '포함하기'}
        </button>
      </div>

      {/* 2단계에서 포함/제외 버튼 누르면 안내 */}
      {currentStep === 2 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <span className="text-xs text-amber-700">포함/제외를 수정하려면</span>
          <button
            onClick={() => onGoToStep(1)}
            className="text-xs font-medium text-amber-700 underline hover:text-amber-900"
          >
            1단계로 돌아가기
          </button>
        </div>
      )}

      <p className="text-base font-semibold text-gray-900 leading-snug">{ticket.description}</p>

      <div className="flex flex-wrap gap-3 items-center">
        {included && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 shrink-0">분류</span>
            <select
              value={category || ''}
              onChange={e => onCategoryChange(e.target.value)}
              className="text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700"
            >
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        )}
        {mergeGroup && included && (
          <button
            onClick={onMergeToggle}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              isMerged
                ? 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200'
                : 'bg-white border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
            }`}
          >
            {isMerged ? '✓ 병합 적용 중' : '병합 적용하기'}
          </button>
        )}
      </div>

      {!included && ticket.exclusionReason && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <span className="text-xs text-red-500 font-medium">제외 이유:</span>
          <span className="text-xs text-red-700">{ticket.exclusionReason}</span>
        </div>
      )}

      {mergeGroup && included && (
        <div className={`rounded-lg border p-3 space-y-1.5 ${isMerged ? 'border-purple-200 bg-purple-50/50' : 'border-gray-100 bg-gray-50'}`}>
          <p className="text-xs font-medium text-gray-500 mb-2">관련 티켓</p>
          {mergeGroup.tickets.map(t => (
            <div key={t.uid} className="text-xs flex gap-2">
              <span className={`shrink-0 font-mono ${t.uid === ticket.uid ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                #{t.ticketId}
              </span>
              <span className={t.uid === ticket.uid ? 'font-medium text-gray-800' : 'text-gray-600'}>
                {t.description}
              </span>
            </div>
          ))}
        </div>
      )}

      <hr className="border-gray-100" />

      <div>
        <p className="text-xs font-medium text-gray-400 mb-2">레드마인 내용</p>
        {ticket.body ? (
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 rounded-lg border border-gray-100 p-3">
            {ticket.body}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">작성된 내용이 없어요.</p>
        )}
      </div>
    </div>
  )
}

// ─── 공통 서브 컴포넌트 ───────────────────────────────────────────────────────

function TypeBadge({ type }) {
  return (
    <span className={`text-xs font-semibold px-1.5 rounded border ${TYPE_BADGE[type] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
      {type}
    </span>
  )
}

function EmptyDetail({ step }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3 select-none px-6 text-center">
      <span className="text-4xl">←</span>
      <span className="text-sm">
        {step === 1
          ? '티켓을 클릭하면 내용을 확인하고 포함/제외할 수 있어요'
          : '티켓을 클릭하면 내용을 확인할 수 있어요'}
      </span>
    </div>
  )
}
