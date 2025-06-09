import React, { useEffect, useState, useRef } from 'react';
import './style.css';

type QueueItem = {
  number: string;
  counter: string;
};

const ws = new WebSocket('ws://' + window.location.hostname + ':5000');

function App() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [current, setCurrent] = useState<QueueItem | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [prevCurrentNumber, setPrevCurrentNumber] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'init' || data.type === 'update') {
        setQueue(data.queue);
        setCurrent(data.current);
      }

      if (data.type === 'admin_login_success') {
        setAdminLoggedIn(true);
        setLoginError('');
        setAdminPassword('');
      }

      if (data.type === 'admin_login_failed') {
        setLoginError('Incorrect password');
      }
    };
  }, []);

  // Play ringing sound ONLY when current changes to a DIFFERENT number (call next)
  useEffect(() => {
    if (
      current &&
      current.number !== prevCurrentNumber &&
      audioRef.current
    ) {
      audioRef.current.play().catch(() => {});
    }
    setPrevCurrentNumber(current ? current.number : null);
  }, [current]);

  // Announce after ring tone ends
  useEffect(() => {
    if (!audioRef.current) return;

    const audioEl = audioRef.current;

    const announceCurrent = () => {
      if (current && window.speechSynthesis) {
        const msg = new SpeechSynthesisUtterance(
          `${current.number}. Please go to ${current.counter}`
        );
        msg.lang = 'en-US';
        window.speechSynthesis.speak(msg);
      }
    };

    audioEl.addEventListener('ended', announceCurrent);

    return () => {
      audioEl.removeEventListener('ended', announceCurrent);
    };
  }, [current]);

  const handleEnqueue = (type: string) => {
    const prefix = type === 'B' ? 'B' : 'A';
    const counter = type === 'B' ? 'Pick-Up counter' : `Counter ${Math.floor(Math.random() * 2) + 1}`;
    const number = prefix + Math.floor(Math.random() * 100);
    ws.send(JSON.stringify({ type: 'enqueue', number, counter }));
    setShowOptions(false);
  };

  const handleAdminLogin = () => {
    ws.send(JSON.stringify({ type: 'admin_login', password: adminPassword }));
  };

  const handleLogout = () => {
    setAdminLoggedIn(false);
    setAdminPassword('');
    setLoginError('');
  };

  const handleNext = () => {
    ws.send(JSON.stringify({ type: 'next' }));
  };

  const handleRemove = (number: string) => {
    ws.send(JSON.stringify({ type: 'remove', number }));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear the entire queue?')) {
      ws.send(JSON.stringify({ type: 'clear_all' }));
    }
  };

  return (
    <div className="container">
      <header className="header">Some random ahh Queue system</header>
      <div className="grid">
        <div className="box queue">
          <h2>Queue:</h2>
          {queue.length === 0 && <p>No one in queue.</p>}
          {queue.map((item, index) => (
            <div key={index} className="queue-item">
              <strong>{item.number}</strong> &gt;&gt; {item.counter}
              {adminLoggedIn && (
                <button
                  onClick={() => handleRemove(item.number)}
                  className="remove-btn"
                  title="Remove"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="box now-calling">
          <h2>Now Calling: {current ? current.number : '--'}</h2>
        </div>

        <div className="box counter-msg">
          <h2>{current ? 'Please go to ' + current.counter : 'Waiting for next...'}</h2>
        </div>

        <div className="box queue-up">
          {!showOptions ? (
            <button className="btn-primary" onClick={() => setShowOptions(true)}>Queue up</button>
          ) : (
            <div className="options">
              <button className="btn-secondary" onClick={() => handleEnqueue('A')}>Prescription</button>
              <button className="btn-secondary" onClick={() => handleEnqueue('B')}>Pickup - B Group</button>
              <button className="btn-secondary" onClick={() => handleEnqueue('A')}>Normal Checkout</button>
            </div>
          )}
        </div>

        <div className="box admin-section">
          {!adminLoggedIn ? (
            <div className="admin-login">
              <h3>Admin Login</h3>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                className="admin-input"
              />
              <button className="btn-primary" onClick={handleAdminLogin}>Login</button>
              {loginError && <p className="error-text">{loginError}</p>}
            </div>
          ) : (
            <div className="admin-panel">
              <h3>Admin Panel</h3>
              <div className="admin-buttons">
                <button className="btn-primary" onClick={handleNext}>Call Next</button>
                <button className="btn-danger" onClick={handleClearAll}>Clear All</button>
                <button className="btn-logout" onClick={handleLogout}>Logout</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <audio ref={audioRef} src="/call-tone.opus" preload="auto" />
    </div>
  );
}

export default App;
