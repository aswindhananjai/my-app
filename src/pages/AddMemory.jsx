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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    category: 'moment',
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    location: '',
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.date) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      let imageUrl = null;

      // Upload image to Cloudinary if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
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
      <header className="add-memory-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1>Add Memory</h1>
        <div className="header-spacer"></div>
      </header>

      <form className="add-memory-form" onSubmit={handleSubmit}>
        {/* Image Upload */}
        <div className="form-section">
          <label className="image-upload-label">
            {imagePreview ? (
              <div className="image-preview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="change-image-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('image-input').click();
                  }}
                >
                  Change Photo
                </button>
              </div>
            ) : (
              <div className="image-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <p>Add Photo (Optional)</p>
              </div>
            )}
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Category */}
        <div className="form-section">
          <label className="form-label">Memory Type *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="form-select"
          >
            {MEMORY_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.emoji} {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div className="form-section">
          <label className="form-label">Title *</label>
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
          <label className="form-label">Date *</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        {/* Location */}
        <div className="form-section">
          <label className="form-label">Location (Optional)</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Where did this happen?"
          />
        </div>

        {/* Description */}
        <div className="form-section">
          <label className="form-label">Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Tell the story..."
            rows="5"
          ></textarea>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-primary save-btn"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Memory'}
        </button>
      </form>
    </div>
  );
}
