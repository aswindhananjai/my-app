import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../utils/auth';
import {
  getAllMyThoughts,
  createThought,
  updateThought,
  deleteThought,
  validateWordCount
} from '../utils/thoughts';
import '../styles/ManageThoughts.css';

export default function ManageThoughts() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const partnerName = currentUser === 'Aswin' ? 'Anu' : 'Aswin';

  const [thoughts, setThoughts] = useState([]);
  const [newThought, setNewThought] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Word count
  const [newThoughtWordCount, setNewThoughtWordCount] = useState(0);
  const [editWordCount, setEditWordCount] = useState(0);

  useEffect(() => {
    loadThoughts();
  }, []);

  async function loadThoughts() {
    setLoading(true);
    const data = await getAllMyThoughts();
    setThoughts(data);
    setLoading(false);
  }

  function handleNewThoughtChange(e) {
    const text = e.target.value;
    setNewThought(text);
    const { count } = validateWordCount(text);
    setNewThoughtWordCount(count);
  }

  function handleEditTextChange(e) {
    const text = e.target.value;
    setEditText(text);
    const { count } = validateWordCount(text);
    setEditWordCount(count);
  }

  async function handleAddThought() {
    if (!newThought.trim()) return;

    const { isValid } = validateWordCount(newThought);
    if (!isValid) {
      alert('Please keep your thought under 75 words.');
      return;
    }

    setSaving(true);
    try {
      await createThought(newThought);
      setNewThought('');
      setNewThoughtWordCount(0);
      await loadThoughts();
    } catch (error) {
      alert(error.message || 'Failed to save thought');
    } finally {
      setSaving(false);
    }
  }

  function handleEditClick(thought) {
    setEditingId(thought.id);
    setEditText(thought.message);
    const { count } = validateWordCount(thought.message);
    setEditWordCount(count);
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEditText('');
    setEditWordCount(0);
  }

  async function handleSaveEdit(id) {
    const { isValid } = validateWordCount(editText);
    if (!isValid) {
      alert('Please keep your thought under 75 words.');
      return;
    }

    try {
      await updateThought(id, editText);
      setEditingId(null);
      setEditText('');
      setEditWordCount(0);
      await loadThoughts();
    } catch (error) {
      alert(error.message || 'Failed to update thought');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this thought?')) return;

    try {
      await deleteThought(id);
      await loadThoughts();
    } catch (error) {
      alert('Failed to delete thought');
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatViewDate(dateString) {
    if (!dateString) return 'Never viewed';

    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  return (
    <div className="manage-thoughts-page">
      {/* Header */}
      <div className="manage-thoughts-header">
        <button className="back-btn" onClick={() => navigate('/settings')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="header-info">
          <h1 className="header-title">My thoughts</h1>
          <div className="header-subtitle">saved for {partnerName} 💙</div>
        </div>
      </div>

      {/* Add new thought section */}
      <div className="add-thought-section">
        <textarea
          className="add-thought-textarea"
          placeholder="Write a sweet thought for your partner..."
          value={newThought}
          onChange={handleNewThoughtChange}
          rows="3"
          maxLength="500"
        />
        <div className="add-thought-footer">
          <div className={`word-count ${newThoughtWordCount > 75 ? 'error' : ''}`}>
            {newThoughtWordCount} / 75 words
          </div>
          <button
            className="add-thought-button"
            onClick={handleAddThought}
            disabled={!newThought.trim() || newThoughtWordCount > 75 || saving}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {saving ? 'Saving...' : 'Add thought'}
          </button>
        </div>
      </div>

      {/* Thoughts list */}
      <div className="thoughts-list-container">
        {loading ? (
          <div className="thoughts-loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <>
            {thoughts.length > 0 && (
              <div className="thoughts-list-header">
                Your saved thoughts ({thoughts.length})
              </div>
            )}

            {thoughts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <div className="empty-text">No thoughts yet</div>
                <div className="empty-subtext">Add your first sweet thought for {partnerName}</div>
              </div>
            ) : (
              thoughts.map((thought) => {
                const isEditing = editingId === thought.id;

                return (
                  <div
                    key={thought.id}
                    className={`thought-item ${isEditing ? 'editing' : ''}`}
                  >
                    {isEditing ? (
                      <>
                        <textarea
                          className="edit-thought-textarea"
                          value={editText}
                          onChange={handleEditTextChange}
                          rows="4"
                          maxLength="500"
                          autoFocus
                        />
                        <div className="edit-thought-footer">
                          <div className={`word-count ${editWordCount > 75 ? 'error' : ''}`}>
                            {editWordCount} / 75 words
                          </div>
                          <div className="edit-thought-actions">
                            <button
                              className="cancel-edit-button"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                            <button
                              className="save-edit-button"
                              onClick={() => handleSaveEdit(thought.id)}
                              disabled={editWordCount > 75}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="thought-message">{thought.message}</div>
                        <div className="thought-meta">
                          <div className="thought-stats">
                            <span className="thought-stat">
                              👁️ {thought.view_count || 0} {thought.view_count === 1 ? 'view' : 'views'}
                            </span>
                            <span className="thought-stat-divider">·</span>
                            <span className="thought-stat">
                              {formatViewDate(thought.last_viewed_at)}
                            </span>
                          </div>
                          <div className="thought-date">
                            Added {formatDate(thought.created_at)}
                          </div>
                        </div>
                        <div className="thought-actions">
                          <button
                            className="edit-thought-button"
                            onClick={() => handleEditClick(thought)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
                            </svg>
                          </button>
                          <button
                            className="delete-thought-button"
                            onClick={() => handleDelete(thought.id)}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M8 6V4.5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2V6m2 0v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}
