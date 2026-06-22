import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { MEMORY_CATEGORIES } from '../utils/constants';
import { getCurrentUser, getUserData } from '../utils/auth';
import BottomNav from '../components/BottomNav';
import FloatingActionButton from '../components/FloatingActionButton';
import '../styles/Timeline.css';

export default function Timeline() {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupedMemories, setGroupedMemories] = useState({});
  const [relationshipStartDate, setRelationshipStartDate] = useState('2026-05-21');
  const [profilePictures, setProfilePictures] = useState({});
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const partnerName = currentUser === 'Aswin' ? 'Anu' : 'Aswin';

  // Get profile picture from state
  const getProfilePicture = (user) => {
    return profilePictures[user] || `/${user.toLowerCase()}.png`;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch memories
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

      // Fetch relationship start date
      const { data: configData } = await supabase
        .from('relationship_config')
        .select('start_date')
        .single();

      if (configData) {
        setRelationshipStartDate(configData.start_date);
      }

      // Fetch profile pictures from users table
      const [currentUserData, partnerData] = await Promise.all([
        getUserData(currentUser),
        getUserData(partnerName)
      ]);

      setProfilePictures({
        [currentUser]: currentUserData?.profile_picture_url || `/${currentUser.toLowerCase()}.png`,
        [partnerName]: partnerData?.profile_picture_url || `/${partnerName.toLowerCase()}.png`
      });
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
    const start = new Date(relationshipStartDate);
    const today = new Date();
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatRelationshipDate = () => {
    const date = new Date(relationshipStartDate);
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
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
      {/* Gradient Hero */}
      <div className="gradient-hero">
        {/* Floating hearts decoration */}
        <svg className="float-heart" width="38" height="38" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="currentColor" />
        </svg>
        <svg className="float-heart" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="currentColor" />
        </svg>

        {/* Duo photos - rotated */}
        <div className="duo-photos">
          <div className="photo-frame left">
            <img src={getProfilePicture(partnerName)} alt={partnerName} />
          </div>
          <div className="heart-divider">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="#FF7A93" />
            </svg>
          </div>
          <div className="photo-frame right">
            <img src={getProfilePicture(currentUser)} alt={currentUser} />
          </div>
        </div>

        {/* Counter */}
        <div className="days-counter">
          <div className="days-number-large">{calculateDaysTogether()}</div>
          <div className="days-label-upper">days together</div>
          <div className="relationship-meta">{partnerName} & {currentUser} · since {formatRelationshipDate()}</div>
        </div>
      </div>

      {/* White sheet below hero */}
      <div className="memories-section">
        <div className="section-header">
          <h2>Your memories</h2>
          <button className="see-all-link" onClick={() => navigate('/memories')}>
            See all
          </button>
        </div>

        {memories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📖</div>
            <h3>Start Our Story</h3>
            <p>Add your first memory to begin building your timeline.</p>
          </div>
        ) : (
          memories.slice(0, 3).map(memory => {
            const category = getCategoryInfo(memory.category);
            return (
              <div
                key={memory.id}
                className={`big-memory-card ${!memory.image_url ? 'no-image' : ''}`}
                onClick={() => navigate(`/memory/${memory.id}`)}
              >
                {memory.image_url
                  ? <img src={memory.image_url} alt={memory.title} />
                  : (
                    <div className="memory-card-default-bg">
                      <span className="memory-card-default-emoji">{category.emoji}</span>
                    </div>
                  )
                }
                <div className="memory-gradient-overlay"></div>
                <span className={`memory-category-badge ${category.id}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {category.id === 'trip' && <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />}
                    {category.id === 'date' && <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" />}
                    {category.id === 'milestone' && <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22v-7" />}
                    {category.id === 'celebration' && <path d="M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />}
                  </svg>
                  {category.name}
                </span>
                <div className="memory-card-content">
                  <div className="memory-card-title">{memory.title}</div>
                  <div className="memory-card-meta">{formatDate(memory.date)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom navigation - always 3 items: Memories | + | Settings */}
      <div className="bottom-nav-timeline">
        <button className="nav-item-timeline active" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Memories</span>
        </button>

        {/* Center FAB */}
        <button className="nav-fab" onClick={() => navigate('/add')}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14 M5 12h14" />
          </svg>
        </button>

        <button className="nav-item-timeline inactive" onClick={() => navigate('/settings')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
