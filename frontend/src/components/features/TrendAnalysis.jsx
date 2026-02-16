import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, BarChart2, Zap, AlertTriangle } from 'lucide-react';
import { SERVICES } from '../../config';
import Card from '../common/Card';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const TrendAnalysis = () => {
    const [trends, setTrends] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${SERVICES.ANALYTICS}/api/v1/analytics/trends`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setTrends(response.data);
            } catch (err) {
                console.error("Failed to fetch trends", err);
            } finally {
                setLoading(false);
            }
        };
        fetchTrends();
    }, []);

    if (loading) return <div className="placeholder">Analyzing global data...</div>;
    if (!trends) return <div className="error-message">Failed to load trend data.</div>;

    const timelineData = {
        labels: trends.simulated_timeline.months,
        datasets: trends.simulated_timeline.trends.map((t, i) => ({
            label: t.genre,
            data: t.data,
            borderColor: `hsl(${i * 60}, 70%, 50%)`,
            backgroundColor: `hsla(${i * 60}, 70%, 50%, 0.5)`,
            tension: 0.4
        }))
    };

    const correlationData = {
        labels: Object.keys(trends.correlations).map(k => k.charAt(0).toUpperCase() + k.slice(1)),
        datasets: [{
            label: 'Correlation with Popularity',
            data: Object.values(trends.correlations),
            backgroundColor: Object.values(trends.correlations).map(v => v > 0 ? 'rgba(29, 215, 96, 0.6)' : 'rgba(255, 77, 77, 0.6)'),
            borderRadius: 8
        }]
    };

    return (
        <div className="trend-analysis fade-in">
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '2rem' }}>
                    <div className="flex-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                        <TrendingUp size={24} color="var(--accent-primary)" />
                        <h3>Rising Genres (Simulated Tends)</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Line
                            data={timelineData}
                            options={{
                                maintainAspectRatio: false,
                                plugins: { legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.7)' } } },
                                scales: {
                                    y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                                    x: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                                }
                            }}
                        />
                    </div>
                </Card>

                <Card style={{ padding: '2rem' }}>
                    <div className="flex-row" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                        <BarChart2 size={24} color="var(--accent-secondary)" />
                        <h3>Popularity Correlations</h3>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Bar
                            data={correlationData}
                            options={{
                                indexAxis: 'y',
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
                                    y: { grid: { display: false }, ticks: { color: 'rgba(255,255,255,0.5)' } }
                                }
                            }}
                        />
                    </div>
                </Card>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <Card style={{ padding: '1.5rem' }}>
                    <div className="flex-row" style={{ marginBottom: '1rem', gap: '0.8rem' }}>
                        <Zap size={20} color="#ecd06f" />
                        <h4 style={{ margin: 0 }}>Top 5 Trending Genres</h4>
                    </div>
                    {trends.rising_genres.slice(0, 5).map((g, i) => (
                        <div key={i} className="flex-row" style={{ justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ textTransform: 'capitalize' }}>{g.genre}</span>
                            <span style={{ fontWeight: 'bold', color: 'var(--accent-primary)' }}>{g.popularity.toFixed(1)}</span>
                        </div>
                    ))}
                </Card>

                <Card style={{ padding: '1.5rem' }}>
                    <div className="flex-row" style={{ marginBottom: '1rem', gap: '0.8rem' }}>
                        <AlertTriangle size={20} color="#6fbced" />
                        <h4 style={{ margin: 0 }}>Explicit Content Popularity</h4>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{trends.explicit_popularity[0]?.toFixed(1) || 0}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Clean</div>
                        </div>
                        <div style={{ textAlign: 'center', color: '#ff4d4d' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{trends.explicit_popularity[1]?.toFixed(1) || 0}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Explicit</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TrendAnalysis;
