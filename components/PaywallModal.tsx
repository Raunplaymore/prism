'use client'

interface PaywallModalProps {
  onClose: () => void
}

export default function PaywallModal({ onClose }: PaywallModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-2xl">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#eab308"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Daily Limit Reached</h3>
          <p className="mt-2 text-sm text-gray-400">
            You have used all your free country lookups for today.
            Upgrade to Prism Pro for unlimited access.
          </p>
        </div>

        <button
          className="mb-3 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
          onClick={onClose}
        >
          Upgrade to Pro
        </button>
        <button
          onClick={onClose}
          className="w-full rounded-lg py-2 text-sm text-gray-400 transition hover:text-white"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
