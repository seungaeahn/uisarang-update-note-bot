const STEPS = [
  { id: 1, label: '티켓 입력' },
  { id: 2, label: '분석 · 검토' },
  { id: 3, label: '출력' },
]

export default function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {STEPS.map((step, idx) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                current === step.id
                  ? 'bg-blue-800 text-white shadow-md'
                  : current > step.id
                  ? 'bg-blue-200 text-blue-800'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {current > step.id ? '✓' : step.id}
            </div>
            <span
              className={`mt-1 text-xs font-medium ${
                current === step.id ? 'text-blue-800' : 'text-gray-400'
              }`}
            >
              {step.label}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`w-20 h-0.5 mx-2 mb-5 transition-colors ${
                current > step.id ? 'bg-blue-300' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
