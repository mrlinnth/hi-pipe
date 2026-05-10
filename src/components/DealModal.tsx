import { useState } from 'react';
import { PERIODS } from '../constants/options';

export function DealModal({ deal, stages, sectors, onSave, onDelete, onClose, saving = false, deleting = false, error = null }) {
  const [formData, setFormData] = useState(deal || {
    name: '',
    value: 0,
    stage: stages[0]?.slug || '',
    period: PERIODS[0] || '',
    sector: sectors[0] || '',
    notes: '',
    tags: '',
  });
  const [tags, setTags] = useState(deal?.tags ? deal.tags.split(',').map(t => t.trim()) : []);
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (saving || deleting) {
      return;
    }
    if (!formData.name.trim() || formData.value === '') {
      return;
    }
    onSave({
      ...formData,
      value: Number(formData.value),
      tags: tags.join(','),
    });
  };

  const handleAddTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handlePasteTags = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const newTags = pastedText.split(',').map(t => t.trim()).filter(t => t);
    const uniqueTags = [...new Set([...tags, ...newTags])];
    setTags(uniqueTags);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{deal ? 'Edit Deal' : 'New Deal'}</h2>
        
        {error && <div className="modal-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="value">Value (USD) *</label>
            <input
              id="value"
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="stage">Stage</label>
            <select
              id="stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            >
              {stages.map(stage => (
                <option key={stage._id} value={stage.slug}>{stage.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="period">Period</label>
            <select
              id="period"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value })}
            >
              {PERIODS.map(period => (
                <option key={period} value={period}>{period}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="sector">Sector</label>
            <select
              id="sector"
              value={formData.sector}
              onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
            >
              {sectors.length === 0
                ? <option disabled value="">No sectors configured</option>
                : sectors.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))
              }
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInputKeyDown}
              onPaste={handlePasteTags}
              placeholder="Press Enter or comma to add"
            />
            <div className="tags-list">
              {tags.map(tag => (
                <span key={tag} className="tag-chip">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>&times;</button>
                </span>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            {deal && (
              <div className="delete-section">
                {showDeleteConfirm ? (
                  <>
                    <span className="delete-confirm">Delete this deal?</span>
                    <button 
                      type="button" 
                      className="btn-delete-confirm" 
                      onClick={() => onDelete(deal._id)}
                      disabled={deleting}
                    >
                      {deleting ? 'Deleting...' : 'Yes'}
                    </button>
                    <button type="button" className="btn-delete-cancel" onClick={() => setShowDeleteConfirm(false)}>No</button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="btn-delete" 
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
            <div className="modal-actions" style={{ marginLeft: 'auto' }}>
              <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
              <button 
                type="submit" 
                className={`btn-save ${saving ? 'btn-loading' : ''}`}
                disabled={saving || deleting}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
