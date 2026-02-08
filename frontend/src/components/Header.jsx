import { useLocation, Link } from "wouter";
import SearchBar from "./SearchBar";

export default function Header({ searchQuery, onSearchChange }) {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 bg-[rgba(10,10,15,0.9)] backdrop-blur-xl px-6 md:px-12 py-[1.2rem] flex items-center gap-4 md:gap-8 border-b border-[rgba(255,255,255,0.05)] z-[100]">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 text-2xl font-black text-accent-primary no-underline"
      >
        <svg
          className="w-8 h-8"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="16"
            cy="16"
            r="14"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16 8v16M12 16c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span>PodcastGPT</span>
      </Link>

      <SearchBar value={searchQuery} onChange={onSearchChange} />

      {/* Create button */}
      {location !== '/create' && (
        <Link
          href="/create"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-primary to-[#ff8f5a] text-white text-sm font-bold rounded-full no-underline transition-all duration-300 shadow-[0_4px_15px_rgba(255,107,53,0.3)] hover:shadow-[0_6px_25px_rgba(255,107,53,0.5)] hover:-translate-y-0.5 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden md:inline">Create</span>
        </Link>
      )}
    </header>
  );
}
