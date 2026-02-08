import { useState } from "react";
import { useLocation } from "wouter";
import { createEpisode } from "../api/episodes";

const TONES = [
  {
    value: "conversational",
    label: "Conversational",
    icon: "",
    desc: "Friendly and natural chat",
  },
  {
    value: "professional",
    label: "Professional",
    icon: "",
    desc: "Polished and authoritative",
  },
  {
    value: "humorous",
    label: "Humorous",
    icon: "",
    desc: "Light-hearted and fun",
  },
  {
    value: "dramatic",
    label: "Dramatic",
    icon: "",
    desc: "Bold and captivating",
  },
  {
    value: "educational",
    label: "Educational",
    icon: "",
    desc: "Clear and informative",
  },
  { value: "casual", label: "Casual", icon: "", desc: "Relaxed and easygoing" },
];

const TOPIC_SUGGESTIONS = [
  "The Stonewall Riots",
  "Marsha P. Johnson",
  "Queer pioneers in tech",
  "Endangered Indigenous languages",
  "The history of Juneteenth",
  "Bayard Rustin",
];

export default function CreatePage({ onEpisodeCreated }) {
  const [, navigate] = useLocation();
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("conversational");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = topic.trim().length >= 3 && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const episode = await createEpisode(topic.trim(), tone);
      onEpisodeCreated?.(episode);
      navigate("/");
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 animate-fade-in-up">
      {/* Page header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">
          <span className="gradient-text">Create a Podcast</span>
        </h1>
        <p className="text-text-secondary text-lg">
          Enter a topic and pick a style — we'll research, write a script, and
          generate a full AI podcast episode for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Topic input */}
        <div>
          <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
            Topic
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="What should your podcast episode be about?"
            maxLength={200}
            rows={3}
            className="w-full px-5 py-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-2xl text-text-primary text-lg transition-all duration-300 resize-none focus:outline-none focus:bg-[rgba(255,255,255,0.08)] focus:border-accent-primary placeholder:text-text-muted"
          />
          <div className="flex justify-between mt-2">
            <span className="text-text-muted text-xs">Min 3 characters</span>
            <span
              className={`text-xs ${topic.length > 180 ? "text-accent-primary" : "text-text-muted"}`}
            >
              {topic.length}/200
            </span>
          </div>
        </div>

        {/* Topic suggestions */}
        <div>
          <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
            Or try a suggestion
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPIC_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setTopic(suggestion)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer ${
                  topic === suggestion
                    ? "bg-accent-primary text-white border-accent-primary"
                    : "bg-[rgba(255,255,255,0.05)] text-text-secondary border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]"
                }`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Tone picker */}
        <div>
          <label className="block text-sm font-bold text-text-secondary uppercase tracking-wider mb-3">
            Tone & Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {TONES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTone(t.value)}
                className={`relative flex flex-col items-start p-4 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
                  tone === t.value
                    ? "bg-[rgba(255,107,53,0.15)] border-accent-primary shadow-[0_0_20px_rgba(255,107,53,0.15)]"
                    : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)]"
                }`}
              >
                <span className="text-2xl mb-2">{t.icon}</span>
                <span
                  className={`text-sm font-bold ${tone === t.value ? "text-accent-primary" : "text-text-primary"}`}
                >
                  {t.label}
                </span>
                <span className="text-xs text-text-muted mt-0.5">{t.desc}</span>
                {tone === t.value && (
                  <div className="absolute top-3 right-3 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-4 px-6 rounded-2xl text-lg font-bold transition-all duration-300 border-none cursor-pointer ${
            canSubmit
              ? "bg-gradient-to-r from-accent-primary to-[#ff8f5a] text-white shadow-[0_8px_30px_rgba(255,107,53,0.35)] hover:shadow-[0_12px_40px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 active:translate-y-0"
              : "bg-[rgba(255,255,255,0.08)] text-text-muted cursor-not-allowed"
          }`}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-3">
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Generating your podcast...
            </span>
          ) : (
            "Generate Podcast"
          )}
        </button>

        <p className="text-text-muted text-xs text-center">
          Generation typically takes 1–3 minutes. You'll be redirected to the
          home page where you can track progress.
        </p>
      </form>
    </div>
  );
}
