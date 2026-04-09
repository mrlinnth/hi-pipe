import { useState } from 'react';
import { saveApiConfig, clearApiConfig } from '../storage';

export function ConnectionSettings({ onClose, isOnline }) {
  const [url, setUrl] = useState(() => localStorage.getItem('hipipe_api_url') ?? '');
  const [key, setKey] = useState(() => localStorage.getItem('hipipe_api_key') ?? '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    saveApiConfig(url, key);
    setSaved(true);
    setTimeout(() => window.location.reload(), 800);
  };

  const handleClear = () => {
    clearApiConfig();
    setUrl('');
    setKey('');
    setSaved(true);
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>API Connection</h2>
        <p className="settings-hint">
          Enter your Cockpit CMS credentials to sync data. Leave blank to work
          in offline/local mode — your data stays in the browser.
        </p>

        <div className={`connection-status-row ${isOnline ? 'online' : 'offline'}`}>
          <span className="connection-dot" />
          {isOnline ? 'Connected to Cockpit' : 'Offline — using local storage'}
        </div>

        {saved && <div className="settings-saved">Saved. Reloading…</div>}

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label htmlFor="cs-url">Cockpit API URL</label>
            <input
              id="cs-url"
              type="url"
              value={url}
              placeholder={import.meta.env.VITE_COCKPIT_API_URL || 'https://your-cockpit.example.com/api'}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cs-key">API Token</label>
            <input
              id="cs-key"
              type="password"
              value={key}
              placeholder={import.meta.env.VITE_COCKPIT_API_KEY ? '(env var set)' : 'your-api-key'}
              onChange={(e) => setKey(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="settings-footer">
            <button type="button" className="btn-clear-config" onClick={handleClear}>
              Clear &amp; go offline
            </button>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-save">Save &amp; Reconnect</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
