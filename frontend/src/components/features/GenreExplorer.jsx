import React from 'react';
import { Sliders, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import TrackList from '../common/TrackList';
import AudioVisualizer from './AudioVisualizer';

const GenreExplorer = ({
    genres,
    selectedGenre,
    setSelectedGenre,
    genreAnalytics,
    recommendations,
    onGenreClick,
    onPlayTrack
}) => {
    if (!selectedGenre) {
        return (
            <div className="genres-list">
                <h3>All Genres ({genres.length})</h3>
                <div className="flex-row" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                    {genres.map(genre => (
                        <span
                            key={genre}
                            className="genre-tag"
                            onClick={() => onGenreClick(genre)}
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
        );
    }

    return (
        <div className="recommendations-section">
            <Button variant="outline" onClick={() => setSelectedGenre(null)} style={{ marginBottom: '1rem' }}>← Back to Genres</Button>

            {genreAnalytics && (
                <div className="genre-analytics-dashboard fade-in" style={{ marginBottom: '3rem' }}>
                    <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <TrendingUp size={32} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ margin: '0.5rem 0', fontSize: '1.2rem' }}>Popularity</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                {genreAnalytics.popularity_stats.avg.toFixed(0)}
                            </div>
                            <p style={{ color: 'var(--text-dim)', margin: 0, fontSize: '0.9rem' }}>Avg Popularity Score</p>
                        </Card>

                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Top {selectedGenre} Artists</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {genreAnalytics.top_artists.map((artist, i) => (
                                    <div key={i} className="flex-row" style={{ justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span style={{ fontWeight: '500' }}>{artist.name}</span>
                                        <span style={{ color: 'var(--text-dim)' }}>{artist.track_count} tracks</span>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Added Radar Chart for Genre DNA */}
                        <Card style={{ padding: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Genre DNA</h3>
                            <AudioVisualizer features={genreAnalytics.average_features} label={selectedGenre} />
                        </Card>
                    </div>

                    <Card style={{ padding: '2rem' }}>
                        <div className="flex-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                            <Sliders size={24} color="var(--accent-primary)" />
                            <h3 style={{ margin: 0 }}>Feature Breakdown: {selectedGenre}</h3>
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
                    </Card>
                </div>
            )}

            <h2>Top Tracks in {selectedGenre}</h2>
            <TrackList tracks={recommendations} onPlay={onPlayTrack} />
        </div>
    );
};

export default GenreExplorer;
