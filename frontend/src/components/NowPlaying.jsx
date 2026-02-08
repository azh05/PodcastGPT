import { useState, useRef, useEffect } from 'react'

function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function NowPlaying({ episode }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // When a new episode is selected, load and play it
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.load()
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [episode.id])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = fraction * duration
  }

  const progress = duration ? (currentTime / duration) * 100 : 0

  return (
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
        <div className="w-14 h-14 bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-lg shrink-0" />
        <div className="min-w-0">
          <div className="font-semibold text-sm whitespace-nowrap overflow-hidden text-ellipsis">{episode.title}</div>
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
        <span className="text-xs text-text-muted min-w-[40px]">{formatTime(currentTime)}</span>
        <div
          onClick={handleSeek}
          className="progress-track flex-1 h-1 bg-[rgba(255,255,255,0.1)] rounded-sm relative cursor-pointer"
        >
          <div
            className="progress-knob h-full bg-accent-primary rounded-sm"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-text-muted min-w-[40px]">{formatTime(duration)}</span>
      </div>
    </div>
  )
}
