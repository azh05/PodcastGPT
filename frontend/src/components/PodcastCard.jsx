import { Link } from "wouter";

export default function PodcastCard({
  id,
  title,
  category,
  status,
  coverImageUrl,
  onPlay,
  onRegenerate,
}) {
  const playable = status === "completed";
  const inProgress = status && status !== "completed" && status !== "failed";
  const failed = status === "failed";

  return (
    <Link href={`/episode/${id}`} className="no-underline text-inherit">
      <div className="card-hover-overlay group bg-bg-card rounded-2xl p-[1.2rem] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer hover:-translate-y-2 hover:bg-[rgba(28,28,36,0.9)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,107,53,0.2)] flex flex-col">
        {/* Cover */}
        <div className="relative w-full pt-[100%] bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-xl mb-4 overflow-hidden">
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          )}
          {/* Animated ring for in-progress */}
          {inProgress && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-12 h-12 animate-spin text-accent-primary opacity-60"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          )}
          {/* Play button */}
          {playable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onPlay?.();
              }}
              className="absolute bottom-2 right-2 w-12 h-12 bg-accent-primary rounded-full flex items-center justify-center opacity-0 translate-y-2.5 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 shadow-[0_8px_16px_rgba(255,107,53,0.4)] z-10 border-none cursor-pointer"
            >
              <svg className="w-5 h-5 fill-white ml-0.5" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
          {/* Regenerate button for failed episodes */}
          {failed && onRegenerate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onRegenerate();
              }}
              className="absolute bottom-2 right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center opacity-0 translate-y-2.5 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:translate-y-0 shadow-[0_8px_16px_rgba(239,68,68,0.4)] z-10 border-none cursor-pointer hover:bg-red-400"
              title="Regenerate"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h4.5M20 20v-5h-4.5M4.5 9A8 8 0 0119.5 15M19.5 15A8 8 0 014.5 9"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h3 className="text-base font-bold mb-1 text-text-primary line-clamp-2 relative z-2 overflow-hidden text-ellipsis h-[3rem] leading-[1.5rem]">
            {title}
          </h3>
          <span className="text-[0.65rem] font-semibold text-text-muted uppercase tracking-wider relative z-2 h-[0.65rem] leading-[0.65rem]">
            {category || "\u00A0"}
          </span>
        </div>
      </div>
    </Link>
  );
}
