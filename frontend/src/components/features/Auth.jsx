import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

const Auth = ({
    mode,
    setMode,
    email,
    setEmail,
    password,
    setPassword,
    onSubmit,
    error
}) => {
    return (
        <div className="auth-container card" style={{ maxWidth: '400px', margin: '2rem auto', textAlign: 'center' }}>
            <h2>{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <input
                    type="email"
                    placeholder="Email"
                    className="input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    className="input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <Button type="submit">{mode === 'login' ? 'Login' : 'Sign Up'}</Button>
            </form>
            {error && <p style={{ color: 'var(--error)', marginTop: '1rem' }}>{error}</p>}
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <span
                    onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); }}
                    style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    {mode === 'login' ? 'Sign Up' : 'Login'}
                </span>
            </p>
        </div>
    );
};

export default Auth;
