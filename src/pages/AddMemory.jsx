import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { uploadImage } from '../utils/cloudinary';
import { getCurrentUser } from '../utils/auth';
import { MEMORY_CATEGORIES } from '../utils/constants';
import '../styles/AddMemory.css';

export default function AddMemory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [formData, setFormData] = useState({
    category: 'date',
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
  });

  const handleImageAdd = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (images.length >= 5) {
      alert('Maximum 5 photos allowed');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImages([...images, { file, preview: reader.result }]);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
      let imageUrl = null;

      // Upload first image to Cloudinary if available
      if (images.length > 0) {
        imageUrl = await uploadImage(images[0].file);
      }

      // Save memory to Supabase with current user
      const currentUser = getCurrentUser();
      const { error } = await supabase.from('memories').insert([
        {
          ...formData,
          image_url: imageUrl,
          created_by: currentUser,
          updated_by: currentUser,
        },
      ]);

      if (error) throw error;

      navigate('/');
    } catch (error) {
      console.error('Error saving memory:', error);
      alert('Failed to save memory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="add-memory-title">New memory</h1>
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
            <div className="photos-grid">
              {images.map((image, index) => (
                <div key={index} className="photo-item">
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
                </div>
              ))}
              {images.length < 5 && (
                <label className="photo-add">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  <span>Add</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageAdd}
                    style={{ display: 'none' }}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Memory Type */}
          <div className="form-section">
            <div className="form-label">Memory type</div>
            <div className="category-pills">
              {MEMORY_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${formData.category === cat.id ? 'selected' : ''}`}
                  onClick={() => handleCategoryChange(cat.id)}
                >
                  {cat.emoji} {cat.name}
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
          {loading ? 'Saving...' : 'Save memory'}
        </button>
      </div>
    </div>
  );
}
