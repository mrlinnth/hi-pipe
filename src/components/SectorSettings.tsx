import { useState } from 'react';
type Props = {
  sectors: string[];
  onAdd: (name: string) => void;
  onRename: (index: number, name: string) => void;
  onDelete: (index: number) => void;
  onReset: () => void;
};

export function SectorSettings({ sectors, onAdd, onRename, onDelete, onReset }: Props) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [newValue, setNewValue] = useState<string>('');

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditValue(sectors[i]);
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (!trimmed) return;
    const isDuplicate = sectors.some((s: string, i: number) => i !== editingIndex && s.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return;
    onRename(editingIndex, trimmed);
    setEditingIndex(null);
    setEditValue('');
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newValue.trim();
    if (!trimmed) return;
    const isDuplicate = sectors.some((s: string) => s.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) return;
    onAdd(trimmed);
    setNewValue('');
  };

  return (
    <>
      <div className="stages-list">
        {sectors.length === 0 && (
          <p className="settings-hint">No sectors configured — add one below.</p>
        )}
        {sectors.map((sector: string, i: number) => (
          <div key={i} className="stage-row">
            {editingIndex === i ? (
              <div className="stage-edit">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') handleEditCancel(); }}
                  autoFocus
                />
                <button className="btn-save" onClick={handleEditSave}>✓</button>
                <button className="btn-cancel" onClick={handleEditCancel}>✗</button>
              </div>
            ) : (
              <>
                <div className="stage-info">
                  <span className="stage-name">{sector}</span>
                </div>
                <div className="stage-actions">
                  <button className="btn-edit" onClick={() => startEdit(i)}>Edit</button>
                  <button className="btn-delete" onClick={() => onDelete(i)}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="add-stage-form" onSubmit={handleAdd}>
        <h3>Add Sector</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Sector name"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button type="submit" className="btn-add">Add</button>
        </div>
      </form>

      <div className="settings-panel-footer">
        <button className="btn-clear-config" onClick={onReset}>Reset to defaults</button>
      </div>
    </>
  );
}
