import { useState } from 'react'
import { Switch, Route } from 'wouter'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'

export default function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [nowPlaying, setNowPlaying] = useState(null)

  return (
    <Layout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      nowPlaying={nowPlaying}
    >
      <Switch>
        <Route path="/">
          <HomePage searchQuery={searchQuery} onPlay={setNowPlaying} />
        </Route>
      </Switch>
    </Layout>
  )
}
