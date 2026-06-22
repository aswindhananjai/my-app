import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadImage } from '../utils/cloudinary';
import { getCurrentUser } from '../utils/auth';
import { MEMORY_CATEGORIES } from '../utils/constants';
import '../styles/AddMemory.css';

export default function AddMemory() {
  const navigate = useNavigate();
  const { id } = useParams(); // present when editing
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [images, setImages] = useState([]);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    category: 'first',
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
  });

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
        if (data.image_url) setExistingImageUrl(data.image_url);
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoryChange = (categoryId) => {
    setFormData({ ...formData, category: categoryId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      alert('Please fill in title and date');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = existingImageUrl; // keep existing image by default
      let imageUploadWarning = false;

      // Try to upload new image if added
      if (images.length > 0) {
        try {
          imageUrl = await uploadImage(images[0].file);
        } catch (uploadError) {
          console.error('Image upload failed, saving without image:', uploadError);
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
            image_url: imageUrl,
            updated_by: currentUser,
          })
          .eq('id', id);
        if (error) throw error;
      } else {
        // Insert new memory
        const { error } = await supabase.from('memories').insert([{
          ...formData,
          image_url: imageUrl,
          created_by: currentUser,
          updated_by: currentUser,
        }]);
        if (error) throw error;
      }

      if (imageUploadWarning) {
        alert('Memory saved! Note: The photo could not be uploaded — check your Cloudinary cloud name and upload preset in .env');
      }

      // Go back to where we came from
      navigate(isEditMode ? `/memory/${id}` : '/');
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

        <form className="add-memory-form" onSubmit={handleSubmit}>
          {/* Photos Section */}
          <div className="form-section">
            <div className="section-header">
              <div className="form-label">
                Photos <span className="label-optional">· optional</span>
              </div>
              <div className="photo-count">{images.length} of 5</div>
            </div>

            {/* Show existing image in edit mode */}
            {isEditMode && existingImageUrl && images.length === 0 && (
              <div className="existing-image-preview">
                <img src={existingImageUrl} alt="Current" />
                <p className="existing-image-label">Current photo — add new photo below to replace</p>
              </div>
            )}

            <div className="photos-grid">
              {/* Plus button always first */}
              {images.length < 5 && (
                <label className="photo-add" htmlFor="photo-input">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Add</span>
                  <input
                    id="photo-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageAdd}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {/* Uploaded images to the right */}
              {images.map((image, index) => (
                <div
                  key={image.id || index}
                  className={`photo-item ${dragIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchEnd={handleTouchEnd}
                >
                  <img src={image.preview} alt={`Upload ${index + 1}`} />
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
            <div className="form-label">Memory type</div>
            <div className="category-pills">
              {MEMORY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill${formData.category === cat.id ? ' selected' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  <span className="pill-emoji">{cat.emoji}</span>
                  <span className="pill-label">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="form-section">
            <div className="form-label">Title</div>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Give this memory a title"
              required
            />
          </div>

          {/* Date */}
          <div className="form-section">
            <div className="form-label">Date</div>
            <div className="input-with-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4.5" width="18" height="17" rx="3" />
                <path d="M3 9h18M8 2.5v4M16 2.5v4" />
              </svg>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
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

          {/* Note */}
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
