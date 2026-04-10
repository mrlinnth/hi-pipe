export function WelcomeModal({ onUseApi, onUseOffline }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content welcome-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Welcome to Hi Pipe</h2>
        <p className="settings-hint">
          Hi Pipe is a lightweight deal pipeline. Choose how you'd like to store your data:
        </p>

        <div className="welcome-modes">
          <div className="welcome-mode-card">
            <div className="welcome-mode-label">Online</div>
            <strong>Cockpit CMS</strong>
            <p>Enter your Cockpit API URL and token. Deals and stages sync to your own backend.</p>
          </div>
          <div className="welcome-mode-card">
            <div className="welcome-mode-label">Offline</div>
            <strong>Browser Storage</strong>
            <p>No backend needed. Data lives in localStorage. Works standalone, any time.</p>
          </div>
        </div>

        <div className="welcome-actions">
          <button className="btn-save" onClick={onUseApi}>Use with Cockpit API</button>
          <button className="btn-cancel" onClick={onUseOffline}>Use offline / localStorage</button>
        </div>
      </div>
    </div>
  );
}
