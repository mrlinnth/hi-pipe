import { useState } from 'react';
import { ConnectionSettings } from './ConnectionSettings';
import { StageSettings } from './StageSettings';
import { SectorSettings } from './SectorSettings';

const TABS = ['connection', 'stages', 'sectors'];

export function SettingsPanel({
  initialTab,
  stages, onAdd, onEdit, onDelete, onReorder, dealCounts,
  sectors, onSectorAdd, onSectorRename, onSectorDelete, onSectorReset,
  isOnline,
  connectionError,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(initialTab ?? 'stages');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>

        <div className="settings-tabs">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`settings-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'connection' && (
          <ConnectionSettings asPanel isOnline={isOnline} onClose={onClose} connectionError={connectionError} />
        )}
        {activeTab === 'stages' && (
          <StageSettings
            asPanel
            stages={stages}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            onReorder={onReorder}
            dealCounts={dealCounts}
            onClose={onClose}
          />
        )}
        {activeTab === 'sectors' && (
          <SectorSettings
            sectors={sectors}
            onAdd={onSectorAdd}
            onRename={onSectorRename}
            onDelete={onSectorDelete}
            onReset={onSectorReset}
          />
        )}

        <button className="btn-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
