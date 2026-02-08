import PodcastCard from './PodcastCard'

export default function PodcastGrid({ podcasts }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4 md:gap-6">
      {podcasts.map((podcast) => (
        <PodcastCard key={podcast.key ?? podcast.title} {...podcast} />
      ))}
    </div>
  )
}
