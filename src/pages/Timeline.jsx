import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import { getCurrentUser } from '../utils/auth';
import BottomNav from '../components/BottomNav';
import FloatingActionButton from '../components/FloatingActionButton';
import '../styles/Timeline.css';

export default function Timeline() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMemories, setGroupedMemories] = useState({});
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Hardcoded relationship data
  const RELATIONSHIP_START_DATE = '2026-05-21';
  const partnerName = currentUser === 'Aswin' ? 'Anu' : 'Aswin';

  // Get profile pictures from localStorage or use defaults
  const getProfilePicture = (user) => {
    return localStorage.getItem(`profile_picture_${user.toLowerCase()}`) || `/${user.toLowerCase()}.png`;
  };

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
      {/* Modern Header with Greeting */}
      <header className="modern-header">
        <div className="greeting-card">
          <div className="greeting-content">
            <span className="heart-icon-small">❤️</span>
            <h1 className="greeting-text">Hi! {currentUser} 👋</h1>
          </div>
          <img
            src={getProfilePicture(currentUser)}
            alt={currentUser}
            className="header-profile-pic"
          />
        </div>

        {/* Relationship Stats Card */}
        <div className="stats-card">
          <div className="stats-content">
            <div className="stats-info">
              <h2 className="partner-greeting">{partnerName} & You</h2>
              <div className="days-display">
                <div className="days-number">{calculateDaysTogether()}</div>
                <span className="days-unit">days</span>
              </div>
              <p className="days-label">together</p>
            </div>
          </div>
        </div>
      </header>

      {/* Moments Bank */}
      <div className="moments-bank">
        <h2 className="section-title">Moments Bank</h2>

        {memories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📖</div>
            <h3>Start Our Story</h3>
            <p>Add your first memory to begin building your timeline.</p>
            <button className="btn-primary" onClick={() => navigate('/add')}>
              Add First Memory
            </button>
          </div>
        ) : (
          years.map(year => (
            <div key={year} className="year-group">
              <div className="year-label">{year}</div>
              <div className="memories-grid">
                {groupedMemories[year].map(memory => {
                  const category = getCategoryInfo(memory.category);
                  return (
                    <div
                      key={memory.id}
                      className="modern-memory-card"
                      onClick={() => navigate(`/memory/${memory.id}`)}
                    >
                      {memory.image_url && (
                        <div className="modern-memory-image">
                          <img src={memory.image_url} alt={memory.title} />
                        </div>
                      )}
                      <div className="modern-memory-content">
                        <div className="memory-header">
                          <span className="memory-emoji">{category.emoji}</span>
                          <span className="memory-date-short">{formatDate(memory.date)}</span>
                        </div>
                        <h3 className="modern-memory-title">{memory.title}</h3>
                        {memory.created_by && (
                          <p className="memory-author-small">by {memory.created_by}</p>
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
