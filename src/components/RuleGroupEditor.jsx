import { useState } from 'react'

const TAG_COLORS = {
  default: 'bg-blue-50 border-blue-200 text-blue-800 hover:border-blue-400',
  emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:border-emerald-400',
  sky:     'bg-sky-50 border-sky-200 text-sky-800 hover:border-sky-400',
}

export default function RuleGroupEditor({ title, description, items, onChange, tagColor = 'default' }) {
  const [newItem, setNewItem] = useState('')

  const add = () => {
    const v = newItem.trim()
    if (!v || items.includes(v)) return
    onChange([...items, v])
    setNewItem('')
  }

  const remove = idx => onChange(items.filter((_, i) => i !== idx))

  const tagCls = TAG_COLORS[tagColor] || TAG_COLORS.default

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h4 className="font-semibold text-gray-800 text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-500 mb-3">{description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 min-h-8 mb-3">
        {items.length === 0 ? (
          <span className="text-xs text-gray-400 italic self-center">규칙 없음 — 아래에서 추가하세요</span>
        ) : (
          items.map((item, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${tagCls}`}
            >
              {item}
              <button
                onClick={() => remove(idx)}
                className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity text-base leading-none pb-px"
                title="삭제"
                aria-label={`${item} 삭제`}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && add()}
          placeholder="항목 입력 후 Enter 또는 추가 클릭"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <button
          onClick={add}
          disabled={!newItem.trim() || items.includes(newItem.trim())}
          className="px-4 py-1.5 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm rounded-lg transition-colors font-medium"
        >
          추가
        </button>
      </div>
      {newItem.trim() && items.includes(newItem.trim()) && (
        <p className="text-xs text-amber-600 mt-1">이미 등록된 항목이에요.</p>
      )}
    </div>
  )
}
