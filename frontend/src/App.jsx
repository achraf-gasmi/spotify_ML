import { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Music, BarChart2, Disc, Smile, Sliders, Play, History, TrendingUp, Dumbbell } from 'lucide-react'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('search') // search, mood, vibe, genres, analytics

  // Search State
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])

  // Shared State
  const [selectedTrack, setSelectedTrack] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [headerTitle, setHeaderTitle] = useState('Spotify Music Intelligence')

  // Analytics State
  const [analytics, setAnalytics] = useState(null)

  // Mood State
  const [selectedMood, setSelectedMood] = useState(null)

  // Vibe State
  const [vibe, setVibe] = useState({
    danceability: 0.5, energy: 0.5, valence: 0.5, acousticness: 0.5, instrumentalness: 0.5
  })

  // Genre State
  const [genres, setGenres] = useState([])
  const [selectedGenre, setSelectedGenre] = useState(null)
  const [genreAnalytics, setGenreAnalytics] = useState(null)

  // Playlist State
  const [playlists, setPlaylists] = useState([])
  const [selectedPlaylist, setSelectedPlaylist] = useState(null)
  const [playlistName, setPlaylistName] = useState('')

  // Auth State
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [user, setUser] = useState(null)
  const [authMode, setAuthMode] = useState('login') // 'login' or 'signup'
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')

  // Add to Playlist State
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false)
  const [trackToAddToPlaylist, setTrackToAddToPlaylist] = useState(null)

  // Preference Profile State
  const [savedProfiles, setSavedProfiles] = useState([])
  const [profileName, setProfileName] = useState('')

  // Workout State
  const [workoutDuration, setWorkoutDuration] = useState(30)
  const [workoutIntensity, setWorkoutIntensity] = useState('medium')
  const [workoutResult, setWorkoutResult] = useState(null)

  useEffect(() => {
    if (token) {
      fetchUser()
      fetchPreferences()
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(response.data)
    } catch (err) {
      console.error(err)
      logout()
    }
  }

  const fetchPreferences = async () => {
    try {
      const response = await axios.get('/api/v1/preferences', getAuthHeaders())
      setSavedProfiles(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSaveProfile = async () => {
    if (!profileName) {
      alert("Please enter a profile name")
      return
    }
    try {
      setLoading(true)
      const payload = {
        name: profileName,
        ...vibe
      }
      await axios.post('/api/v1/preferences', payload, getAuthHeaders())
      alert(`Profile "${profileName}" saved!`)
      setProfileName('')
      fetchPreferences()
    } catch (err) {
      console.error(err)
      setError('Failed to save preference profile')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm("Delete this profile?")) return
    try {
      setLoading(true)
      await axios.delete(`/api/v1/preferences/${profileId}`, getAuthHeaders())
      fetchPreferences()
    } catch (err) {
      console.error(err)
      setError('Failed to delete profile')
    } finally {
      setLoading(false)
    }
  }

  const applyProfile = (profile) => {
    setVibe({
      danceability: profile.danceability,
      energy: profile.energy,
      valence: profile.valence,
      acousticness: profile.acousticness,
      instrumentalness: profile.instrumentalness
    })
  }

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/v1/analytics/summary', getAuthHeaders())
      setAnalytics(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePlayTrack = async (track) => {
    try {
      // Simulate play event
      console.log(`Playing: ${track.track_name}`)
      await axios.post(`/api/v1/history?track_id=${track.track_id}`, null, getAuthHeaders())
      if (activeTab === 'analytics') fetchAnalytics()
    } catch (err) {
      console.error('Failed to record history:', err)
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    try {
      setLoading(true)
      await axios.post(`/api/v1/playlists/${playlistId}/tracks?track_id=${trackToAddToPlaylist.track_id}`, null, getAuthHeaders())
      alert(`Track added to playlist!`)
      setShowPlaylistSelector(false)
      setTrackToAddToPlaylist(null)
      if (activeTab === 'playlists') fetchPlaylists()
    } catch (err) {
      console.error(err)
      setError('Failed to add track to playlist')
    } finally {
      setLoading(false)
    }
  }

  const generateWorkout = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.post('/api/v1/playlists/workout', {
        duration_minutes: workoutDuration,
        intensity: workoutIntensity
      }, getAuthHeaders())
      setWorkoutResult(response.data)
      setRecommendations(response.data.tracks)
    } catch (err) {
      console.error(err)
      setError('Failed to generate workout playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('username', authEmail)
      formData.append('password', authPassword)

      const response = await axios.post('/api/v1/auth/login', formData)
      const accessToken = response.data.access_token
      setToken(accessToken)
      localStorage.setItem('token', accessToken)
      setAuthEmail('')
      setAuthPassword('')
    } catch (err) {
      console.error(err)
      setError('Login failed: Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await axios.post('/api/v1/auth/signup', {
        email: authEmail,
        password: authPassword
      })
      // Auto login after signup
      await handleLogin(e)
    } catch (err) {
      console.error(err)
      setError('Signup failed: Email might be taken')
    } finally {
      setLoading(false)
    }
  }

  // Classification State
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    if (activeTab === 'genres' && genres.length === 0) {
      fetchGenres()
    }
    if ((activeTab === 'playlists' || showPlaylistSelector) && token && playlists.length === 0) {
      fetchPlaylists()
    }
  }, [activeTab, token, showPlaylistSelector])

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

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/v1/playlists', getAuthHeaders())
      setPlaylists(response.data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch playlists')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    setActiveTab('search')
  }

  // Authenticated API calls wrapper
  const getAuthHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` }
  })

  const handleSavePlaylist = async () => {
    if (!playlistName) {
      alert("Please enter a playlist name")
      return
    }
    try {
      setLoading(true)

      // If we have recommendations but no mood/track selected (e.g. Workout), 
      // use the new custom playlist endpoint
      if (activeTab === 'workout' || !selectedMood && !selectedTrack) {
        const trackIds = recommendations.map(t => t.track_id)
        await axios.post('/api/v1/playlists/custom', {
          name: playlistName,
          track_ids: trackIds
        }, getAuthHeaders())
      } else {
        let payload = { name: playlistName, limit: 20 }
        if (selectedMood) {
          payload.mood = selectedMood
        } else if (selectedTrack) {
          payload.seed_track_id = selectedTrack.track_id
        }
        await axios.post('/api/v1/playlists/generate', null, {
          params: payload,
          ...getAuthHeaders()
        })
      }

      alert(`Playlist "${playlistName}" created!`)
      setPlaylistName('')
      fetchPlaylists()
    } catch (err) {
      console.error(err)
      setError('Failed to create playlist')
    } finally {
      setLoading(false)
    }
  }

  const handlePlaylistClick = async (playlistId) => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/v1/playlists/${playlistId}`, getAuthHeaders())
      setSelectedPlaylist(response.data)
      setRecommendations(response.data.tracks)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch playlist details')
    } finally {
      setLoading(false)
    }
  }

  const resetSelection = () => {
    setSelectedTrack(null)
    setSelectedMood(null)
    setSelectedGenre(null)
    setSelectedPlaylist(null)
    setRecommendations([])
    setError(null)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!query) return
    setLoading(true)
    setError(null)
    setSearchResults([])

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
      const response = await axios.get(`/api/v1/recommendations/mood/${mood.toLowerCase()}?limit=10`)
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
    setGenreAnalytics(null)

    try {
      // Fetch tracks
      const tracksResponse = await axios.get(`/api/v1/genres/${genre}/tracks?limit=10`)
      setRecommendations(tracksResponse.data.tracks)

      // Fetch analytics
      const analyticsResponse = await axios.get(`/api/v1/genres/${genre}/analytics`, getAuthHeaders())
      setGenreAnalytics(analyticsResponse.data)
    } catch (err) {
      console.error(err)
      setError(`Failed to fetch ${genre} data`)
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
    if (tab === 'playlists') fetchPlaylists()
    if (tab === 'genres') fetchGenres()
    if (tab === 'analytics') fetchAnalytics()

    // Update header title based on tab
    const titles = {
      search: 'Spotify Music Intelligence',
      mood: 'Mood-Based Discovery',
      vibe: 'Vibe Builder',
      genres: 'Genre Explorer',
      playlists: 'Your Collections',
      classify: 'AI Genre Classifier',
      analytics: 'Listening Analytics',
      workout: 'Workout Generator'
    }
    setHeaderTitle(titles[tab] || 'Spotify Music Intelligence')
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <Music color="var(--accent-primary)" size={32} />
          {user && (
            <div className="flex-row">
              <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>{user.email}</span>
              <button className="btn outline" onClick={logout} style={{ fontSize: '0.8rem', padding: '0.4rem 1.2rem' }}>Logout</button>
            </div>
          )}
        </div>
        <div className="header-title-container">
          <h1>{headerTitle}</h1>
          <p>AI-Powered Music Discovery & Intelligence</p>
        </div>
      </header>

      {!token ? (
        <div className="auth-container card" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
          <h2>{authMode === 'login' ? 'Login' : 'Sign Up'}</h2>
          <form onSubmit={authMode === 'login' ? handleLogin : handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <input
              type="email"
              placeholder="Email"
              className="input"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              className="input"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
            <button type="submit" className="btn">{authMode === 'login' ? 'Login' : 'Sign Up'}</button>
          </form>
          {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <span
              onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setError(null); }}
              style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              {authMode === 'login' ? 'Sign Up' : 'Login'}
            </span>
          </p>
        </div>
      ) : (
        <>
          {/* Navigation Tabs */}
          <div className="flex-row" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
            <div className="nav-tabs">
              <button className={`btn ${activeTab === 'search' ? '' : 'outline'}`} onClick={() => handleTabChange('search')}>
                <Search size={16} /> Search
              </button>
              <button className={`btn ${activeTab === 'mood' ? '' : 'outline'}`} onClick={() => handleTabChange('mood')}>
                <Smile size={16} /> Moods
              </button>
              <button className={`btn ${activeTab === 'vibe' ? '' : 'outline'}`} onClick={() => handleTabChange('vibe')}>
                <Sliders size={16} /> Vibe Builder
              </button>
              <button className={`btn ${activeTab === 'genres' ? '' : 'outline'}`} onClick={() => handleTabChange('genres')}>
                <Disc size={16} /> Genres
              </button>
              <button className={`btn ${activeTab === 'playlists' ? '' : 'outline'}`} onClick={() => handleTabChange('playlists')}>
                <Music size={16} /> Playlists
              </button>
              <button className={`btn ${activeTab === 'classify' ? '' : 'outline'}`} onClick={() => handleTabChange('classify')}>
                <BarChart2 size={16} /> Classify
              </button>
              <button className={`btn ${activeTab === 'analytics' ? '' : 'outline'}`} onClick={() => handleTabChange('analytics')}>
                <TrendingUp size={16} /> Analytics
              </button>
              <button className={`btn ${activeTab === 'workout' ? '' : 'outline'}`} onClick={() => handleTabChange('workout')}>
                <Dumbbell size={16} /> Workout
              </button>
            </div>
          </div>

          {showPlaylistSelector && (
            <div className="modal-overlay" style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center',
              alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(5px)'
            }}>
              <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
                <h3>Add to Playlist</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Select a playlist for "{trackToAddToPlaylist?.track_name}"</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                  {playlists.map(p => (
                    <div
                      key={p.id}
                      className="track-item"
                      onClick={() => handleAddToPlaylist(p.id)}
                      style={{ background: 'rgba(255,255,255,0.05)' }}
                    >
                      <span>{p.name}</span>
                      <Music size={14} />
                    </div>
                  ))}
                  {playlists.length === 0 && <p style={{ textAlign: 'center' }}>No playlists found. Create one first!</p>}
                </div>
                <button className="btn outline" onClick={() => setShowPlaylistSelector(false)} style={{ marginTop: '1.5rem', width: '100%' }}>Cancel</button>
              </div>
            </div>
          )}

          {error && <div className="error-message" style={{ color: 'var(--error-color)', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}
          {loading && <div className="loading" style={{ textAlign: 'center', padding: '1rem' }}>Loading...</div>}

          <div className="main-content">

            {/* Global Save Playlist Button (Visible when recommendations are shown) */}
            {recommendations.length > 0 && activeTab !== 'playlists' && activeTab !== 'genres' && (
              <div className="save-playlist-bar card flex-row" style={{ justifyContent: 'center', marginBottom: '2rem', gap: '1rem' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Name your playlist..."
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <button className="btn" onClick={handleSavePlaylist}>Save as Playlist</button>
              </div>
            )}

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
                          >
                            <div className="track-info">
                              <span className="track-title">{track.track_name}</span>
                              <span className="track-artist">{track.artists}</span>
                            </div>
                            <div className="flex-row">
                              <button
                                className="btn outline"
                                style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayTrack(track);
                                }}
                              >
                                <Play size={14} fill="currentColor" />
                              </button>
                              <button
                                className="btn outline"
                                style={{ padding: '8px', borderRadius: '50%' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackToAddToPlaylist(track);
                                  setShowPlaylistSelector(true);
                                }}
                              >
                                <Music size={14} />
                              </button>
                            </div>
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
                            <div className="flex-row">
                              <div className="similarity-score" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '600', marginRight: '1rem' }}>
                                {(track.similarity_score * 100).toFixed(0)}% Match
                              </div>
                              <button
                                className="btn outline"
                                style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayTrack(track);
                                }}
                              >
                                <Play size={14} fill="currentColor" />
                              </button>
                              <button
                                className="btn outline"
                                style={{ padding: '8px', borderRadius: '50%' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTrackToAddToPlaylist(track);
                                  setShowPlaylistSelector(true);
                                }}
                              >
                                <Music size={14} />
                              </button>
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
                <div className="mood-section" style={{ textAlign: 'center', marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>How are you feeling?</h3>
                  <div className="flex-row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    {[
                      { name: 'Happy', icon: '😊' },
                      { name: 'Sad', icon: '😢' },
                      { name: 'Energetic', icon: '⚡' },
                      { name: 'Calm', icon: '🌊' },
                      { name: 'Focused', icon: '🧘' },
                      { name: 'Party', icon: '🥳' },
                      { name: 'Workout', icon: '💪' },
                      { name: 'Chill', icon: '☕' }
                    ].map((mood) => (
                      <button
                        key={mood.name}
                        className={`btn ${selectedMood === mood.name ? '' : 'outline'}`}
                        onClick={() => handleMoodClick(mood.name)}
                        style={{
                          padding: '1rem 2rem',
                          fontSize: '1.1rem',
                          minWidth: '150px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '2rem' }}>{mood.icon}</span>
                        {mood.name}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedMood && recommendations.length > 0 && (
                  <div className="recommendations-section fade-in">
                    <h2 style={{ marginBottom: '1.5rem' }}>{selectedMood} Recommendations</h2>
                    <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                      {recommendations.map((track) => (
                        <div key={track.track_id} className="card track-item">
                          <div className="track-info">
                            <span className="track-title">{track.track_name}</span>
                            <span className="track-artist">{track.artists}</span>
                          </div>
                          <div className="flex-row">
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track);
                              }}
                            >
                              <Play size={14} fill="currentColor" />
                            </button>
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToAddToPlaylist(track);
                                setShowPlaylistSelector(true);
                              }}
                            >
                              <Music size={14} />
                            </button>
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
              <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '2rem' }}>
                <div className="vibe-controls card">
                  <h3>Vibe Controls</h3>
                  <div className="grid" style={{ gridTemplateColumns: '1fr' }}>
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
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
                        />
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <button className="btn" onClick={handleVibeCheck} style={{ width: '100%' }}>Generate Matches</button>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Save this vibe</p>
                      <div className="flex-row">
                        <input
                          type="text"
                          className="input"
                          placeholder="Profile name..."
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          style={{ padding: '8px 16px' }}
                        />
                        <button className="btn outline" onClick={handleSaveProfile} style={{ padding: '8px 16px' }}>Save</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="saved-profiles card">
                  <h3>Saved Profiles</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {savedProfiles.map(profile => (
                      <div
                        key={profile.id}
                        className="track-item"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid transparent' }}
                      >
                        <div onClick={() => applyProfile(profile)} style={{ flex: 1 }}>
                          <span style={{ fontWeight: '600', display: 'block' }}>{profile.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            D:{profile.danceability} E:{profile.energy} V:{profile.valence}
                          </span>
                        </div>
                        <button
                          className="btn outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--error-color)', borderColor: 'rgba(255,77,77,0.2)' }}
                          onClick={() => handleDeleteProfile(profile.id)}
                        >
                          Del
                        </button>
                      </div>
                    ))}
                    {savedProfiles.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 1rem' }}>No saved profiles yet.</p>}
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
                          <div className="flex-row">
                            <div className="similarity-score" style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: '600' }}>
                              {(track.similarity_score * 100).toFixed(0)}% Match
                            </div>
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track);
                              }}
                            >
                              <Play size={14} fill="currentColor" />
                            </button>
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTrackToAddToPlaylist(track);
                                setShowPlaylistSelector(true);
                              }}
                            >
                              <Music size={14} />
                            </button>
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

            {/* PLAYLISTS TAB */}
            {activeTab === 'playlists' && (
              <>
                {!selectedPlaylist ? (
                  <div className="playlists-list">
                    <h3>Your Generated Playlists</h3>
                    {playlists.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No playlists yet. Go to Mood or Search to create one!</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {playlists.map(p => (
                          <div key={p.id} className="card" onClick={() => handlePlaylistClick(p.id)} style={{ cursor: 'pointer' }}>
                            <h4>{p.name}</h4>
                            <p style={{ color: 'var(--text-secondary)' }}>{p.track_count} tracks</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="recommendations-section">
                    <button className="btn outline" onClick={() => setSelectedPlaylist(null)} style={{ marginBottom: '1rem' }}>← Back to Playlists</button>
                    <h2>{selectedPlaylist.name}</h2>
                    <div className="track-list">
                      {recommendations.map((track) => (
                        <div key={track.track_id} className="card track-item">
                          <div className="track-info">
                            <span className="track-title">{track.track_name}</span>
                            <span className="track-artist">{track.artists}</span>
                          </div>
                          <div className="flex-row">
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track);
                              }}
                            >
                              <Play size={14} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
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

                    {genreAnalytics && (
                      <div className="genre-analytics-dashboard fade-in" style={{ marginBottom: '3rem' }}>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                          <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <TrendingUp size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>Popularity</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                              {genreAnalytics.popularity_stats.avg.toFixed(0)}
                            </div>
                            <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Avg Popularity Score</p>
                          </div>

                          <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Top {selectedGenre} Artists</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                              {genreAnalytics.top_artists.map((artist, i) => (
                                <div key={i} className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                  <span style={{ fontWeight: '500' }}>{artist.name}</span>
                                  <span style={{ color: 'var(--text-dim)' }}>{artist.track_count} tracks</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="card" style={{ padding: '2rem' }}>
                          <div className="flex-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                            <Sliders size={24} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0 }}>Genre DNA: {selectedGenre}</h3>
                          </div>
                          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                            {['danceability', 'energy', 'valence', 'acousticness', 'instrumentalness', 'speechiness'].map((feature) => (
                              <div key={feature} className="feature-bar-container">
                                <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                  <label style={{ textTransform: 'capitalize' }}>{feature}</label>
                                  <span style={{ fontWeight: 'bold' }}>{(genreAnalytics.average_features[feature] * 100).toFixed(0)}%</span>
                                </div>
                                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div style={{
                                    height: '100%',
                                    width: `${genreAnalytics.average_features[feature] * 100}%`,
                                    background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                                    borderRadius: '4px'
                                  }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <h2>Top Tracks in {selectedGenre}</h2>
                    <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                      {recommendations.map((track) => (
                        <div key={track.track_id} className="card track-item">
                          <div className="track-info">
                            <span className="track-title">{track.track_name}</span>
                            <span className="track-artist">{track.artists}</span>
                          </div>
                          <div className="flex-row">
                            <button
                              className="btn outline"
                              style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrack(track);
                              }}
                            >
                              <Play size={14} fill="currentColor" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="analytics-dashboard fade-in">
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="card stat-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <History size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '3.5rem', margin: '0', color: 'var(--text-main)' }}>{analytics?.total_plays || 0}</h2>
                    <p style={{ color: 'var(--text-dim)', margin: '0', fontSize: '1.1rem' }}>Total Tracks Played</p>
                  </div>

                  <div className="card stat-card" style={{ padding: '2rem' }}>
                    <div className="flex-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                      <TrendingUp size={32} color="var(--accent-primary)" />
                      <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Top Genres</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {analytics?.top_genres.map((g, i) => (
                        <div key={i} className="flex-row" style={{ justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                          <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{g.genre}</span>
                          <span className="badge" style={{ background: 'var(--accent-glow)', color: 'var(--accent-primary)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem' }}>{g.count} plays</span>
                        </div>
                      ))}
                      {(!analytics || analytics.top_genres.length === 0) && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>
                          <p>Start listening to see your stats!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {analytics && analytics.total_plays > 0 && (
                  <div className="card" style={{ padding: '2.5rem' }}>
                    <div className="flex-row" style={{ marginBottom: '2rem', gap: '1rem' }}>
                      <BarChart2 size={32} color="var(--accent-primary)" />
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Your Audio Profile</h3>
                        <p style={{ color: 'var(--text-dim)', margin: 0 }}>Discover the DNA of your music taste</p>
                      </div>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem' }}>
                      {Object.entries(analytics.average_features).map(([feature, value]) => (
                        <div key={feature} className="feature-bar-container">
                          <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '12px' }}>
                            <label style={{ textTransform: 'capitalize', fontSize: '1rem', fontWeight: '500' }}>{feature}</label>
                            <span style={{ fontWeight: '700', color: 'var(--accent-primary)' }}>
                              {feature === 'tempo' ? value.toFixed(0) : (value * 100).toFixed(0) + '%'}
                            </span>
                          </div>
                          <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: feature === 'tempo' ? `${(value / 200) * 100}%` : `${value * 100}%`,
                              background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))',
                              boxShadow: '0 0 15px var(--accent-glow)',
                              borderRadius: '6px',
                              transition: 'width 1s ease-out'
                            }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* WORKOUT TAB */}
            {activeTab === 'workout' && (
              <div className="workout-container fade-in">
                {!workoutResult ? (
                  <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '2rem' }}>
                      <div className="flex-row" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ padding: '1.5rem', background: 'var(--accent-glow)', borderRadius: '50%', color: 'var(--accent-primary)' }}>
                          <Dumbbell size={48} />
                        </div>
                      </div>
                      <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>BPM-Phased Generator</h2>
                      <p style={{ color: 'var(--text-dim)' }}>Create a playlist that follows your workout intensity arc: Warm-up → Peak → Cool-down.</p>
                    </div>

                    <div style={{ textAlign: 'left', marginBottom: '2.5rem' }}>
                      <div className="slider-container" style={{ marginBottom: '2rem' }}>
                        <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                          <label style={{ fontWeight: '600' }}>Duration (minutes)</label>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>{workoutDuration} min</span>
                        </div>
                        <input
                          type="range" min="15" max="90" step="5"
                          value={workoutDuration}
                          onChange={(e) => setWorkoutDuration(parseInt(e.target.value))}
                          style={{ width: '100%', height: '8px' }}
                        />
                      </div>

                      <div className="intensity-selector">
                        <label style={{ fontWeight: '600', display: 'block', marginBottom: '1rem' }}>Target Intensity</label>
                        <div className="flex-row" style={{ gap: '1rem' }}>
                          {['low', 'medium', 'high'].map(intensity => (
                            <button
                              key={intensity}
                              className={`btn ${workoutIntensity === intensity ? '' : 'outline'}`}
                              onClick={() => setWorkoutIntensity(intensity)}
                              style={{ flex: 1, textTransform: 'capitalize' }}
                            >
                              {intensity}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button className="btn" onClick={generateWorkout} style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}>
                      Generate My Workout Mix
                    </button>
                  </div>
                ) : (
                  <div className="workout-results">
                    <div className="card flex-row" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
                      <div>
                        <h2 style={{ margin: 0 }}>{workoutResult.name}</h2>
                        <p style={{ color: 'var(--text-dim)', margin: 0 }}>{workoutResult.total_tracks} tracks • {workoutResult.duration_requested} minutes target</p>
                      </div>
                      <button className="btn outline" onClick={() => setWorkoutResult(null)}>Edit Criteria</button>
                    </div>

                    <div className="recommendations-section">
                      <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {recommendations.map((track, index) => {
                          // Determine phase based on index
                          const warmupEnd = Math.max(1, Math.floor(recommendations.length * 0.2));
                          const peakEnd = Math.max(warmupEnd + 1, Math.floor(recommendations.length * 0.8));
                          let phaseLabel = "Peak";
                          let phaseColor = "var(--accent-primary)";

                          if (index < warmupEnd) {
                            phaseLabel = "Warm-up";
                            phaseColor = "#ecd06f"; // Gold/Yellow
                          } else if (index >= peakEnd) {
                            phaseLabel = "Cool-down";
                            phaseColor = "#6fbced"; // Blue
                          }

                          return (
                            <div key={`${track.track_id}-${index}`} className="card track-item" style={{ borderLeft: `4px solid ${phaseColor}` }}>
                              <div className="badge" style={{ position: 'absolute', top: '10px', right: '10px', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', color: phaseColor }}>
                                {phaseLabel}
                              </div>
                              <div className="track-info">
                                <span className="track-title">{track.track_name}</span>
                                <span className="track-artist">{track.artists}</span>
                                <div className="flex-row" style={{ marginTop: '0.5rem', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                  <span>BPM: {Math.round(track.tempo)}</span>
                                  <span>Energy: {Math.round(track.energy * 100)}%</span>
                                </div>
                              </div>
                              <div className="flex-row">
                                <button
                                  className="btn outline"
                                  style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayTrack(track);
                                  }}
                                >
                                  <Play size={14} fill="currentColor" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
                          style={{ width: '100%', accentColor: 'var(--accent-primary)' }}
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
                      <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-primary)', margin: '1rem 0' }}>
                        {prediction.top_prediction.genre}
                      </div>
                      <div style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
                        Confidence: {(prediction.top_prediction.confidence * 100).toFixed(1)}%
                      </div>

                      {prediction.all_predictions.length > 1 && (
                        <div style={{ width: '100%', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                          <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-dim)' }}>Alternative matches:</p>
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
                    <div style={{ color: 'var(--text-dim)' }}>
                      <p>Adjust features and click Predict to see the AI's genre classification.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
export default App
