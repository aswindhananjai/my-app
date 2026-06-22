import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import '../styles/MemoryDetail.css';

export default function MemoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [memory, setMemory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemory();
  }, [id]);

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
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this memory?')) {
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
      }
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!memory) {
    return null;
  }

  const category = getCategoryInfo(memory.category);

  return (
    <div className="memory-detail-page">
      <header className="memory-detail-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <button className="delete-button" onClick={handleDelete}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </header>

      <div className="memory-detail-content">
        {memory.image_url && (
          <div className="detail-image">
            <img src={memory.image_url} alt={memory.title} />
          </div>
        )}

        <div className="detail-body">
          <div className="detail-category">
            {category.emoji} {category.label}
          </div>

          <h1 className="detail-title">{memory.title}</h1>

          <div className="detail-meta">
            <p className="detail-date">{formatDate(memory.date)}</p>
            {memory.created_by && (
              <span className="detail-author">• Added by {memory.created_by}</span>
            )}
          </div>

          {memory.location && (
            <div className="detail-location">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {memory.location}
            </div>
          )}

          {memory.description && (
            <div className="detail-description">
              <p>{memory.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
