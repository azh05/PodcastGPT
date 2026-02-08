export async function fetchEpisodes(search = '', { signal, category = '', tone = '', sortBy = 'created_at', sortOrder = 'desc' } = {}) {
  const params = new URLSearchParams({ search, limit: '100' })
  if (category) params.set('category', category)
  if (tone) params.set('tone', tone)
  if (sortBy) params.set('sort_by', sortBy)
  if (sortOrder) params.set('sort_order', sortOrder)
  const res = await fetch(`/api/episodes?${params}`, { signal })
  if (!res.ok) throw new Error(`Failed to fetch episodes: ${res.status}`)
  return res.json()
}

export async function fetchCategories({ signal } = {}) {
  const res = await fetch('/api/episodes/categories', { signal })
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
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
