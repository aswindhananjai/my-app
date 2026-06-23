import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadImage } from '../utils/cloudinary';
import { getCurrentUser } from '../utils/auth';
import { MEMORY_CATEGORIES } from '../utils/constants';
import { sendMemoryAddedNotification } from '../utils/notifications';
import { createActivity } from '../utils/activities';
import { useKeyboardScroll } from '../hooks/useKeyboardScroll';
import '../styles/AddMemory.css';

export default function AddMemory() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEditMode = Boolean(id);
  const location = useLocation();
  const currentUser = getCurrentUser();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [images, setImages] = useState([]);
  const [partnerDescription, setPartnerDescription] = useState('');
  const [memoryCreator, setMemoryCreator] = useState(null);

  const isCreator = !isEditMode || (memoryCreator === currentUser);
  const otherPersonName = isEditMode
    ? (memoryCreator === 'Aswin' ? 'Anu' : 'Aswin')
    : (currentUser === 'Aswin' ? 'Anu' : 'Aswin');
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
  });
  const [errors, setErrors] = useState({ title: false, date: false, category: false });
  const [shake, setShake] = useState({ title: false, date: false, category: false });

  // Enable keyboard scroll adjustment
  useKeyboardScroll();

  // Load existing memory when editing
  useEffect(() => {
    if (!isEditMode) return;
    const loadMemory = async () => {
      try {
        const { data, error } = await supabase
          .from('memories')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        setFormData({
          category: data.category || 'first',
          title: data.title || '',
          date: data.date || new Date().toISOString().split('T')[0],
          description: data.description || '',
          location: data.location || '',
        });
        setPartnerDescription(data.partner_description || '');
        setMemoryCreator(data.created_by);
        
        if (data.image_url) {
          let urls = [];
          try {
            if (data.image_url.startsWith('[')) {
              urls = JSON.parse(data.image_url);
            } else {
              urls = [data.image_url];
            }
          } catch (e) {
            urls = [data.image_url];
          }
          setImages(urls.map((url, i) => ({
            id: `existing-${i}-${Math.random()}`,
            preview: url,
            file: null
          })));
        }
      } catch (err) {
        console.error('Failed to load memory:', err);
        navigate('/');
      } finally {
        setInitialLoading(false);
      }
    };
    loadMemory();
  }, [id]);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 5 - images.length;
    if (remaining <= 0) {
      alert('Maximum 5 photos allowed');
      return;
    }

    const validFiles = files.filter(f => f.type.startsWith('image/')).slice(0, remaining);

    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, { file, preview: reader.result, id: Date.now() + Math.random() }]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleImageRemove = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Drag-to-reorder handlers
  const handleDragStart = (e, index) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...images];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setImages(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // Long-press touch support for reordering
  const touchStartRef = useRef(null);
  const longPressTimer = useRef(null);
  const [draggingTouch, setDraggingTouch] = useState(false);

  const handleTouchStart = (e, index) => {
    touchStartRef.current = { index, startY: e.touches[0].clientY };
    longPressTimer.current = setTimeout(() => {
      setDragIndex(index);
      setDraggingTouch(true);
    }, 400);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (draggingTouch) {
      setDraggingTouch(false);
      setDragIndex(null);
      setDragOverIndex(null);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handleCategoryChange = (categoryId) => {
    const selected = formData.category ? formData.category.split(',').filter(Boolean) : [];
    let next;
    
    if (selected.includes(categoryId)) {
      if (selected.length > 1) {
        next = selected.filter(id => id !== categoryId);
      } else {
        next = selected;
      }
    } else {
      if (categoryId === 'first') {
        if (selected.length < 2) {
          next = [...selected, 'first'];
        } else {
          next = ['first'];
        }
      } else {
        if (selected.includes('first')) {
          next = ['first', categoryId];
        } else {
          next = [categoryId];
        }
      }
    }
    setFormData({ ...formData, category: next.join(',') });
    if (errors.category) {
      setErrors(prev => ({ ...prev, category: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasTitleError = !formData.title.trim();
    const hasDateError = !formData.date;
    const hasCategoryError = !formData.category;

    if (hasTitleError || hasDateError || hasCategoryError) {
      setErrors({ title: hasTitleError, date: hasDateError, category: hasCategoryError });
      setShake({ title: hasTitleError, date: hasDateError, category: hasCategoryError });
      
      // Reset shake state after animation ends to allow subsequent shakings
      setTimeout(() => {
        setShake({ title: false, date: false, category: false });
      }, 400);
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;
      let imageUploadWarning = false;

      // Upload new images and preserve existing URLs
      if (images.length > 0) {
        try {
          const urls = [];
          for (const img of images) {
            if (img.file) {
              try {
                const url = await uploadImage(img.file);
                urls.push(url);
              } catch (err) {
                console.error('Individual image upload failed:', err);
                imageUploadWarning = true;
              }
            } else {
              urls.push(img.preview);
            }
          }
          imageUrl = urls.length > 0 ? JSON.stringify(urls) : null;
        } catch (uploadError) {
          console.error('Image uploads failed:', uploadError);
          imageUploadWarning = true;
        }
      }

      const currentUser = getCurrentUser();

      if (isEditMode) {
        // Update existing memory
        const { error } = await supabase
          .from('memories')
          .update({
            ...formData,
            partner_description: partnerDescription,
            image_url: imageUrl,
            updated_by: currentUser,
          })
          .eq('id', id);
        if (error) throw error;

        // Create activity for memory update
        await createActivity(id, 'updated', currentUser, formData.title, formData.category, imageUrl);
      } else {
        // Insert new memory and return the created record to get the id
        const { data, error } = await supabase.from('memories').insert([{
          ...formData,
          image_url: imageUrl,
          created_by: currentUser,
          updated_by: currentUser,
        }]).select();
        if (error) throw error;

        // If insert succeeded and returned data, land on detail page
        if (data && data[0]) {
          if (imageUploadWarning) {
            alert('Note: Some photos could not be uploaded — check your Cloudinary configuration.');
          }

          // Create activity for memory creation
          await createActivity(data[0].id, 'created', currentUser, formData.title, formData.category, imageUrl);

          // Send notification to partner (only for new memories, not edits)
          try {
            await sendMemoryAddedNotification(formData.title, currentUser);
          } catch (error) {
            console.error('Error sending notification:', error);
          }
          // Go to memory detail page with replace: true to remove /add from history,
          // and state: { from: '/memories' } so back button takes user to see all memories page.
          navigate(`/memory/${data[0].id}`, { replace: true, state: { from: '/memories' } });
          return;
        }
      }

      if (imageUploadWarning) {
        alert('Note: Some photos could not be uploaded — check your Cloudinary configuration.');
      }

      // Send notification to partner (only for new memories, not edits)
      if (!isEditMode) {
        try {
          await sendMemoryAddedNotification(formData.title, currentUser);
        } catch (error) {
          console.error('Error sending notification:', error);
          // Don't block the flow if notification fails
        }
      }

      // Go back to where we came from or detail page
      if (isEditMode) {
        // Go back, but fallback to detail page if they refreshed or loaded directly
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate(`/memory/${id}`, { replace: true, state: { from: location.state?.from || '/memories' } });
        }
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Error saving memory:', error);
      alert(`Failed to save memory: ${error.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="add-memory-page">
      <div className="add-memory-scroll">
        {/* Header */}
        <div className="add-memory-header">
          <button className="back-button-rounded" onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="add-memory-title">{isEditMode ? 'Edit memory' : 'New memory'}</h1>
        </div>

        <form className="add-memory-form" onSubmit={handleSubmit} noValidate>
          {/* Photos Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="form-label">
                Photos <span className="label-optional">· optional</span>
              </div>
              <div className="photo-count">{images.length} of 5</div>
            </div>

            <div className="photos-grid">
              {/* Plus button always first */}
              {images.length < 5 && (
                <div className="photo-add" onClick={() => fileInputRef.current?.click()}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  <span>Add photo</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageAdd}
                    accept="image/*"
                    style={{ display: 'none' }}
                    multiple
                  />
                </div>
              )}

              {/* Uploaded photo previews */}
              {images.map((img, index) => (
                <div
                  key={img.id}
                  className={`photo-item ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchEnd={handleTouchEnd}
                >
                  <img src={img.preview} alt={`Preview ${index + 1}`} />
                  <button
                    type="button"
                    className="photo-remove"
                    onClick={() => handleImageRemove(index)}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round">
                      <path d="M6 6l12 12M18 6 6 18" />
                    </svg>
                  </button>
                  {images.length > 1 && (
                    <div className="drag-hint">⠿</div>
                  )}
                </div>
              ))}
            </div>
            {images.length > 1 && (
              <p className="drag-hint-text">Long press to reorder photos</p>
            )}
          </div>

          {/* Memory Type - Pills with labels, no flicker */}
          <div className="form-section">
            <div className={`form-label ${errors.category ? 'label-error' : ''}`}>Memory type</div>
            <div className={`category-pills ${shake.category ? 'shake-element' : ''}`}>
              {MEMORY_CATEGORIES.map((cat) => {
                const isSelected = formData.category ? formData.category.split(',').includes(cat.id) : false;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`category-pill${isSelected ? ' selected' : ''}`}
                    onClick={() => handleCategoryChange(cat.id)}
                  >
                    <span className="pill-icon">{cat.icon}</span>
                    <span className="pill-label">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="form-section">
            <div className="form-label">Title</div>
            <input
              type="text"
              name="title"
              className={`${errors.title ? 'input-error' : ''} ${shake.title ? 'shake-element' : ''}`}
              value={formData.title}
              onChange={handleChange}
              placeholder="Give this memory a title"
            />
          </div>

          {/* Date */}
          <div className="form-section">
            <div className="form-label">Date</div>
            <div className={`input-with-icon ${errors.date ? 'input-error' : ''} ${shake.date ? 'shake-element' : ''}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4.5" width="18" height="17" rx="3" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" />
              </svg>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Location */}
          <div className="form-section">
            <div className="form-label">
              Location <span className="label-optional">· optional</span>
            </div>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Add a place"
              />
            </div>
          </div>

          {/* Note (Creator's Version) */}
          <div className="form-section">
            <div className="form-label">
              Note <span className="label-optional">· optional</span>
            </div>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Tell the story of this moment…"
              rows="4"
            />
          </div>

          {/* Partner's Version (Only shown if it already exists in database) */}
          {isEditMode && partnerDescription && (
            <div className="form-section">
              <div className="form-label">
                {isCreator ? `${otherPersonName}'s version` : 'Your version'} <span className="label-optional">· optional</span>
              </div>
              <textarea
                name="partnerDescription"
                value={partnerDescription}
                onChange={(e) => setPartnerDescription(e.target.value)}
                placeholder="Partner's perspective of this moment…"
                rows="4"
              />
            </div>
          )}
        </form>
      </div>

      {/* Sticky Save Button */}
      <div className="sticky-save">
        <button
          className="save-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="#fff" />
          </svg>
          {loading ? 'Saving...' : (isEditMode ? 'Update memory' : 'Save memory')}
        </button>
      </div>
    </div>
  );
}
