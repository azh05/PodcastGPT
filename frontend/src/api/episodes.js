export async function fetchEpisodes(search = '', { signal } = {}) {
  const params = new URLSearchParams({ search, limit: '100' })
  const res = await fetch(`/api/episodes?${params}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.status}`)
  return res.json()
}
