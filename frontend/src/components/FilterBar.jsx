import { useState, useEffect } from "react";
import { fetchCategories } from "../api/episodes";

const TONE_OPTIONS = [
  "conversational",
  "professional",
  "humorous",
  "dramatic",
  "educational",
  "casual",
];

const SORT_OPTIONS = [
  { label: "Most Recent", sortBy: "created_at", sortOrder: "desc" },
  { label: "Oldest", sortBy: "created_at", sortOrder: "asc" },
  { label: "Longest", sortBy: "duration_seconds", sortOrder: "desc" },
  { label: "Shortest", sortBy: "duration_seconds", sortOrder: "asc" },
  { label: "A-Z", sortBy: "topic", sortOrder: "asc" },
];

export default function FilterBar({ filters, onFiltersChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCategories({ signal: controller.signal })
      .then(setCategories)
      .catch(() => {});
    return () => controller.abort();
  }, []);

  const hasActiveFilters = filters.category || filters.tone;

  const toggleCategory = (cat) => {
    onFiltersChange({
      ...filters,
      category: filters.category === cat ? "" : cat,
    });
  };

  const toggleTone = (tone) => {
    onFiltersChange({
      ...filters,
      tone: filters.tone === tone ? "" : tone,
    });
  };

  const handleSortChange = (e) => {
    const option = SORT_OPTIONS[e.target.value];
    onFiltersChange({
      ...filters,
      sortBy: option.sortBy,
      sortOrder: option.sortOrder,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      category: "",
      tone: "",
      sortBy: "created_at",
      sortOrder: "desc",
    });
  };

  const currentSortIndex = SORT_OPTIONS.findIndex(
    (o) => o.sortBy === filters.sortBy && o.sortOrder === filters.sortOrder,
  );

  return (
    <div className="mt-8 mb-6 flex flex-col gap-3">
      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-text-muted font-semibold uppercase tracking-wider mr-1">
            Category
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer capitalize ${
                filters.category === cat
                  ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
                  : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-text-secondary hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Tone chips + Sort + Clear */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-text-muted font-semibold uppercase tracking-wider mr-1">
          Tone
        </span>
        {TONE_OPTIONS.map((tone) => (
          <button
            key={tone}
            onClick={() => toggleTone(tone)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border cursor-pointer capitalize ${
              filters.tone === tone
                ? "bg-purple-500/20 border-purple-500 text-purple-400"
                : "bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] text-text-secondary hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.2)]"
            }`}
          >
            {tone}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* Sort dropdown */}
          <select
            value={currentSortIndex >= 0 ? currentSortIndex : 0}
            onChange={handleSortChange}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-text-secondary cursor-pointer hover:bg-[rgba(255,255,255,0.1)] transition-colors duration-200 outline-none"
          >
            {SORT_OPTIONS.map((opt, i) => (
              <option key={opt.label} value={i}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-400 cursor-pointer hover:bg-red-500/20 transition-colors duration-200"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
