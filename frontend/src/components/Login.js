import React, { useState } from 'react';
import axios from 'axios';

const sampleLogins = [
  {
    label: 'Admin (seed z bazy)',
    email: 'admin@example.com',
    username: 'admin',
    password: 'ChangeMe!123',
  },
  {
    label: 'Konto demo pacjenta (jeśli utworzone)',
    email: 'pacjent@example.com',
    username: 'pacjent',
    password: 'Password1!',
  },
  {
    label: 'Konto demo lekarza (jeśli utworzone)',
    email: 'lekarz@example.com',
    username: 'lekarz',
    password: 'Password1!',
  },
];

export default function Login({ onLogin }) {
  const [emailOrUsername, setEmailOrUsername] = useState(sampleLogins[0].email);
  const [password, setPassword] = useState(sampleLogins[0].password);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { emailOrUsername, password });
      onLogin(res.data.token);
      setError('');
    } catch (err) {
      setError('Nie udało się zalogować.');
    }
  };

  return (
    <div className="login-shell">
      <div className="stack" style={{ gap: 16 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: '0 0 6px 0' }}>Zaloguj się</h2>
          <div className="muted small">Wpisz e-mail lub nazwę użytkownika z bazy.</div>
        </div>

        <form onSubmit={submit} className="stack" style={{ gap: 10 }}>
          <input
            list="demo-logins"
            placeholder="Email lub nazwa użytkownika"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            autoComplete="username"
          />
          <datalist id="demo-logins">
            {sampleLogins.map((item) => (
              <option key={item.email} value={item.email}>{`${item.username} (${item.email})`}</option>
            ))}
          </datalist>
          <input
            placeholder="Hasło"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && <div style={{ color: '#ff8080', fontSize: 14 }}>{error}</div>}
          <button type="submit">Zaloguj</button>
        </form>

        <div className="panel" style={{ padding: 12 }}>
          <div className="panel-head" style={{ marginBottom: 8 }}>
            <strong>Przykładowe loginy</strong>
          </div>
          <div className="pill-list">
            {sampleLogins.map((item) => (
              <div key={item.email} className="pill" style={{ alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div><strong>{item.label}</strong></div>
                  <div className="muted small">Email: {item.email}</div>
                  <div className="muted small">Login: {item.username}</div>
                  <div className="muted small">Hasło: {item.password}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="muted small" style={{ marginTop: 6 }}>Admin jest seedowany; pozostałe konta użyj, jeśli istnieją lub utwórz w panelu.</div>
        </div>
      </div>
    </div>
  );
}
