import React from 'react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';

ChartJS.register(
    RadialLinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const AudioVisualizer = ({ features, title = "Audio Profile", label = "Current" }) => {
    if (!features) return null;

    const labels = [
        'Danceability',
        'Energy',
        'Valence',
        'Acousticness',
        'Instrumentalness',
        'Speechiness',
    ];

    const dataValues = [
        features.danceability || 0,
        features.energy || 0,
        features.valence || 0,
        features.acousticness || 0,
        features.instrumentalness || 0,
        features.speechiness || 0,
    ];

    const data = {
        labels,
        datasets: [
            {
                label: label,
                data: dataValues,
                backgroundColor: 'rgba(29, 215, 96, 0.2)',
                borderColor: 'rgba(29, 215, 96, 1)',
                borderWidth: 2,
                pointBackgroundColor: 'rgba(29, 215, 96, 1)',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgba(29, 215, 96, 1)',
            },
        ],
    };

    const options = {
        scales: {
            r: {
                angleLines: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                },
                pointLabels: {
                    color: 'rgba(255, 255, 255, 0.7)',
                    font: {
                        size: 10,
                    },
                },
                ticks: {
                    display: false,
                    stepSize: 0.2,
                },
                suggestedMin: 0,
                suggestedMax: 1,
            },
        },
        plugins: {
            legend: {
                display: false,
            },
        },
        maintainAspectRatio: false,
    };

    return (
        <div style={{ height: '250px', width: '100%', position: 'relative' }}>
            <Radar data={data} options={options} />
        </div>
    );
};

export default AudioVisualizer;
