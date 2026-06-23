import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import { getCurrentUser } from '../utils/auth';
import { createActivity } from '../utils/activities';
import '../styles/MemoryDetail.css';

export default function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/memories');
    }
  };
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const menuRef = useRef(null);
  const carouselRef = useRef(null);

  const currentUser = getCurrentUser();
  const [showVersionSheet, setShowVersionSheet] = useState(false);
  const [versionText, setVersionText] = useState('');
  const [savingVersion, setSavingVersion] = useState(false);

  const openVersionSheet = () => {
    setVersionText(memory?.partner_description || '');
    setMenuOpen(false);
    setShowVersionSheet(true);
  };

  const handleSaveVersion = async () => {
    setSavingVersion(true);
    try {
      const { error } = await supabase
        .from('memories')
        .update({
          partner_description: versionText,
          updated_by: currentUser,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchMemory();
      setShowVersionSheet(false);
    } catch (error) {
      console.error('Error saving partner version:', error);
      alert('Failed to save your version');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleDeleteVersion = async () => {
    if (!window.confirm("Are you sure you want to delete your note?")) return;
    setSavingVersion(true);
    try {
      const { error } = await supabase
        .from('memories')
        .update({
          partner_description: null,
          updated_by: currentUser,
        })
        .eq('id', id);

      if (error) throw error;
      await fetchMemory();
      setShowVersionSheet(false);
    } catch (error) {
      console.error('Error deleting partner version:', error);
      alert('Failed to delete your note');
    } finally {
      setSavingVersion(false);
    }
  };

  const handleScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    if (width > 0) {
      const activeIdx = Math.round(scrollLeft / width);
      setActiveImageIndex(activeIdx);
    }
  };

  const scrollToImage = (index) => {
    const container = carouselRef.current;
    if (container) {
      const width = container.offsetWidth;
      container.scrollTo({
        left: index * width,
        behavior: 'smooth'
      });
      setActiveImageIndex(index);
    }
  };

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
    navigate(`/edit/${id}`, { state: { from: location.state?.from } });
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      // Create activity for memory deletion before soft delete
      await createActivity(id, 'deleted', currentUser, memory.title, memory.category, memory.image_url);

      // Soft delete: set is_active to false instead of deleting the record
      const { error } = await supabase
        .from('memories')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;
      navigate('/memories');
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

  const getImagesList = () => {
    if (!memory || !memory.image_url) return [];
    try {
      if (memory.image_url.startsWith('[')) {
        return JSON.parse(memory.image_url);
      }
      return [memory.image_url];
    } catch (e) {
      return [memory.image_url];
    }
  };

  const imagesList = getImagesList();
  const hasImage = imagesList.length > 0;
  const categoryIds = memory.category ? memory.category.split(',').filter(Boolean) : ['first'];
  const categories = categoryIds.map(id => getCategoryInfo(id));

  const isCreator = currentUser === memory.created_by;
  const partnerName = memory.created_by === 'Aswin' ? 'Anu' : 'Aswin';
  const hasPartnerNote = Boolean(memory.partner_description);

  return (
    <div className="memory-detail-page">
      {/* Full-bleed hero — only when image exists */}
      {hasImage ? (
        <div className="detail-hero">
          {imagesList.length === 1 ? (
            <img className="detail-hero-img" src={imagesList[0]} alt={memory.title} />
          ) : (
            <>
              <div
                className="detail-carousel-container"
                ref={carouselRef}
                onScroll={handleScroll}
              >
                <div className="detail-carousel-track">
                  {imagesList.map((url, idx) => (
                    <img
                      key={idx}
                      className="detail-hero-img carousel-slide"
                      src={url}
                      alt={`${memory.title} slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Indicator dots — stationary overlay */}
              <div className="carousel-indicator-dots">
                {imagesList.map((_, i) => (
                  <div
                    key={i}
                    className={`carousel-dot ${i === activeImageIndex ? 'active' : ''}`}
                    onClick={() => scrollToImage(i)}
                  />
                ))}
              </div>
            </>
          )}

          {/* Overlay controls */}
          <div className="detail-overlay-controls">
            <button className="detail-ctrl-btn" onClick={handleBack}>
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
                  {!isCreator && (
                    <>
                      <button className="detail-dropdown-item" onClick={openVersionSheet}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        <span>{hasPartnerNote ? 'Edit my note' : 'Add my note'}</span>
                      </button>
                      <div className="detail-dropdown-divider" />
                    </>
                  )}
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
          <button className="detail-plain-back" onClick={handleBack}>
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
                {!isCreator && (
                  <>
                    <button className="detail-dropdown-item" onClick={openVersionSheet}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                      <span>{hasPartnerNote ? 'Edit my note' : 'Add my note'}</span>
                    </button>
                    <div className="detail-dropdown-divider" />
                  </>
                )}
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
        {/* Category pills */}
        <div className="detail-categories-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
          {categories.map(cat => (
            <div key={cat.id} className="detail-category" style={{ color: cat.textColor, background: cat.color, marginBottom: 0 }}>
              <span className="category-icon">{cat.icon}</span>
              <span>{cat.name}</span>
            </div>
          ))}
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

        {/* Partner description */}
        {hasPartnerNote ? (
          <div className="detail-partner-section">
            <h3 className="partner-section-title">Here is what {partnerName} has to say</h3>
            <div className="detail-partner-description-text">
              <p>{memory.partner_description}</p>
            </div>
          </div>
        ) : (
          !isCreator && (
            <div className="detail-add-partner-version">
              <button className="add-version-btn" onClick={openVersionSheet}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add your version
              </button>
            </div>
          )
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

      {/* Partner version bottom sheet */}
      {showVersionSheet && (
        <div className="bottom-sheet-overlay" onClick={() => !savingVersion && setShowVersionSheet(false)}>
          <div className="bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-header">
              <h3 className="bottom-sheet-title">{hasPartnerNote ? 'Edit your version' : 'Add your version'}</h3>
              <div className="bottom-sheet-header-actions">
                {hasPartnerNote && (
                  <button
                    className="bottom-sheet-delete-btn"
                    onClick={handleDeleteVersion}
                    disabled={savingVersion}
                    title="Delete note"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E0556F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                )}
                <button className="bottom-sheet-close" onClick={() => setShowVersionSheet(false)} disabled={savingVersion}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
            <textarea
              className="bottom-sheet-textarea"
              value={versionText}
              onChange={e => setVersionText(e.target.value)}
              placeholder="Write your side of the story..."
              rows="5"
              disabled={savingVersion}
              autoFocus
            />
            <button
              className="bottom-sheet-save-btn"
              onClick={handleSaveVersion}
              disabled={savingVersion || !versionText.trim()}
            >
              {savingVersion ? 'Saving...' : 'Save version'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
