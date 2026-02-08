import { useState, useEffect } from "react";
import PodcastSection from "../components/PodcastSection";
import { fetchEpisodes } from "../api/episodes";

export default function HomePage({ searchQuery, onPlay }) {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  }, [searchQuery]);

  const handlePlay = (episode) => {
    if (episode.status !== "completed" || !episode.audio_url) return;
    onPlay({
      id: episode.id,
      title: episode.topic,
      audioUrl: `/api${episode.audio_url}`,
    });
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
      title: ep.topic,
      status: ep.status,
      audioUrl: ep.audio_url,
      key: ep.id,
      onPlay: () => handlePlay(ep),
    }));

  if (podcasts.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <p className="text-text-secondary text-lg">
          {searchQuery
            ? "No episodes match your search."
            : "No episodes yet. Generate one from the API!"}
        </p>
      </div>
    );
  }

  return <PodcastSection title="Recommended for You" podcasts={podcasts} />;
}
