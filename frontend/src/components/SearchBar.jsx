export default function SearchBar({ value, onChange }) {
  return (
    <div className="flex-1 max-w-[600px] relative">
      <svg
        className="absolute left-[1.1rem] top-1/2 -translate-y-1/2 opacity-50"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        placeholder="What do you want to listen to?"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-[0.9rem] pr-[1.2rem] pl-12 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-full text-text-primary text-[0.95rem] transition-all duration-300 focus:outline-none focus:bg-[rgba(255,255,255,0.08)] focus:border-accent-primary"
      />
    </div>
  )
}
