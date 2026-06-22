import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import BottomNav from '../components/BottomNav';
import FloatingActionButton from '../components/FloatingActionButton';
import '../styles/Timeline.css';

export default function Timeline() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMemories, setGroupedMemories] = useState({});
  const navigate = useNavigate();

  // Hardcoded relationship data
  const RELATIONSHIP_START_DATE = '2026-05-21';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      setMemories(data || []);

      // Group memories by year
      const grouped = (data || []).reduce((acc, memory) => {
        const year = new Date(memory.date).getFullYear();
        if (!acc[year]) acc[year] = [];
        acc[year].push(memory);
        return acc;
      }, {});

      setGroupedMemories(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (categoryId) => {
    return MEMORY_CATEGORIES.find(c => c.id === categoryId) || MEMORY_CATEGORIES[0];
  };

  const calculateDaysTogether = () => {
    const start = new Date(RELATIONSHIP_START_DATE);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const years = Object.keys(groupedMemories).sort((a, b) => b - a);

  return (
    <div className="timeline-page">
      {/* Header */}
      <header className="timeline-header">
        <div className="header-content">
          <div className="header-icon">💕</div>
          <div className="header-text">
            <div className="names-container">
              <span className="name">Aswin</span>
              <span className="ampersand">&</span>
              <span className="name">Anu</span>
            </div>
            <div className="days-container">
              <div className="days-number">{calculateDaysTogether()}</div>
              <div className="days-label">days of us</div>
            </div>
          </div>
          <div className="header-decoration">
            <div className="heart-small">♥</div>
            <div className="heart-small delay">♥</div>
          </div>
        </div>
      </header>

      {/* Timeline */}
      <div className="timeline-content">
        {memories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📖</div>
            <h2>Start Our Story</h2>
            <p>Add your first memory to begin building your timeline.</p>
            <button className="btn-primary" onClick={() => navigate('/add')}>
              Add First Memory
            </button>
          </div>
        ) : (
          years.map(year => (
            <div key={year} className="year-group">
              <div className="year-label">{year}</div>
              <div className="memories-list">
                {groupedMemories[year].map(memory => {
                  const category = getCategoryInfo(memory.category);
                  return (
                    <div
                      key={memory.id}
                      className="memory-card"
                      onClick={() => navigate(`/memory/${memory.id}`)}
                    >
                      {memory.image_url && (
                        <div className="memory-image">
                          <img src={memory.image_url} alt={memory.title} />
                        </div>
                      )}
                      <div className="memory-content">
                        <div className="memory-category">
                          {category.emoji} {category.label}
                        </div>
                        <h3 className="memory-title">{memory.title}</h3>
                        <div className="memory-meta">
                          <p className="memory-date">{formatDate(memory.date)}</p>
                          {memory.created_by && (
                            <span className="memory-author">• Added by {memory.created_by}</span>
                          )}
                        </div>
                        {memory.description && (
                          <p className="memory-description">
                            {memory.description.length > 120
                              ? memory.description.substring(0, 120) + '...'
                              : memory.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <FloatingActionButton />
      <BottomNav />
    </div>
  );
}
