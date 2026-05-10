import { useState } from 'react';
import { ConnectionSettings } from './ConnectionSettings';
import { StageSettings } from './StageSettings';
import { SectorSettings } from './SectorSettings';
import type { Stage } from '../types';

const TABS: Array<'connection' | 'stages' | 'sectors'> = ['connection', 'stages', 'sectors'];

export function SettingsPanel({
  initialTab,
  stages, onAdd, onEdit, onDelete, onReorder, dealCounts,
  sectors, onSectorAdd, onSectorRename, onSectorDelete, onSectorReset,
  isOnline,
  connectionError,
  onClose,
}: {
  initialTab?: 'connection' | 'stages' | 'sectors';
  stages: Stage[];
  onAdd: (data: Partial<Stage>) => void;
  onEdit: (id: string, data: Partial<Stage>) => void;
  onDelete: (id: string) => void;
  onReorder: (id: string, direction: 'up' | 'down') => void;
  dealCounts: Record<string, number>;
  sectors: string[];
  onSectorAdd: (name: string) => void;
  onSectorRename: (index: number, name: string) => void;
  onSectorDelete: (index: number) => void;
  onSectorReset: () => void;
  isOnline: boolean;
  connectionError: string | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'connection' | 'stages' | 'sectors'>(initialTab ?? 'stages');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Settings</h2>
        <button className="modal-close-btn" onClick={onClose}>×</button>

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
      </div>
    </div>
  );
}
