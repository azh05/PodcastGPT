import Header from './Header'
import NowPlaying from './NowPlaying'

export default function Layout({ children, searchQuery, onSearchChange, nowPlaying }) {
  return (
    <div className="ambient-bg font-sans text-text-primary">
      <Header searchQuery={searchQuery} onSearchChange={onSearchChange} />
      <main className="relative z-[1] max-w-[1800px] mx-auto px-6 md:px-12 pb-24">
        {children}
      </main>
      {nowPlaying && <NowPlaying episode={nowPlaying} />}
    </div>
  )
}
