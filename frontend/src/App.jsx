import { useState, useCallback } from 'react'
import { Switch, Route } from 'wouter'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import EpisodePage from './pages/EpisodePage'

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [nowPlaying, setNowPlaying] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleEpisodeCreated = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return (
    <Layout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      nowPlaying={nowPlaying}
    >
      <Switch>
        <Route path="/">
          <HomePage searchQuery={searchQuery} onPlay={setNowPlaying} refreshKey={refreshKey} />
        </Route>
        <Route path="/create">
          <CreatePage onEpisodeCreated={handleEpisodeCreated} />
        </Route>
        <Route path="/episode/:id">
          {(params) => <EpisodePage id={params.id} onPlay={setNowPlaying} />}
        </Route>
      </Switch>
    </Layout>
  )
}
