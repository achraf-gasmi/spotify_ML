import React from 'react';
import { Play, Music } from 'lucide-react';
import Button from './Button';

const TrackList = ({
    tracks,
    onPlay,
    onAddToPlaylist,
    selectedTrackId,
    showSimilarity = false
}) => {
    if (!tracks || tracks.length === 0) {
        return <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No tracks found.</p>;
    }

    return (
        <div className="track-list">
            {tracks.map((track, index) => (
                <div
                    key={`${track.track_id}-${index}`}
                    className={`card track-item ${selectedTrackId === track.track_id ? 'selected' : ''}`}
                >
                    <div className="track-info">
                        <span className="track-title" style={{ fontWeight: '600', color: 'var(--text-main)', display: 'block' }}>{track.track_name}</span>
                        <span className="track-artist" style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{track.artists}</span>

                        {track.match_details && (
                            <div className="match-explanation" style={{ marginTop: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {Object.entries(track.match_details)
                                    .filter(([_, val]) => val > 0.9) // Show only high matches
                                    .slice(0, 3) // Show top 3
                                    .map(([key, val]) => (
                                        <span key={key} style={{
                                            fontSize: '0.65rem',
                                            background: 'rgba(29, 215, 96, 0.1)',
                                            color: 'var(--accent-primary)',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            border: '1px solid rgba(29, 215, 96, 0.2)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {key} match
                                        </span>
                                    ))
                                }
                            </div>
                        )}

                        {!track.match_details && track.tempo && (
                            <div className="flex-row" style={{ marginTop: '0.5rem', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                                <span>BPM: {Math.round(track.tempo)}</span>
                                <span>Energy: {Math.round(track.energy * 100)}%</span>
                            </div>
                        )}
                    </div>
                    <div className="flex-row" style={{ gap: '0.5rem' }}>
                        {showSimilarity && track.similarity_score !== undefined && (
                            <div className="similarity-score" style={{ color: 'var(--accent-primary)', fontSize: '0.8rem', fontWeight: '600', marginRight: '0.5rem' }}>
                                {(track.similarity_score * 100).toFixed(0)}% Match
                            </div>
                        )}

                        {onPlay && (
                            <Button
                                variant="outline"
                                style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPlay(track);
                                }}
                            >
                                <Play size={14} fill="currentColor" />
                            </Button>
                        )}

                        {onAddToPlaylist && (
                            <Button
                                variant="outline"
                                style={{ padding: '8px', borderRadius: '50%' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddToPlaylist(track);
                                }}
                            >
                                <Music size={14} />
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TrackList;
