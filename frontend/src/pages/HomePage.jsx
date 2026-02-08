import { useState, useEffect, useRef } from "react";
import PodcastSection from "../components/PodcastSection";
import { fetchEpisodes, fetchEpisode } from "../api/episodes";

export default function HomePage({ searchQuery, onPlay, refreshKey }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        ep.status !== "failed" &&
        ep.status !== "pending",
    );

    // If episodes just finished, do one final refresh to get the completed state
    if (!hasInProgress && prevHadInProgress.current) {
      prevHadInProgress.current = false;
      fetchEpisodes(searchQuery)
        .then(setEpisodes)
        .catch(() => {});
      return;
    }
    prevHadInProgress.current = hasInProgress;

    if (!hasInProgress) return;

    const interval = setInterval(async () => {
      try {
        const data = await fetchEpisodes(searchQuery);
        setEpisodes(data);
      } catch {
        // silently ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [episodes, searchQuery]);

  const audioSrc = (url) => (url.startsWith("http") ? url : `/api${url}`);

  const handlePlay = async (episode) => {
    if (episode.status !== "completed" || !episode.audio_url) return;
    try {
      const full = await fetchEpisode(episode.id);
      onPlay({
        id: full.id,
        title: full.topic,
        audioUrl: audioSrc(full.audio_url),
        coverImageUrl: full.cover_image_url || null,
        citations: full.citations || [],
      });
    } catch {
      onPlay({
        id: episode.id,
        title: episode.topic,
        audioUrl: audioSrc(episode.audio_url),
        coverImageUrl: episode.cover_image_url || null,
        citations: [],
      });
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

  const podcasts = episodes
    .filter((ep) => ep.status !== "failed" && ep.status !== "pending")
    .map((ep) => ({
      id: ep.id,
      title: ep.topic,
      status: ep.status,
      coverImageUrl: ep.cover_image_url,
      audioUrl: ep.audio_url,
      key: ep.id,
      onPlay: () => handlePlay(ep),
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
          <a
            href="/create"
            className="px-6 py-3 bg-gradient-to-r from-accent-primary to-[#ff8f5a] text-white font-bold rounded-full no-underline transition-all duration-300 shadow-[0_4px_15px_rgba(255,107,53,0.3)] hover:shadow-[0_6px_25px_rgba(255,107,53,0.5)] hover:-translate-y-0.5"
          >
            + Create Podcast
          </a>
        )}
      </div>
    );
  }

  return (
    <div>
      <PodcastSection title="Your Podcasts" podcasts={podcasts} />
    </div>
  );
}
