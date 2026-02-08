import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { fetchEpisodes } from "../api/episodes";

export default function SearchBar({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, navigate] = useLocation();
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value changes (e.g. clearing search)
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback(async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    try {
      const data = await fetchEpisodes(query, { sortBy: "created_at", sortOrder: "desc" });
      const completed = data.filter((ep) => ep.status === "completed");
      setSuggestions(completed.slice(0, 6));
      setOpen(completed.length > 0);
      setActiveIndex(-1);
    } catch {
      // silently ignore fetch errors for suggestions
    }
  }, []);

  const handleInputChange = (val) => {
    setInputValue(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(val);
    }, 250);
  };

  // Submit search (Enter key) — apply filter to page
  const handleSubmit = () => {
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      navigate(`/episode/${suggestions[activeIndex].id}`);
    } else {
      onChange(inputValue);
    }
    setOpen(false);
  };

  // Navigate to episode on suggestion click
  const handleSelect = (episode) => {
    setInputValue(episode.topic);
    setOpen(false);
    navigate(`/episode/${episode.id}`);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        handleSubmit();
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="flex-1 max-w-[600px] relative" ref={wrapperRef}>
      <svg
        className="absolute left-[1.1rem] top-[50%] -translate-y-1/2 opacity-50 z-10 pointer-events-none"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        style={{ top: "calc(0.9rem + 10px)" }}
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        placeholder="What do you want to listen to?"
        value={inputValue}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (inputValue.trim() && suggestions.length > 0) setOpen(true);
        }}
        className={`w-full py-[0.9rem] pr-[1.2rem] pl-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-text-primary text-[0.95rem] transition-all duration-300 focus:outline-none focus:bg-[rgba(255,255,255,0.08)] focus:border-accent-primary ${
          open ? "rounded-t-2xl rounded-b-none border-b-0" : "rounded-full"
        }`}
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full bg-[rgba(20,20,26,0.98)] backdrop-blur-xl border border-[rgba(255,255,255,0.1)] border-t-0 rounded-b-2xl overflow-hidden z-[200] shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
          {suggestions.map((ep, i) => (
            <li
              key={ep.id}
              onMouseDown={() => handleSelect(ep)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors duration-150 ${
                i === activeIndex
                  ? "bg-[rgba(255,255,255,0.08)]"
                  : "hover:bg-[rgba(255,255,255,0.04)]"
              }`}
            >
              {/* Cover image or fallback icon */}
              {ep.cover_image_url ? (
                <img
                  src={ep.cover_image_url}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-[rgba(255,255,255,0.06)] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-text-muted"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z"
                    />
                  </svg>
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm text-text-primary truncate">{ep.topic}</p>
                <p className="text-xs text-text-muted truncate">
                  {ep.category && (
                    <span className="capitalize">{ep.category}</span>
                  )}
                  {ep.category && ep.tone && <span> &middot; </span>}
                  {ep.tone && (
                    <span className="capitalize">{ep.tone}</span>
                  )}
                </p>
              </div>

              {/* Search arrow icon */}
              <svg
                className="w-4 h-4 text-text-muted shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </li>
          ))}

          {/* "Search all" footer option */}
          <li
            onMouseDown={() => handleSubmit()}
            onMouseEnter={() => setActiveIndex(-1)}
            className="flex items-center gap-3 px-4 py-3 cursor-pointer border-t border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.04)] transition-colors duration-150"
          >
            <div className="w-10 h-10 rounded-lg bg-[rgba(255,107,53,0.1)] flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 text-accent-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <p className="text-sm text-text-secondary">
              Search all for "<span className="text-text-primary">{inputValue}</span>"
            </p>
          </li>
        </ul>
      )}
    </div>
  );
}
