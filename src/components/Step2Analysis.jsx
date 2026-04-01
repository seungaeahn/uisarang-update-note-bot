import { useState, useCallback } from 'react'

const CATEGORIES = ['새로운 기능', '개선된 기능', '오류 수정사항']

const TYPE_BADGE = {
  Defect: 'bg-red-100 text-red-700 border-red-200',
  Feature: 'bg-blue-100 text-blue-700 border-blue-200',
  Common: 'bg-purple-100 text-purple-700 border-purple-200',
}

const CAT_BADGE = {
  '새로운 기능': 'bg-emerald-100 text-emerald-700',
  '개선된 기능': 'bg-sky-100 text-sky-700',
  '오류 수정사항': 'bg-orange-100 text-orange-700',
}

function TabButton({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
        active
          ? 'border-blue-700 text-blue-800 bg-white'
          : 'border-transparent text-gray-500 hover:text-gray-700 bg-gray-50'
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
          active ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {count}
      </span>
    </button>
  )
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
}) {
  const [activeTab, setActiveTab] = useState('included')

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          label="포함 티켓"
          value={includedTickets.length}
          color="text-blue-800"
          bg="bg-blue-50 border-blue-200"
        />
        <SummaryCard
          label="제외 티켓"
          value={excludedTickets.length}
          color="text-red-600"
          bg="bg-red-50 border-red-200"
        />
        <SummaryCard
          label="병합 제안"
          value={mergeGroups.length}
          color="text-purple-700"
          bg="bg-purple-50 border-purple-200"
        />
      </div>

      {/* Tab panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 px-4 pt-2 gap-1 bg-gray-50">
          <TabButton
            label="포함 티켓"
            count={includedTickets.length}
            active={activeTab === 'included'}
            onClick={() => setActiveTab('included')}
          />
          <TabButton
            label="제외 티켓"
            count={excludedTickets.length}
            active={activeTab === 'excluded'}
            onClick={() => setActiveTab('excluded')}
          />
          <TabButton
            label="병합 제안"
            count={mergeGroups.length}
            active={activeTab === 'merges'}
            onClick={() => setActiveTab('merges')}
          />
        </div>

        <div className="p-4 max-h-[520px] overflow-y-auto scrollbar-thin">
          {activeTab === 'included' && (
            <IncludedTab
              tickets={includedTickets}
              categories={categories}
              onCategoryChange={onCategoryChange}
              onTicketToggle={onTicketToggle}
            />
          )}
          {activeTab === 'excluded' && (
            <ExcludedTab tickets={excludedTickets} onTicketToggle={onTicketToggle} />
          )}
          {activeTab === 'merges' && (
            <MergesTab
              groups={mergeGroups}
              selectedMerges={selectedMerges}
              onToggle={onMergeToggle}
            />
          )}
        </div>
      </div>

    </div>
  )
}

function SummaryCard({ label, value, color, bg }) {
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <div className={`text-3xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-600 mt-0.5">{label}</div>
    </div>
  )
}

function TicketDetail({ ticket }) {
  return (
    <div className="mt-2 ml-1 rounded-md bg-gray-50 border border-gray-200 p-3 space-y-2 text-xs">
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0 w-14">원본</span>
        <span className="text-gray-700 font-mono break-all leading-relaxed">{ticket.raw}</span>
      </div>
      {ticket.notes && (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0 w-14">비고</span>
          <span className="text-orange-700 font-medium">{ticket.notes}</span>
        </div>
      )}
      <div className="flex gap-2">
        <span className="text-gray-400 shrink-0 w-14">제목</span>
        <span className="text-gray-700 break-words leading-relaxed">{ticket.description}</span>
      </div>
      {ticket.body ? (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0 w-14">내용</span>
          <span className="text-gray-700 break-words leading-relaxed whitespace-pre-wrap">{ticket.body}</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <span className="text-gray-400 shrink-0 w-14">내용</span>
          <span className="text-gray-400 italic">내용 없음</span>
        </div>
      )}
    </div>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function IncludedTab({ tickets, categories, onCategoryChange, onTicketToggle }) {
  const [expanded, setExpanded] = useState({})
  const toggle = useCallback(uid => setExpanded(p => ({ ...p, [uid]: !p[uid] })), [])

  if (tickets.length === 0) {
    return <Empty message="포함된 티켓이 없어요." />
  }

  return (
    <div className="space-y-1.5">
      {tickets.map(ticket => (
        <div
          key={ticket.uid}
          className={`rounded-lg border transition-colors ${
            expanded[ticket.uid]
              ? 'border-blue-300 bg-blue-50/40'
              : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50/20'
          }`}
        >
          {/* Row */}
          <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggle(ticket.uid)}>
            {/* Include/exclude toggle */}
            <input
              type="checkbox"
              checked
              onChange={() => onTicketToggle?.(ticket.uid)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 accent-blue-700 cursor-pointer shrink-0"
              title="클릭하면 제외돼요"
            />

            {/* Type badge */}
            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${
                TYPE_BADGE[ticket.type] || 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {ticket.type}
            </span>

            {/* Module */}
            <span className="shrink-0 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
              {ticket.module}
            </span>

            {/* Description */}
            <span
              className={`flex-1 text-sm text-gray-800 min-w-0 ${expanded[ticket.uid] ? 'break-words' : 'truncate'}`}
              title={!expanded[ticket.uid] ? ticket.description : undefined}
            >
              <span className="text-gray-400 mr-1">#{ticket.ticketId}</span>
              {ticket.description}
            </span>

            {/* Notes badge (있을 때만) */}
            {ticket.notes && (
              <span className="shrink-0 text-xs bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded-full">
                {ticket.notes}
              </span>
            )}

            {/* Category selector */}
            <select
              value={categories[ticket.uid] || ''}
              onChange={e => onCategoryChange(ticket.uid, e.target.value)}
              onClick={e => e.stopPropagation()}
              className="shrink-0 text-xs border border-gray-200 rounded-md px-2 py-1.5 focus:ring-1 focus:ring-blue-500 outline-none bg-white text-gray-700"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Expand toggle */}
            <button
              onClick={() => toggle(ticket.uid)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
              title="상세 보기"
            >
              <ChevronIcon open={!!expanded[ticket.uid]} />
            </button>
          </div>

          {/* Detail panel */}
          {expanded[ticket.uid] && (
            <div className="px-3 pb-3">
              <TicketDetail ticket={ticket} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ExcludedTab({ tickets, onTicketToggle }) {
  const [expanded, setExpanded] = useState({})
  const toggle = useCallback(uid => setExpanded(p => ({ ...p, [uid]: !p[uid] })), [])

  if (tickets.length === 0) {
    return <Empty message="제외된 티켓이 없어요." />
  }

  return (
    <div className="space-y-1.5">
      {tickets.map(ticket => (
        <div
          key={ticket.uid}
          className={`rounded-lg border transition-colors ${
            expanded[ticket.uid]
              ? 'border-gray-300 bg-gray-100'
              : 'border-gray-100 bg-gray-50 opacity-75 hover:opacity-100 hover:border-gray-300'
          }`}
        >
          {/* Row */}
          <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => toggle(ticket.uid)}>
            {/* Include/exclude toggle */}
            <input
              type="checkbox"
              checked={false}
              onChange={() => onTicketToggle?.(ticket.uid)}
              onClick={e => e.stopPropagation()}
              className="w-4 h-4 accent-blue-700 cursor-pointer shrink-0"
              title="클릭하면 포함돼요"
            />

            <span
              className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${
                TYPE_BADGE[ticket.type] || 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {ticket.type}
            </span>
            <span className="shrink-0 text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded font-medium">
              {ticket.module}
            </span>
            <span
              className={`flex-1 text-sm text-gray-500 min-w-0 ${expanded[ticket.uid] ? 'break-words' : 'truncate'}`}
              title={!expanded[ticket.uid] ? ticket.description : undefined}
            >
              <span className="text-gray-400 mr-1">#{ticket.ticketId}</span>
              {ticket.description}
            </span>
            <span className="shrink-0 text-xs bg-red-100 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
              {ticket.exclusionReason}
            </span>

            <button
              onClick={() => toggle(ticket.uid)}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 transition-colors"
              title="상세 보기"
            >
              <ChevronIcon open={!!expanded[ticket.uid]} />
            </button>
          </div>

          {/* Detail panel */}
          {expanded[ticket.uid] && (
            <div className="px-3 pb-3">
              <TicketDetail ticket={ticket} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MergesTab({ groups, selectedMerges, onToggle }) {
  if (groups.length === 0) {
    return <Empty message="병합 제안이 없어요. 유사한 티켓을 찾지 못했어요." />
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 mb-3">
        같은 모듈에서 유사한 키워드를 가진 티켓들을 묶었어요. 체크하면 하나의 항목으로 병합해요.
      </p>
      {groups.map(group => (
        <div
          key={group.id}
          className={`rounded-lg border p-4 transition-colors ${
            selectedMerges[group.id]
              ? 'border-purple-300 bg-purple-50'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 mb-2">
            <input
              type="checkbox"
              id={group.id}
              checked={selectedMerges[group.id] || false}
              onChange={() => onToggle(group.id)}
              className="w-4 h-4 accent-purple-700 cursor-pointer"
            />
            <label htmlFor={group.id} className="text-sm font-semibold text-gray-700 cursor-pointer">
              [{group.module}] — {group.tickets.length}개 티켓 병합
            </label>
          </div>
          <div className="ml-7 space-y-1">
            {group.tickets.map(t => (
              <div key={t.uid} className="text-xs text-gray-600 flex gap-2">
                <span className="text-gray-400">#{t.ticketId}</span>
                <span>{t.description}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function Empty({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
      <span className="text-3xl mb-2">📭</span>
      <span className="text-sm">{message}</span>
    </div>
  )
}
