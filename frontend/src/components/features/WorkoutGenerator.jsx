import React from 'react';
import { Dumbbell, Play } from 'lucide-react';
import Button from '../common/Button';
import Card from '../common/Card';
import TrackList from '../common/TrackList';

const WorkoutGenerator = ({
    workoutResult,
    setWorkoutResult,
    workoutDuration,
    setWorkoutDuration,
    workoutIntensity,
    setWorkoutIntensity,
    onGenerate,
    recommendations,
    onPlayTrack
}) => {
    if (!workoutResult) {
        return (
            <Card style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem', textAlign: 'center' }}>
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

                <Button onClick={onGenerate} style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem' }}>
                    Generate My Workout Mix
                </Button>
            </Card>
        );
    }

    return (
        <div className="workout-results">
            <Card className="flex-row" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ margin: 0 }}>{workoutResult.name}</h2>
                    <p style={{ color: 'var(--text-dim)', margin: 0 }}>{workoutResult.total_tracks} tracks • {workoutResult.duration_requested} minutes target</p>
                </div>
                <Button variant="outline" onClick={() => setWorkoutResult(null)}>Edit Criteria</Button>
            </Card>

            <div className="recommendations-section">
                <div className="track-list grid-view" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {recommendations.map((track, index) => {
                        const warmupEnd = Math.max(1, Math.floor(recommendations.length * 0.2));
                        const peakEnd = Math.max(warmupEnd + 1, Math.floor(recommendations.length * 0.8));
                        let phaseLabel = "Peak";
                        let phaseColor = "var(--accent-primary)";

                        if (index < warmupEnd) {
                            phaseLabel = "Warm-up";
                            phaseColor = "#ecd06f";
                        } else if (index >= peakEnd) {
                            phaseLabel = "Cool-down";
                            phaseColor = "#6fbced";
                        }

                        return (
                            <Card key={`${track.track_id}-${index}`} className="track-item" style={{ borderLeft: `4px solid ${phaseColor}`, position: 'relative' }}>
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
                                    <Button
                                        variant="outline"
                                        style={{ padding: '8px', borderRadius: '50%', color: 'var(--accent-primary)', borderColor: 'rgba(29, 215, 96, 0.2)' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPlayTrack(track);
                                        }}
                                    >
                                        <Play size={14} fill="currentColor" />
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WorkoutGenerator;
