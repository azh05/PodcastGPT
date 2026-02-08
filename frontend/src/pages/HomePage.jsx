import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import PodcastSection from "../components/PodcastSection";
import { fetchEpisodes, fetchEpisode, regenerateEpisode } from "../api/episodes";

export default function HomePage({ searchQuery, onPlay, refreshKey }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hideFailed, setHideFailed] = useState(true);
  const [toasts, setToasts] = useState([]); // { id, topic }
  const prevEpisodesRef = useRef([]);

  // Detect newly failed episodes and show toast
  const checkForNewFailures = (newEpisodes) => {
    const prevMap = new Map(prevEpisodesRef.current.map((ep) => [ep.id, ep.status]));
    const newlyFailed = newEpisodes.filter(
      (ep) => ep.status === "failed" && prevMap.has(ep.id) && prevMap.get(ep.id) !== "failed"
    );
    if (newlyFailed.length > 0) {
      const newToasts = newlyFailed.map((ep) => ({ id: ep.id, topic: ep.topic }));
      setToasts((prev) => [...prev, ...newToasts]);
    }
    prevEpisodesRef.current = newEpisodes;
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Auto-dismiss toasts after 6 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 6000);
    return () => clearTimeout(timer);
  }, [toasts]);

  // Fetch episodes and re-fetch when refreshKey changes (new episode created)
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchEpisodes(searchQuery, {
          signal: controller.signal,
        });
        setEpisodes(data);
        prevEpisodesRef.current = data; // seed prev (don't toast on initial load)
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, refreshKey]);

  // Poll for in-progress episodes every 5 seconds
  const prevHadInProgress = useRef(false);
  useEffect(() => {
    const hasInProgress = episodes.some(
      (ep) =>
        ep.status !== "completed" &&
        ep.status !== "failed"
    );

    // If episodes just finished, do one final refresh to get the completed state
    if (!hasInProgress && prevHadInProgress.current) {
      prevHadInProgress.current = false;
      fetchEpisodes(searchQuery).then(setEpisodes).catch(() => {});
      return;
    }
    prevHadInProgress.current = hasInProgress;

    if (!hasInProgress) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchEpisodes(searchQuery);
        checkForNewFailures(data);
        setEpisodes(data);
      } catch {
        // silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [episodes, searchQuery]);

  const handlePlay = async (episode) => {
    if (episode.status !== "completed" || !episode.audio_url) return;
    try {
      const full = await fetchEpisode(episode.id);
      onPlay({
        id: full.id,
        title: full.topic,
        audioUrl: `/api${full.audio_url}`,
        coverImageUrl: full.cover_image_url || null,
        citations: full.citations || [],
      });
    } catch {
      onPlay({
        id: episode.id,
        title: episode.topic,
        audioUrl: `/api${episode.audio_url}`,
        coverImageUrl: episode.cover_image_url || null,
        citations: [],
      });
    }
  };

  const handleRegenerate = async (episode) => {
    try {
      await regenerateEpisode(episode.id);
      // Refresh the list to show the episode back in pending state
      const data = await fetchEpisodes(searchQuery);
      setEpisodes(data);
    } catch (err) {
      console.error("Failed to regenerate:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-text-secondary text-lg">Loading episodes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-red-400 text-lg">Error: {error}</p>
      </div>
    );
  }

  const failedCount = episodes.filter((ep) => ep.status === "failed").length;

  const podcasts = episodes
    .filter((ep) => !hideFailed || ep.status !== "failed")
    .map((ep) => ({
      title: ep.topic,
      status: ep.status,
      coverImageUrl: ep.cover_image_url,
      audioUrl: ep.audio_url,
      key: ep.id,
      onPlay: () => handlePlay(ep),
      onRegenerate: ep.status === "failed" ? () => handleRegenerate(ep) : undefined,
    }));

  if (podcasts.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[40vh] gap-6">
        <p className="text-text-secondary text-lg">
          {searchQuery
            ? "No episodes match your search."
            : "No episodes yet. Create your first podcast!"}
        </p>
        {!searchQuery && (
          <Link
            href="/create"
            className="px-6 py-3 bg-gradient-to-r from-accent-primary to-[#ff8f5a] text-white font-bold rounded-full no-underline transition-all duration-300 shadow-[0_4px_15px_rgba(255,107,53,0.3)] hover:shadow-[0_6px_25px_rgba(255,107,53,0.5)] hover:-translate-y-0.5"
          >
            + Create Podcast
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Failure toast notifications */}
      <div className="fixed top-20 right-6 z-[300] flex flex-col gap-3 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-start gap-3 px-4 py-3 bg-[rgba(30,30,38,0.95)] backdrop-blur-xl border border-[rgba(239,68,68,0.4)] rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.4)] animate-fade-in-up"
          >
            <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400">Generation failed</p>
              <p className="text-xs text-text-secondary mt-0.5 truncate">"{toast.topic}"</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-text-muted hover:text-text-primary transition-colors duration-200 cursor-pointer bg-transparent border-none p-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {failedCount > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setHideFailed(!hideFailed)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border cursor-pointer ${
              hideFailed
                ? 'bg-[rgba(239,68,68,0.15)] text-red-400 border-[rgba(239,68,68,0.3)]'
                : 'bg-[rgba(255,255,255,0.05)] text-text-secondary border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)]'
            }`}
          >
            {hideFailed ? `Show failed (${failedCount})` : `Hide failed (${failedCount})`}
          </button>
        </div>
      )}
      <PodcastSection title="Your Podcasts" podcasts={podcasts} />
    </div>
  );
}
