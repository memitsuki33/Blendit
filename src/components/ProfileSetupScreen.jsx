import React, { useState } from 'react';

export default function ProfileSetupScreen({ onProceed }) {
  const [username, setUsername] = useState('');
  const [sex, setSex] = useState('');
  const [birthdate, setBirthdate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (onProceed) onProceed({ username, sex, birthdate });
  }

  return (
    <div className="auth-screen">
      <div className="landing-bg" />

      {/* Top-left mini logo */}
      <img src="/logo.png" alt="BlendIt" className="auth-mini-logo" draggable={false} />

      {/* Card */}
      <form className="auth-card profile-card" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-title profile-title">
          <span>Set</span>up
        </h1>

        {/* Username */}
        <div className="auth-field">
          <label className="auth-label" htmlFor="profile-username">Username:</label>
          <input
            id="profile-username"
            className="auth-input"
            type="text"
            placeholder="memitsuki33"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        {/* Sex + Birthdate row */}
        <div className="profile-row">
          <div className="auth-field profile-field-sex">
            <label className="auth-label" htmlFor="profile-sex">Sex:</label>
            <div className="profile-select-wrap">
              <select
                id="profile-sex"
                className="auth-input profile-select"
                value={sex}
                onChange={e => setSex(e.target.value)}
              >
                <option value="" disabled>Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="auth-field profile-field-birth">
            <label className="auth-label" htmlFor="profile-birth">Birthdate:</label>
            <input
              id="profile-birth"
              className="auth-input profile-date"
              type="date"
              placeholder="mm/dd/yyyy"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
            />
          </div>
        </div>

        {/* Warning notice */}
        <div className="profile-notice">
          Your date of birth <span className="profile-notice-highlight">cannot be changed</span> once
          set. If you need to correct it, please contact customer service.
        </div>

        <button type="submit" className="auth-submit-btn profile-proceed-btn">Proceed</button>
      </form>
    </div>
  );
}
