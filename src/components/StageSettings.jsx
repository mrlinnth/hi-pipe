import { useState } from 'react';

export function StageSettings({ stages, onAdd, onEdit, onDelete, onReorder, onClose, dealCounts, asPanel }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', color: '' });
  const [newForm, setNewForm] = useState({ name: '', color: '#1A1A18' });

  const handleEditClick = (stage) => {
    setEditingId(stage._id);
    setEditForm({ name: stage.name, color: stage.color });
  };

  const handleEditSave = (id) => {
    onEdit(id, editForm);
    setEditingId(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditForm({ name: '', color: '' });
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    onAdd({ name: newForm.name, color: newForm.color });
    setNewForm({ name: '', color: '#1A1A18' });
  };

  const content = (
    <>
      <div className="stages-list">
        {stages.map((stage, index) => (
          <div key={stage._id} className="stage-row">
            {editingId === stage._id ? (
              <div className="stage-edit">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                />
                <button className="btn-save" onClick={() => handleEditSave(stage._id)}>✓</button>
                <button className="btn-cancel" onClick={handleEditCancel}>✗</button>
              </div>
            ) : (
              <>
                <div className="stage-info">
                  <div className="color-swatch" style={{ backgroundColor: stage.color }}></div>
                  <span className="stage-name">{stage.name}</span>
                </div>
                <div className="stage-actions">
                  <button
                    className="btn-reorder"
                    onClick={() => onReorder(stage._id, 'up')}
                    disabled={index === 0}
                  >↑</button>
                  <button
                    className="btn-reorder"
                    onClick={() => onReorder(stage._id, 'down')}
                    disabled={index === stages.length - 1}
                  >↓</button>
                  <button className="btn-edit" onClick={() => handleEditClick(stage)}>Edit</button>
                  <button
                    className="btn-delete"
                    onClick={() => onDelete(stage._id)}
                    disabled={dealCounts[stage.slug] > 0}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="add-stage-form" onSubmit={handleAddSubmit}>
        <h3>Add New Stage</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Stage name"
            value={newForm.name}
            onChange={(e) => setNewForm({ ...newForm, name: e.target.value })}
          />
          <input
            type="color"
            value={newForm.color}
            onChange={(e) => setNewForm({ ...newForm, color: e.target.value })}
          />
          <button type="submit" className="btn-add">Add</button>
        </div>
      </form>

      {!asPanel && <button className="btn-close" onClick={onClose}>Close</button>}
    </>
  );

  if (asPanel) return content;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Stage Settings</h2>
        {content}
      </div>
    </div>
  );
}
