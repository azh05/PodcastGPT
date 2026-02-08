import { useState, useEffect } from 'react'
import { Link } from 'wouter'
import Markdown from 'react-markdown'
import { fetchEpisode } from '../api/episodes'

const STATUS_STYLES = {
  completed: { bg: 'bg-[rgba(30,215,96,0.15)]', text: 'text-premium-green', label: 'Ready' },
  pending: { bg: 'bg-[rgba(255,200,87,0.15)]', text: 'text-accent-secondary', label: 'Queued' },
  researching: { bg: 'bg-[rgba(96,165,250,0.15)]', text: 'text-blue-400', label: 'Researching...' },
  scriptwriting: { bg: 'bg-[rgba(192,132,252,0.15)]', text: 'text-purple-400', label: 'Writing script...' },
  generating_audio: { bg: 'bg-[rgba(251,146,60,0.15)]', text: 'text-orange-400', label: 'Generating audio...' },
  stitching: { bg: 'bg-[rgba(251,146,60,0.15)]', text: 'text-orange-400', label: 'Stitching audio...' },
  failed: { bg: 'bg-[rgba(239,68,68,0.15)]', text: 'text-red-400', label: 'Failed' },
}

function formatDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function EpisodePage({ id, onPlay }) {
  const [episode, setEpisode] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchEpisode(id, { signal: controller.signal })
      .then(setEpisode)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-text-secondary text-lg">Loading episode...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-red-400 text-lg">Error: {error}</p>
      </div>
    )
  }

  if (!episode) return null

  const style = STATUS_STYLES[episode.status] || STATUS_STYLES.pending
  const playable = episode.status === 'completed' && episode.audio_url
  const citations = episode.citations || []
  const audioSrc = (url) => (url.startsWith('http') ? url : `/api${url}`)

  const handlePlay = () => {
    if (!playable) return
    onPlay({
      id: episode.id,
      title: episode.topic,
      audioUrl: audioSrc(episode.audio_url),
      coverImageUrl: episode.cover_image_url || null,
      citations,
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link href="/" className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors no-underline mb-6">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to episodes
      </Link>

      {/* Hero cover image */}
      <div className="relative w-full aspect-[16/9] bg-gradient-to-br from-[#2a2a35] to-[#3a3a45] rounded-2xl overflow-hidden mb-6">
        {episode.cover_image_url && (
          <img
            src={episode.cover_image_url}
            alt={episode.topic}
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        )}
      </div>

      {/* Title + metadata */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">{episode.topic}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${style.bg} ${style.text} rounded text-[0.7rem] font-bold`}>
            {style.label}
          </span>
          {episode.category && (
            <span className="inline-flex items-center px-2.5 py-1 bg-[rgba(255,107,53,0.1)] text-accent-primary rounded text-[0.7rem] font-bold capitalize">
              {episode.category}
            </span>
          )}
          {episode.tone && (
            <span className="text-text-muted text-sm capitalize">{episode.tone}</span>
          )}
          {episode.created_at && (
            <span className="text-text-muted text-sm">{formatDate(episode.created_at)}</span>
          )}
        </div>
      </div>

      {/* Play button */}
      {playable && (
        <button
          onClick={handlePlay}
          className="flex items-center gap-3 px-6 py-3 bg-accent-primary text-white font-bold rounded-full transition-all duration-200 hover:shadow-[0_6px_25px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 border-none cursor-pointer mb-8"
        >
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          Play Episode
        </button>
      )}

      {/* Summary from research notes */}
      {episode.research_notes && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-3">Summary</h2>
          <div className="relative bg-bg-card rounded-xl p-5">
            <div
              className={`prose prose-invert prose-sm max-w-none text-text-secondary leading-relaxed overflow-hidden transition-[max-height] duration-500 ease-in-out ${
                expanded ? 'max-h-[5000px]' : 'max-h-[200px]'
              }`}
            >
              <Markdown>{episode.research_notes.replace(/^[\s\S]*?(?=^#)/m, '')}</Markdown>
            </div>
            {!expanded && (
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-card to-transparent rounded-b-xl pointer-events-none" />
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 text-accent-primary text-sm font-semibold hover:underline cursor-pointer bg-transparent border-none relative z-10"
            >
              {expanded ? 'Show less' : 'Read more'}
            </button>
          </div>
        </section>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-text-primary mb-3">Sources & Citations ({citations.length})</h2>
          <div className="flex flex-col gap-2">
            {citations.map((c, i) => (
              <div
                key={`${c.timestamp_seconds}-${i}`}
                className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] transition-all duration-200"
              >
                {/* Thumbnail */}
                {c.thumbnail_url ? (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="w-10 h-14 object-cover rounded-md shrink-0 bg-[rgba(255,255,255,0.05)]"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-10 h-14 rounded-md shrink-0 bg-[rgba(255,255,255,0.08)] flex items-center justify-center text-text-muted text-lg">
                    📖
                  </div>
                )}

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-text-primary truncate">
                    {c.source_url ? (
                      <a
                        href={c.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-accent-primary transition-colors no-underline text-text-primary hover:underline"
                      >
                        {c.title}
                      </a>
                    ) : (
                      c.title
                    )}
                  </div>
                  {c.authors?.length > 0 && (
                    <div className="text-[10px] text-text-muted truncate">
                      {c.authors.slice(0, 2).join(', ')}
                      {c.published_date ? ` · ${c.published_date}` : ''}
                    </div>
                  )}
                </div>

                {/* External link icon */}
                {c.source_url && (
                  <a
                    href={c.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-text-muted hover:text-accent-primary transition-colors"
                    title="Open source"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
