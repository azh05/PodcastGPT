import { Link } from 'wouter'

const STATUS_STYLES = {
  completed: { bg: 'bg-[rgba(30,215,96,0.15)]', text: 'text-premium-green', label: 'Ready' },
  pending: { bg: 'bg-[rgba(255,200,87,0.15)]', text: 'text-accent-secondary', label: 'Queued' },
  researching: { bg: 'bg-[rgba(96,165,250,0.15)]', text: 'text-blue-400', label: 'Researching...' },
  scriptwriting: { bg: 'bg-[rgba(192,132,252,0.15)]', text: 'text-purple-400', label: 'Writing script...' },
  generating_audio: { bg: 'bg-[rgba(251,146,60,0.15)]', text: 'text-orange-400', label: 'Generating audio...' },
  stitching: { bg: 'bg-[rgba(251,146,60,0.15)]', text: 'text-orange-400', label: 'Stitching audio...' },
  failed: { bg: 'bg-[rgba(239,68,68,0.15)]', text: 'text-red-400', label: 'Failed' },
}

export default function PodcastCard({ id, title, status, coverImageUrl, onPlay }) {
  const playable = status === 'completed'
  const inProgress = status && status !== 'completed' && status !== 'failed'
  const style = STATUS_STYLES[status] || STATUS_STYLES.pending

  return (
    <Link href={`/episode/${id}`} className="no-underline text-inherit">
      <div className="card-hover-overlay group bg-bg-card rounded-2xl p-[1.2rem] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer hover:-translate-y-2 hover:bg-[rgba(28,28,36,0.9)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,107,53,0.2)]">
        {/* Cover */}
        <div className="relative w-full pt-[100%] bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-xl mb-4 overflow-hidden">
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          )}
          {/* Animated ring for in-progress */}
          {inProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 animate-spin text-accent-primary opacity-60" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          )}
          {/* Play button */}
          {playable && (
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onPlay?.(); }}
              className="absolute bottom-2 right-2 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center opacity-0 translate-y-2.5 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 shadow-[0_8px_16px_rgba(255,107,53,0.4)] z-10 border-none cursor-pointer"
            >
              <svg className="w-5 h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>

        {/* Info */}
        <h3 className="text-base font-bold mb-1 text-text-primary line-clamp-2 relative z-2">{title}</h3>
        {status && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${style.bg} ${style.text} rounded text-[0.7rem] font-bold mt-2 relative z-2`}>
            {inProgress && (
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            )}
            {style.label}
          </span>
        )}
      </div>
    </Link>
  )
}
