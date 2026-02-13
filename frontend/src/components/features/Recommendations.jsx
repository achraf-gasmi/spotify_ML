import React from 'react';
import TrackList from '../common/TrackList';

const Recommendations = ({
    title,
    tracks,
    onPlay,
    onAddToPlaylist,
    selectedTrackId,
    showSimilarity = true
}) => {
    return (
        <div className="recommendations-section">
            <h2 style={{ marginBottom: '1.5rem' }}>{title}</h2>
            <TrackList
                tracks={tracks}
                onPlay={onPlay}
                onAddToPlaylist={onAddToPlaylist}
                selectedTrackId={selectedTrackId}
                showSimilarity={showSimilarity}
            />
        </div>
    );
};

export default Recommendations;
