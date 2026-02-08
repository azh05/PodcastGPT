export async function fetchEpisodes(search = '', { signal } = {}) {
  const params = new URLSearchParams({ search, limit: '100' })
  const res = await fetch(`/api/episodes?${params}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.status}`)
  return res.json()
}

export async function createEpisode(topic, tone = 'conversational') {
  const res = await fetch('/api/episodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, tone }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to create episode: ${res.status}`)
  }
  return res.json()
}

export async function fetchEpisode(id, { signal } = {}) {
  const res = await fetch(`/api/episodes/${id}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch episode: ${res.status}`)
  return res.json()
}

export async function regenerateEpisode(id) {
  const res = await fetch(`/api/episodes/${id}/regenerate`, {
    method: 'POST',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || `Failed to regenerate episode: ${res.status}`)
  }
  return res.json()
}
