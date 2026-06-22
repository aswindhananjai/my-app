import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import '../styles/MemoryDetail.css';

export default function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchMemory();
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const fetchMemory = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setMemory(data);
    } catch (error) {
      console.error('Error fetching memory:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (categoryId) => {
    return MEMORY_CATEGORIES.find(c => c.id === categoryId) || MEMORY_CATEGORIES[0];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleEdit = () => {
    setMenuOpen(false);
    navigate(`/edit/${id}`);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('memories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error deleting memory:', error);
      alert('Failed to delete memory');
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!memory) return null;

  const hasImage = Boolean(memory.image_url);
  const category = getCategoryInfo(memory.category);

  return (
    <div className="memory-detail-page">
      {/* Full-bleed hero — only when image exists */}
      {hasImage ? (
        <div className="detail-hero">
          <img className="detail-hero-img" src={memory.image_url} alt={memory.title} />

          {/* Overlay controls */}
          <div className="detail-overlay-controls">
            <button className="detail-ctrl-btn" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="detail-menu-wrap" ref={menuRef}>
              <button className="detail-ctrl-btn" onClick={() => setMenuOpen(v => !v)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              </button>
              {menuOpen && (
                <div className="detail-dropdown">
                  <button className="detail-dropdown-item" onClick={handleEdit}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <span>Edit</span>
                  </button>
                  <div className="detail-dropdown-divider" />
                  <button className="detail-dropdown-item danger" onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E0556F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Plain header when no image */
        <div className="detail-plain-header">
          <button className="detail-plain-back" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="detail-menu-wrap" ref={menuRef}>
            <button className="detail-plain-menu" onClick={() => setMenuOpen(v => !v)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="5" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </button>
            {menuOpen && (
              <div className="detail-dropdown">
                <button className="detail-dropdown-item" onClick={handleEdit}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  <span>Edit</span>
                </button>
                <div className="detail-dropdown-divider" />
                <button className="detail-dropdown-item danger" onClick={() => { setMenuOpen(false); setShowDeleteModal(true); }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#E0556F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scrollable body */}
      <div className="detail-body">
        {/* Category pill */}
        <div className="detail-category" style={{ color: category.textColor, background: category.color }}>
          <span>{category.emoji}</span>
          <span>{category.name}</span>
        </div>

        <h1 className="detail-title">{memory.title}</h1>

        {/* Meta row */}
        <div className="detail-meta">
          {memory.created_by && (
            <span className="detail-author">Added by {memory.created_by}</span>
          )}
          {memory.created_by && <span className="detail-meta-dot">·</span>}
          <span className="detail-date">{formatDate(memory.date)}</span>
        </div>

        {/* Location */}
        {memory.location && (
          <div className="detail-location">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {memory.location}
          </div>
        )}

        {/* Description */}
        {memory.description && (
          <div className="detail-description">
            <p>{memory.description}</p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="delete-modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E0556F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="delete-modal-title">Delete memory?</h3>
            <p className="delete-modal-msg">This memory will be permanently deleted and cannot be recovered.</p>
            <div className="delete-modal-actions">
              <button
                className="delete-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="delete-modal-confirm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
