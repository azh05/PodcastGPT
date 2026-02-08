import { useState, useRef, useEffect, useMemo } from "react";

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function CitationCard({ citation, isActive, onSeek }) {
  return (
    <button
      onClick={() => onSeek(citation.timestamp_seconds)}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 border cursor-pointer w-full shrink-0 ${
        isActive
          ? "bg-[rgba(255,107,53,0.15)] border-accent-primary shadow-[0_0_12px_rgba(255,107,53,0.2)]"
          : "bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]"
      }`}
    >
      {/* Thumbnail */}
      {citation.thumbnail_url ? (
        <img
          src={citation.thumbnail_url}
          alt={citation.title}
          className="w-10 h-14 object-cover rounded-md shrink-0 bg-[rgba(255,255,255,0.05)]"
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      ) : (
        <div className="w-10 h-14 rounded-md shrink-0 bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-text-muted text-lg">
          📖
        </div>
      )}

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
              isActive
                ? "bg-accent-primary text-white"
                : "bg-[rgba(255,255,255,0.1)] text-text-muted"
            }`}
          >
            {formatTime(citation.timestamp_seconds)}
          </span>
        </div>
        <div className="text-xs font-semibold text-text-primary truncate">
          {citation.source_url ? (
            <a
              href={citation.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:text-accent-primary transition-colors no-underline text-text-primary hover:underline"
            >
              {citation.title}
            </a>
          ) : (
            citation.title
          )}
        </div>
        {citation.authors?.length > 0 && (
          <div className="text-[10px] text-text-muted truncate">
            {citation.authors.slice(0, 2).join(", ")}
            {citation.published_date ? ` · ${citation.published_date}` : ""}
          </div>
        )}
      </div>

      {/* External link icon */}
      {citation.source_url && (
        <a
          href={citation.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 text-text-muted hover:text-accent-primary transition-colors"
          title="Open source"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      )}
    </button>
  );
}

export default function NowPlaying({ episode }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showCitations, setShowCitations] = useState(false);

  const citations = episode.citations || [];
  const sortedCitations = useMemo(
    () =>
      [...citations].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds),
    [citations],
  );

  // Find which citation is currently active based on playback time
  const activeCitationIndex = useMemo(() => {
    for (let i = sortedCitations.length - 1; i >= 0; i--) {
      if (currentTime >= sortedCitations[i].timestamp_seconds) return i;
    }
    return -1;
  }, [currentTime, sortedCitations]);

  // When a new episode is selected, load and play it
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, [episode.id]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const fraction = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    audio.currentTime = fraction * duration;
  };

  const seekTo = (seconds) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    if (!isPlaying) audio.play();
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Citations panel — slides up above the player bar */}
      {showCitations && sortedCitations.length > 0 && (
        <div className="fixed bottom-[72px] md:bottom-[80px] left-0 right-0 z-[199] animate-slide-up">
          <div className="max-w-3xl mx-auto px-4 md:px-12">
            <div className="bg-[rgba(20,20,25,0.95)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] rounded-t-2xl px-4 py-3 max-h-[280px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Sources & Citations ({sortedCitations.length})
                </h3>
              </div>
              <div className="flex flex-col gap-2">
                {sortedCitations.map((c, i) => (
                  <CitationCard
                    key={`${c.timestamp_seconds}-${i}`}
                    citation={c}
                    isActive={i === activeCitationIndex}
                    onSeek={seekTo}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Player bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[rgba(20,20,25,0.98)] backdrop-blur-xl border-t border-[rgba(255,255,255,0.1)] px-4 py-3 md:px-12 md:py-4 flex flex-wrap md:flex-nowrap items-center gap-4 md:gap-8 z-[200] animate-slide-up">
        <audio
          ref={audioRef}
          src={episode.audioUrl}
          onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
          onLoadedMetadata={() => setDuration(audioRef.current.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {episode.coverImageUrl ? (
            <img
              src={episode.coverImageUrl}
              alt={episode.title}
              className="w-14 h-14 rounded-lg shrink-0 object-cover"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-lg shrink-0" />
          )}
          <div className="min-w-0">
            <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">
              {episode.title}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 flex-1 justify-center order-first md:order-none w-full md:w-auto mb-2 md:mb-0">
          <button
            onClick={togglePlay}
            className="w-10 h-10 bg-text-primary rounded-full text-bg-primary cursor-pointer flex items-center justify-center transition-all duration-200 hover:bg-accent-primary hover:text-white hover:scale-110 border-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {isPlaying ? (
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              ) : (
                <path d="M8 5v14l11-7z" />
              )}
            </svg>
          </button>
        </div>

        {/* Progress */}
        <div className="flex-1 flex items-center gap-4">
          <span className="text-xs text-text-muted min-w-[40px]">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative">
            <div
              onClick={handleSeek}
              className="progress-track w-full h-1 bg-[rgba(255,255,255,0.1)] rounded-sm relative cursor-pointer"
            >
              <div
                className="progress-knob h-full bg-accent-primary rounded-sm"
                style={{ width: `${progress}%` }}
              />
              {/* Citation markers on the progress bar */}
              {duration > 0 &&
                sortedCitations.map((c, i) => (
                  <div
                    key={`marker-${i}`}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-80 hover:opacity-100 hover:scale-150 transition-all cursor-pointer"
                    style={{
                      left: `${(c.timestamp_seconds / duration) * 100}%`,
                    }}
                    title={c.title}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(c.timestamp_seconds);
                    }}
                  />
                ))}
            </div>
          </div>
          <span className="text-xs text-text-muted min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Citations toggle */}
        {citations.length > 0 && (
          <button
            onClick={() => setShowCitations(!showCitations)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
              showCitations
                ? "bg-accent-primary text-white border-accent-primary"
                : "bg-[rgba(255,255,255,0.05)] text-text-secondary border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]"
            }`}
            title="Toggle citations"
          >
            Sources {citations.length}
          </button>
        )}
      </div>
    </>
  );
}
