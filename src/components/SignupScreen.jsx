import React, { useState } from 'react';

export default function SignupScreen({ onBack, onSignup }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (onSignup) onSignup({ email, password, confirm });
  }

  return (
    <div className="auth-screen">
      <img src="/group46.png" alt="" aria-hidden="true" className="auth-group46-bg" />

      {/* Top-left mini logo */}
      <img src="/logo.png" alt="BlendIt" className="auth-mini-logo" draggable={false} />

      {/* Card */}
      <form className="auth-card" onSubmit={handleSubmit} noValidate>
        <div className="auth-card-header">
          <button type="button" className="auth-back-btn" onClick={onBack}>Back</button>
          <h1 className="auth-title">
            <span>Sign</span>up
          </h1>
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-email">Email/Username:</label>
          <input
            id="signup-email"
            className="auth-input"
            type="text"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-password">Password:</label>
          <input
            id="signup-password"
            className="auth-input"
            type="password"
            placeholder="xxxxxx"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <div className="auth-field">
          <label className="auth-label" htmlFor="signup-confirm">Comfirm Password:</label>
          <input
            id="signup-confirm"
            className="auth-input"
            type="password"
            placeholder="xxxxxx"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="auth-submit-btn">Sign up</button>

        <div className="auth-divider">
          <span />
          <span className="auth-divider-text">or</span>
          <span />
        </div>

        <button type="button" className="auth-google-btn">
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.08-6.08C34.46 3.1 29.5 1 24 1 14.82 1 7.03 6.48 3.46 14.22l7.08 5.5C12.27 13.46 17.68 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.54 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.97-2.2 5.48-4.7 7.16l7.24 5.62C43.18 37.3 46.54 31.37 46.54 24.5z"/>
            <path fill="#FBBC05" d="M10.54 28.28A14.52 14.52 0 0 1 9.5 24c0-1.49.25-2.93.7-4.28l-7.08-5.5A23.02 23.02 0 0 0 1 24c0 3.7.87 7.2 2.4 10.3l7.14-6.02z"/>
            <path fill="#34A853" d="M24 47c6.48 0 11.93-2.14 15.9-5.82l-7.24-5.62c-2.17 1.45-4.94 2.3-8.66 2.3-6.32 0-11.73-4.27-13.66-10.06l-7.14 6.02C7.03 41.52 14.82 47 24 47z"/>
          </svg>
          Sign up with Google
        </button>
      </form>
    </div>
  );
}
