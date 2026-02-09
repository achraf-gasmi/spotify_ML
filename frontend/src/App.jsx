import { useState } from 'react'
import axios from 'axios'
import { Search, Music, BarChart2 } from 'lucide-react'
import './App.css'

function App() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query) return

    setLoading(true)
    setError(null)
    setSearchResults([]) //Clear previous results

    try {
      const response = await axios.get(`/api/v1/search?q=${query}&limit=10`)
      setSearchResults(response.data.results)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch search results')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTrack = async (track) => {
    setSelectedTrack(track)
    setLoading(true)
    setError(null)
    setRecommendations([]) //Clear previous recommendations

    try {
      const response = await axios.get(`/api/v1/recommendations/${track.track_id}?limit=10`)
      setRecommendations(response.data.recommendations)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Spotify Music Intelligence</h1>
        <p>Discover music based on audio features</p>
      </header>

      <div className="search-section card">
        <form onSubmit={handleSearch} className="flex-row">
          <input
            type="text"
            className="input"
            placeholder="Search for a song or artist..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="btn">
            <Search size={20} />
          </button>
        </form>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--error)' }}>{error}</div>}

      {loading && <div className="loading">Loading...</div>}

      <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: selectedTrack ? '1fr 1fr' : '1fr', gap: '2rem' }}>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="results-section">
            <h2>Search Results</h2>
            <div className="track-list">
              {searchResults.map((track) => (
                <div
                  key={track.track_id}
                  className={`card track-item ${selectedTrack?.track_id === track.track_id ? 'selected' : ''}`}
                  onClick={() => handleSelectTrack(track)}
                  style={{ border: selectedTrack?.track_id === track.track_id ? '1px solid var(--accent)' : 'none' }}
                >
                  <div className="track-info">
                    <span className="track-title">{track.track_name}</span>
                    <span className="track-artist">{track.artists}</span>
                  </div>
                  <Music size={16} color="var(--text-secondary)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {selectedTrack && recommendations.length > 0 && (
          <div className="recommendations-section">
            <h2>Recommendations for "{selectedTrack.track_name}"</h2>
            <div className="track-list">
              {recommendations.map((track) => (
                <div key={track.track_id} className="card track-item">
                  <div className="track-info">
                    <span className="track-title">{track.track_name}</span>
                    <span className="track-artist">{track.artists}</span>
                  </div>
                  <div className="similarity-score" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
                    {(track.similarity_score * 100).toFixed(1)}% Match
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
