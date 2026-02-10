import { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Music, BarChart2, Disc, Smile, Sliders } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('search') // search, mood, vibe, genres

  // Search State
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Shared State
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [headerTitle, setHeaderTitle] = useState('Spotify Music Intelligence')

  // Mood State
  const [selectedMood, setSelectedMood] = useState(null)

  // Vibe State
  const [vibe, setVibe] = useState({
    danceability: 0.5, energy: 0.5, valence: 0.5, acousticness: 0.5, instrumentalness: 0.5
  })

  // Genre State
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState(null)

  // Classification State
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    if (activeTab === 'genres' && genres.length === 0) {
      fetchGenres()
    }
  }, [activeTab])

  const fetchGenres = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/v1/genres')
      setGenres(response.data.genres)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch genres')
    } finally {
      setLoading(false)
    }
  }

  const resetSelection = () => {
    setSelectedTrack(null)
    setSelectedMood(null)
    setSelectedGenre(null)
    setRecommendations([])
    setError(null)
  }

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
    setRecommendations([])

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

  const handleMoodClick = async (mood) => {
    setSelectedMood(mood)
    setLoading(true)
    setError(null)
    setRecommendations([])

    try {
      const response = await axios.get(`/api/v1/recommendations/mood/${mood}?limit=10`)
      setRecommendations(response.data.recommendations)
    } catch (err) {
      console.error(err)
      setError(`Failed to fetch ${mood} recommendations`)
    } finally {
      setLoading(false)
    }
  }

  const handleGenreClick = async (genre) => {
    setSelectedGenre(genre)
    setLoading(true)
    setError(null)
    setRecommendations([])

    try {
      const response = await axios.get(`/api/v1/genres/${genre}/tracks?limit=10`)
      setRecommendations(response.data.tracks) // Reusing recommendations state for track list
    } catch (err) {
      console.error(err)
      setError(`Failed to fetch ${genre} tracks`)
    } finally {
      setLoading(false)
    }
  }

  const handleVibeCheck = async () => {
    setLoading(true)
    setError(null)
    setRecommendations([])

    try {
      const response = await axios.post('/api/v1/recommendations/custom?limit=10', vibe)
      setRecommendations(response.data.recommendations)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch custom recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleClassify = async () => {
    setLoading(true)
    setError(null)
    setPrediction(null)

    try {
      const response = await axios.post('/api/v1/classify', vibe)
      setPrediction(response.data)
    } catch (err) {
      console.error(err)
      setError('Failed to classify genre')
    } finally {
      setLoading(false)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    resetSelection()
    setPrediction(null)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>{headerTitle}</h1>
        <p>Discover music based on audio features</p>
      </header>

      {/* Navigation Tabs */}
      <div className="flex-row" style={{ justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <button className={`btn ${activeTab === 'search' ? '' : 'outline'}`} onClick={() => handleTabChange('search')}>
          <Search size={16} style={{ marginRight: '8px' }} /> Search
        </button>
        <button className={`btn ${activeTab === 'mood' ? '' : 'outline'}`} onClick={() => handleTabChange('mood')}>
          <Smile size={16} style={{ marginRight: '8px' }} /> Moods
        </button>
        <button className={`btn ${activeTab === 'vibe' ? '' : 'outline'}`} onClick={() => handleTabChange('vibe')}>
          <Sliders size={16} style={{ marginRight: '8px' }} /> Vibe Builder
        </button>
        <button className={`btn ${activeTab === 'genres' ? '' : 'outline'}`} onClick={() => handleTabChange('genres')}>
          <Disc size={16} style={{ marginRight: '8px' }} /> Genres
        </button>
        <button className={`btn ${activeTab === 'classify' ? '' : 'outline'}`} onClick={() => handleTabChange('classify')}>
          <BarChart2 size={16} style={{ marginRight: '8px' }} /> Classify
        </button>
      </div>

      {error && <div className="error-message" style={{ color: 'var(--error)' }}>{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="main-content">

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <>
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

            <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: selectedTrack ? '1fr 1fr' : '1fr', gap: '2rem' }}>
              {searchResults.length > 0 && (
                <div className="results-section">
                  <h2>Results</h2>
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
          </>
        )}

        {/* MOOD TAB */}
        {activeTab === 'mood' && (
          <>
            <div className="mood-section" style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h3>Select a Mood</h3>
              <div className="flex-row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: '1rem' }}>
                {['Happy', 'Sad', 'Energetic', 'Calm', 'Focused'].map((mood) => (
                  <button
                    key={mood}
                    className="btn"
                    onClick={() => handleMoodClick(mood)}
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      border: selectedMood === mood ? '1px solid var(--accent)' : '1px solid transparent',
                      color: 'var(--text-primary)',
                      transform: selectedMood === mood ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </div>

            {selectedMood && recommendations.length > 0 && (
              <div className="recommendations-section">
                <h2>{selectedMood} Playlist</h2>
                <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {recommendations.map((track) => (
                    <div key={track.track_id} className="card track-item">
                      <div className="track-info">
                        <span className="track-title">{track.track_name}</span>
                        <span className="track-artist">{track.artists}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* VIBE BUILDER TAB */}
        {activeTab === 'vibe' && (
          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
            <div className="vibe-controls card">
              <h3>Vibe Controls</h3>
              <div className="grid">
                {Object.keys(vibe).map((feature) => (
                  <div key={feature} className="slider-container">
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ textTransform: 'capitalize' }}>{feature}</label>
                      <span>{vibe[feature]}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={vibe[feature]}
                      onChange={(e) => setVibe({ ...vibe, [feature]: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn" onClick={handleVibeCheck}>Generate Matches</button>
              </div>
            </div>

            {recommendations.length > 0 ? (
              <div className="recommendations-section">
                <h2>Your Vibe Matches</h2>
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
            ) : (
              <div className="placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <p>Adjust sliders and click Generate Matches</p>
              </div>
            )}
          </div>
        )}

        {/* GENRES TAB */}
        {activeTab === 'genres' && (
          <>
            {!selectedGenre ? (
              <div className="genres-list">
                <h3>All Genres ({genres.length})</h3>
                <div className="flex-row" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {genres.map(genre => (
                    <span
                      key={genre}
                      className="genre-tag"
                      onClick={() => handleGenreClick(genre)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--bg-elevated)',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="recommendations-section">
                <button className="btn outline" onClick={() => setSelectedGenre(null)} style={{ marginBottom: '1rem' }}>← Back to Genres</button>
                <h2>Top Tracks in {selectedGenre}</h2>
                <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                  {recommendations.map((track) => (
                    <div key={track.track_id} className="card track-item">
                      <div className="track-info">
                        <span className="track-title">{track.track_name}</span>
                        <span className="track-artist">{track.artists}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* CLASSIFY TAB */}
        {activeTab === 'classify' && (
          <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="vibe-controls card">
              <h3>Audio Feature Input</h3>
              <div className="grid">
                {Object.keys(vibe).map((feature) => (
                  <div key={feature} className="slider-container">
                    <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '5px' }}>
                      <label style={{ textTransform: 'capitalize' }}>{feature}</label>
                      <span>{vibe[feature]}</span>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.1"
                      value={vibe[feature]}
                      onChange={(e) => setVibe({ ...vibe, [feature]: parseFloat(e.target.value) })}
                      style={{ width: '100%', accentColor: 'var(--accent)' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                <button className="btn" onClick={handleClassify}>Predict Genre</button>
              </div>
            </div>

            <div className="prediction-result card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {prediction ? (
                <>
                  <h3>Predicted Genre</h3>
                  <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent)', margin: '1rem 0' }}>
                    {prediction.top_prediction.genre}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    Confidence: {(prediction.top_prediction.confidence * 100).toFixed(1)}%
                  </div>

                  {prediction.all_predictions.length > 1 && (
                    <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Alternative matches:</p>
                      <div className="flex-row" style={{ justifyContent: 'center', gap: '1rem' }}>
                        {prediction.all_predictions.slice(1).map((pred, idx) => (
                          <div key={idx} className="badge">
                            {pred.genre} ({(pred.confidence * 100).toFixed(0)}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>
                  <p>Adjust features and click Predict to see the AI's genre classification.</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default App
