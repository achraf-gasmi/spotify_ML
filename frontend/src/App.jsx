import { useState, useEffect } from 'react'
import axios from 'axios'
import { Search, Music, BarChart2, Disc, Smile, Sliders, Play, History, TrendingUp, Dumbbell } from 'lucide-react'
import './App.css'

// Modular Components
import Button from './components/common/Button'
import Card from './components/common/Card'
import TrackList from './components/common/TrackList'
import Auth from './components/features/Auth'
import AudioVisualizer from './components/features/AudioVisualizer'
import GenreExplorer from './components/features/GenreExplorer'
import Recommendations from './components/features/Recommendations'
import WorkoutGenerator from './components/features/WorkoutGenerator'
import TrendAnalysis from './components/features/TrendAnalysis'
import { SERVICES } from './config'

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

  // Classification State
  const [prediction, setPrediction] = useState(null)

  useEffect(() => {
    if (token) {
      fetchUser()
      fetchPreferences()
    }
  }, [token])

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${SERVICES.AUTH}/api/v1/auth/me`, {
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
      const response = await axios.get(`${SERVICES.AUTH}/api/v1/preferences`, getAuthHeaders())
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
      await axios.post(`${SERVICES.AUTH}/api/v1/preferences`, payload, getAuthHeaders())
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
      await axios.delete(`${SERVICES.AUTH}/api/v1/preferences/${profileId}`, getAuthHeaders())
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
      const response = await axios.get(`${SERVICES.ANALYTICS}/api/v1/analytics/summary`, getAuthHeaders())
      setAnalytics(response.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handlePlayTrack = async (track) => {
    try {
      // Simulate play event
      console.log(`Playing: ${track.track_name}`)
      await axios.post(`${SERVICES.ANALYTICS}/api/v1/history?track_id=${track.track_id}`, null, getAuthHeaders())
      if (activeTab === 'analytics') fetchAnalytics()
    } catch (err) {
      console.error('Failed to record history:', err)
    }
  }

  const handleAddToPlaylist = async (playlistId) => {
    try {
      setLoading(true)
      await axios.post(`${SERVICES.PLAYLIST}/api/v1/playlists/${playlistId}/tracks?track_id=${trackToAddToPlaylist.track_id}`, null, getAuthHeaders())
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

  const fetchDiscovery = async () => {
    try {
      setLoading(true)
      const response = await axios.post(`${SERVICES.RECOMMENDER}/api/v1/recommendations/personalized?limit=20`, {}, getAuthHeaders())
      setRecommendations(response.data.recommendations)
    } catch (err) {
      console.error(err)
      setError("Failed to fetch discovery recommendations")
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateWorkout = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.post(`${SERVICES.PLAYLIST}/api/v1/playlists/workout`, {
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

      const response = await axios.post(`${SERVICES.AUTH}/api/v1/auth/login`, formData)
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
      await axios.post(`${SERVICES.AUTH}/api/v1/auth/signup`, {
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
      const response = await axios.get(`${SERVICES.RECOMMENDER}/api/v1/genres`)
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
      const response = await axios.get(`${SERVICES.PLAYLIST}/api/v1/playlists`, getAuthHeaders())
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
        await axios.post(`${SERVICES.PLAYLIST}/api/v1/playlists/custom`, {
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
        await axios.post(`${SERVICES.PLAYLIST}/api/v1/playlists/generate`, null, {
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
      const response = await axios.get(`${SERVICES.PLAYLIST}/api/v1/playlists/${playlistId}`, getAuthHeaders())
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
      const response = await axios.get(`${SERVICES.RECOMMENDER}/api/v1/search?q=${query}&limit=10`)
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
      const response = await axios.get(`${SERVICES.RECOMMENDER}/api/v1/recommendations/${track.track_id}?limit=10`)
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
      const response = await axios.get(`${SERVICES.RECOMMENDER}/api/v1/recommendations/mood/${mood.toLowerCase()}?limit=10`)
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
      const tracksResponse = await axios.get(`${SERVICES.RECOMMENDER}/api/v1/genres/${genre}/tracks?limit=10`)
      setRecommendations(tracksResponse.data.tracks)

      // Fetch analytics
      const analyticsResponse = await axios.get(`${SERVICES.ANALYTICS}/api/v1/genres/${genre}/analytics`, getAuthHeaders())
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
      const response = await axios.post(`${SERVICES.RECOMMENDER}/api/v1/recommendations/custom?limit=10`, vibe)
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
      const response = await axios.post(`${SERVICES.RECOMMENDER}/api/v1/classify`, vibe)
      setPrediction(response.data.top_prediction)
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
    if (tab === 'discovery') fetchDiscovery()

    // Update header title based on tab
    const titles = {
      search: 'Spotify Music Intelligence',
      mood: 'Mood-Based Discovery',
      vibe: 'Vibe Builder',
      genres: 'Genre Explorer',
      playlists: 'Your Collections',
      classify: 'AI Genre Classifier',
      analytics: 'Listening Analytics',
      workout: 'Workout Generator',
      trends: 'Global Music Trends',
      discovery: 'Personalized For You'
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
        <Auth
          mode={authMode}
          setMode={setAuthMode}
          email={authEmail}
          setEmail={setAuthEmail}
          password={authPassword}
          setPassword={setAuthPassword}
          onSubmit={authMode === 'login' ? handleLogin : handleSignup}
          error={error}
        />
      ) : (
        <div className="authenticated-view">
          {/* Navigation Tabs */}
          <div className="flex-row" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
            <div className="nav-tabs">
              <Button variant={activeTab === 'search' ? 'primary' : 'outline'} onClick={() => handleTabChange('search')}>
                <Search size={16} /> Search
              </Button>
              <Button variant={activeTab === 'mood' ? 'primary' : 'outline'} onClick={() => handleTabChange('mood')}>
                <Smile size={16} /> Moods
              </Button>
              <Button variant={activeTab === 'vibe' ? 'primary' : 'outline'} onClick={() => handleTabChange('vibe')}>
                <Sliders size={16} /> Vibe Builder
              </Button>
              <Button variant={activeTab === 'genres' ? 'primary' : 'outline'} onClick={() => handleTabChange('genres')}>
                <Disc size={16} /> Genres
              </Button>
              <Button variant={activeTab === 'playlists' ? 'primary' : 'outline'} onClick={() => handleTabChange('playlists')}>
                <Music size={16} /> Playlists
              </Button>
              <Button variant={activeTab === 'classify' ? 'primary' : 'outline'} onClick={() => handleTabChange('classify')}>
                <BarChart2 size={16} /> Classify
              </Button>
              <Button variant={activeTab === 'analytics' ? 'primary' : 'outline'} onClick={() => handleTabChange('analytics')}>
                <TrendingUp size={16} /> Analytics
              </Button>
              <Button variant={activeTab === 'workout' ? 'primary' : 'outline'} onClick={() => handleTabChange('workout')}>
                <Dumbbell size={16} /> Workout
              </Button>
              <Button variant={activeTab === 'trends' ? 'primary' : 'outline'} onClick={() => handleTabChange('trends')}>
                <TrendingUp size={16} /> Trends
              </Button>
              {token && (
                <Button variant={activeTab === 'discovery' ? 'primary' : 'outline'} onClick={() => handleTabChange('discovery')}>
                  <Music size={16} /> For You
                </Button>
              )}
            </div>
          </div>

          <main>
            {error && <div className="error-message" style={{ color: 'var(--error-color)', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

            {/* SEARCH TAB */}
            {activeTab === 'search' && (
              <div className="search-tab">
                <Card className="search-section" style={{ marginBottom: '2rem' }}>
                  <form onSubmit={handleSearch} className="flex-row">
                    <input
                      type="text"
                      className="input"
                      placeholder="Search for a song or artist..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    <Button type="submit">
                      <Search size={20} />
                    </Button>
                  </form>
                </Card>

                <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: selectedTrack ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                  {searchResults.length > 0 && (
                    <div className="results-section">
                      <h2>Results</h2>
                      <TrackList
                        tracks={searchResults}
                        onPlay={handlePlayTrack}
                        onAddToPlaylist={(track) => {
                          setTrackToAddToPlaylist(track);
                          setShowPlaylistSelector(true);
                        }}
                        selectedTrackId={selectedTrack?.track_id}
                      />
                    </div>
                  )}

                  {selectedTrack && recommendations.length > 0 && (
                    <Recommendations
                      title={`Recommendations for "${selectedTrack.track_name}"`}
                      tracks={recommendations}
                      onPlay={handlePlayTrack}
                      onAddToPlaylist={(track) => {
                        setTrackToAddToPlaylist(track);
                        setShowPlaylistSelector(true);
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* MOOD TAB */}
            {activeTab === 'mood' && (
              <div className="mood-tab">
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
                      <Button
                        key={mood.name}
                        variant={selectedMood === mood.name ? 'primary' : 'outline'}
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
                      </Button>
                    ))}
                  </div>
                </div>

                {selectedMood && recommendations.length > 0 && (
                  <Recommendations
                    title={`${selectedMood} Recommendations`}
                    tracks={recommendations}
                    onPlay={handlePlayTrack}
                    onAddToPlaylist={(track) => {
                      setTrackToAddToPlaylist(track);
                      setShowPlaylistSelector(true);
                    }}
                    showSimilarity={false}
                  />
                )}
              </div>
            )}

            {/* VIBE BUILDER TAB */}
            {activeTab === 'vibe' && (
              <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '2rem' }}>
                <Card className="vibe-controls">
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
                    <Button onClick={handleVibeCheck} style={{ width: '100%' }}>Generate Matches</Button>

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
                        <Button variant="outline" onClick={handleSaveProfile} style={{ padding: '8px 16px' }}>Save</Button>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="saved-profiles">
                  <h3>Saved Profiles</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                    {savedProfiles.map(profile => (
                      <div
                        key={profile.id}
                        className="track-item"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid transparent', padding: '0.5rem' }}
                      >
                        <div onClick={() => applyProfile(profile)} style={{ flex: 1, cursor: 'pointer' }}>
                          <span style={{ fontWeight: '600', display: 'block' }}>{profile.name}</span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            D:{profile.danceability} E:{profile.energy} V:{profile.valence}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--error-color)', borderColor: 'rgba(255,77,77,0.2)' }}
                          onClick={() => handleDeleteProfile(profile.id)}
                        >
                          Del
                        </Button>
                      </div>
                    ))}
                    {savedProfiles.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem 1rem' }}>No saved profiles yet.</p>}
                  </div>
                </Card>

                {recommendations.length > 0 ? (
                  <Recommendations
                    title="Your Vibe Matches"
                    tracks={recommendations}
                    onPlay={handlePlayTrack}
                    onAddToPlaylist={(track) => {
                      setTrackToAddToPlaylist(track);
                      setShowPlaylistSelector(true);
                    }}
                  />
                ) : (
                  <div className="placeholder" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    <p>Adjust sliders and click Generate Matches</p>
                  </div>
                )}
              </div>
            )}

            {/* PLAYLISTS TAB */}
            {activeTab === 'playlists' && (
              <div className="playlists-tab">
                {!selectedPlaylist ? (
                  <div className="playlists-list">
                    <h3>Your Generated Playlists</h3>
                    {playlists.length === 0 ? (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No playlists yet. Go to Mood or Search to create one!</p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                        {playlists.map(p => (
                          <Card key={p.id} onClick={() => handlePlaylistClick(p.id)} style={{ cursor: 'pointer' }}>
                            <h4>{p.name}</h4>
                            <p style={{ color: 'var(--text-secondary)' }}>{p.track_count} tracks</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</p>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Recommendations
                    title={selectedPlaylist.name}
                    tracks={recommendations}
                    onPlay={handlePlayTrack}
                    showSimilarity={false}
                  />
                )}
              </div>
            )}

            {/* GENRES TAB */}
            {activeTab === 'genres' && (
              <GenreExplorer
                genres={genres}
                selectedGenre={selectedGenre}
                setSelectedGenre={setSelectedGenre}
                genreAnalytics={genreAnalytics}
                recommendations={recommendations}
                onGenreClick={handleGenreClick}
                onPlayTrack={handlePlayTrack}
              />
            )}

            {activeTab === 'trends' && (
              <TrendAnalysis />
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div className="analytics-dashboard fade-in">
                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                  <Card className="stat-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                    <History size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                    <h2 style={{ fontSize: '3.5rem', margin: '0', color: 'var(--text-main)' }}>{analytics?.total_plays || 0}</h2>
                    <p style={{ color: 'var(--text-dim)', margin: '0', fontSize: '1.1rem' }}>Total Tracks Played</p>
                  </Card>

                  <Card className="stat-card" style={{ padding: '2rem' }}>
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
                  </Card>
                </div>

                {analytics && analytics.total_plays > 0 && (
                  <Card style={{ padding: '2.5rem' }}>
                    <div className="flex-row" style={{ marginBottom: '2.5rem', gap: '2rem', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div className="flex-row" style={{ marginBottom: '1rem', gap: '1rem' }}>
                          <BarChart2 size={32} color="var(--accent-primary)" />
                          <div>
                            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Your Audio Profile</h3>
                            <p style={{ color: 'var(--text-dim)', margin: 0 }}>Discover the DNA of your music taste</p>
                          </div>
                        </div>
                        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                          {Object.entries(analytics.average_features).map(([feature, value]) => (
                            <div key={feature} className="feature-bar-container" style={{ marginBottom: '1rem' }}>
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
                                  borderRadius: '6px',
                                  transition: 'width 1s ease-out'
                                }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="card" style={{ width: '350px', flexShrink: 0, background: 'rgba(255,255,255,0.02)', padding: '1rem' }}>
                        <h4 style={{ textAlign: 'center', marginBottom: '1rem' }}>Visual DNA</h4>
                        <AudioVisualizer features={analytics.average_features} label="You" />
                      </div>
                    </div>
                  </Card>
                )}
              </div>
            )}

            {/* DISCOVERY TAB */}
            {activeTab === 'discovery' && (
              <Recommendations
                title="Personalized Discovery"
                tracks={recommendations}
                onPlay={handlePlayTrack}
                onAddToPlaylist={(track) => {
                  setTrackToAddToPlaylist(track);
                  setShowPlaylistSelector(true);
                }}
              />
            )}

            {/* CLASSIFY TAB */}
            {activeTab === 'classify' && (
              <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <Card className="classifier-form">
                  <h3>AI Genre Classifier</h3>
                  <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Input audio features to predict the genre using our ML model.</p>
                  <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {Object.keys(vibe).map((feature) => (
                      <div key={feature} className="slider-container">
                        <div className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.8rem' }}>
                          <label style={{ textTransform: 'capitalize' }}>{feature}</label>
                          <span>{vibe[feature]}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.1"
                          value={vibe[feature]}
                          onChange={(e) => setVibe({ ...vibe, [feature]: parseFloat(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleClassify} style={{ width: '100%', marginTop: '1.5rem' }}>Predict Genre</Button>
                </Card>

                <div className="prediction-result" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {prediction ? (
                    <Card style={{ padding: '2rem', textAlign: 'center', background: 'var(--accent-glow)', border: '1px solid var(--accent-primary)' }}>
                      <h4 style={{ color: 'var(--text-dim)', margin: 0 }}>Predicted Genre</h4>
                      <h2 style={{ fontSize: '3rem', margin: '1rem 0', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '2px' }}>{prediction.genre}</h2>
                      <div className="flex-row" style={{ justifyContent: 'center', gap: '1rem' }}>
                        <span className="badge">Confidence: {(prediction.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </Card>
                  ) : (
                    <div className="placeholder card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)', minHeight: '200px' }}>
                      <p>Set features and click Predict Genre</p>
                    </div>
                  )}

                  <Card style={{ padding: '1.5rem' }}>
                    <h4 style={{ marginBottom: '1rem' }}>Feature Signature</h4>
                    <AudioVisualizer features={vibe} label="Input Profile" />
                  </Card>
                </div>
              </div>
            )}

            {/* WORKOUT TAB */}
            {activeTab === 'workout' && (
              <WorkoutGenerator
                workoutResult={workoutResult}
                setWorkoutResult={setWorkoutResult}
                workoutDuration={workoutDuration}
                setWorkoutDuration={setWorkoutDuration}
                workoutIntensity={workoutIntensity}
                setWorkoutIntensity={setWorkoutIntensity}
                onGenerate={handleGenerateWorkout}
                recommendations={recommendations}
                onPlayTrack={handlePlayTrack}
              />
            )}
          </main>
        </div>
      )}

      {/* FOOTER PLAYER */}
      {selectedTrack && (
        <footer className="footer-player fade-in">
          <div className="player-content flex-row">
            <div className="track-display">
              <span className="player-title">{selectedTrack.track_name}</span>
              <span className="player-artist">{selectedTrack.artists}</span>
            </div>
            <div className="player-controls">
              <Button
                variant="outline"
                style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0, color: 'var(--accent-primary)' }}
              >
                <Play fill="currentColor" />
              </Button>
            </div>
            <div className="player-actions" style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>BPM: {Math.round(selectedTrack.tempo)}</span>
              <Button
                variant="outline"
                onClick={() => {
                  setTrackToAddToPlaylist(selectedTrack);
                  setShowPlaylistSelector(true);
                }}
              >
                Add to Playlist
              </Button>
            </div>
          </div>
        </footer>
      )}

      {/* PLAYLIST SELECTOR MODAL */}
      {showPlaylistSelector && (
        <div className="modal-overlay" onClick={() => setShowPlaylistSelector(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', minWidth: '400px' }}>
            <h3>Add to Playlist</h3>
            <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>Add "{trackToAddToPlaylist?.track_name}" to one of your playlists</p>

            <div className="playlist-options" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1.5rem' }}>
              {playlists.map(p => (
                <div
                  key={p.id}
                  className="playlist-option-item"
                  onClick={() => handleAddToPlaylist(p.id)}
                  style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}
                >
                  {p.name} ({p.track_count} tracks)
                </div>
              ))}
              <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: '0.5rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.5rem' }}>Create New Playlist</p>
                <div className="flex-row">
                  <input
                    type="text"
                    className="input"
                    placeholder="Playlist name..."
                    value={playlistName}
                    onChange={e => setPlaylistName(e.target.value)}
                  />
                  <Button onClick={() => handleAddToPlaylist('new')}>Create</Button>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={() => setShowPlaylistSelector(false)} style={{ width: '100%' }}>Cancel</Button>
          </div>
        </div>
      )}

      {loading && <div className="loading-spinner">Loading...</div>}
    </div>
  )
}

export default App
