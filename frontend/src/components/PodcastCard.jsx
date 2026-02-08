export default function PodcastCard({ title, status, onPlay }) {
  const playable = status === 'completed'

  return (
    <div className="card-hover-overlay group bg-bg-card rounded-2xl p-[1.2rem] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer hover:-translate-y-2 hover:bg-[rgba(28,28,36,0.9)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,107,53,0.2)]">
      {/* Cover */}
      <div className="relative w-full pt-[100%] bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-xl mb-4 overflow-hidden">
        {/* Play button */}
        {playable && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlay?.(); }}
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
        <span className="inline-block px-2.5 py-1 bg-[rgba(30,215,96,0.15)] text-premium-green rounded text-[0.7rem] font-bold mt-2 relative z-2">
          {status}
        </span>
      )}
    </div>
  )
}
