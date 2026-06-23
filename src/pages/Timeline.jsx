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
      // Fetch active memories only (soft delete filter)
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .eq('is_active', true)
        .order('date', { ascending: false })
        .order('sort_order', { ascending: true });

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
    const now = new Date();
    const diffTime = now.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatRelationshipDate = () => {
    const date = new Date(relationshipStartDate);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'Asia/Kolkata'
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getFirstImageUrl = (imageUrlString) => {
    if (!imageUrlString) return null;
    try {
      if (imageUrlString.startsWith('[')) {
        const arr = JSON.parse(imageUrlString);
        return arr.length > 0 ? arr[0] : null;
      }
      return imageUrlString;
    } catch (e) {
      return imageUrlString;
    }
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
        {/* Floating decorative icons */}
        <svg className="float-icon float-heart" width="38" height="38" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="currentColor" />
        </svg>
        <svg className="float-icon float-heart-small" width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="currentColor" />
        </svg>

        {/* Stethoscope icon */}
        <svg className="float-icon float-stethoscope" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
          <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
          <circle cx="20" cy="10" r="2" />
        </svg>

        {/* Car icon */}
        <svg className="float-icon float-car" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>

        {/* Travel suitcase icon */}
        <svg className="float-icon float-suitcase" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M3 12h18" />
          <path d="M8 12v7" />
          <path d="M16 12v7" />
        </svg>

        {/* Movie clapperboard icon */}
        <svg className="float-icon float-movie" width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z" />
          <path d="m6.2 5.3 3.1 3.9" />
          <path d="m12.4 3.4 3.1 4" />
          <path d="m3 11 18.5-5.6c1 -.3 2 .4 2 1.5V21a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9c0-.6.4-1 1-1Z" />
        </svg>

        {/* Music note icon */}
        <svg className="float-icon float-music" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
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
          {memories.length > 5 && (
            <button className="see-all-link" onClick={() => navigate('/memories')}>
              See all
            </button>
          )}
        </div>

        {memories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-illustration">📖</div>
            <h3>Start Our Story</h3>
            <p>Add your first memory to begin building your timeline.</p>
          </div>
        ) : (
          <>
            {memories.slice(0, 5).map(memory => {
              const categoryIds = memory.category ? memory.category.split(',').filter(Boolean) : ['first'];
              const categories = categoryIds.map(id => getCategoryInfo(id));
              const displayCategory = categories.find(c => c.id !== 'first') || categories[0];
              const previewUrl = getFirstImageUrl(memory.image_url);
              return (
                <div
                  key={memory.id}
                  className={`big-memory-card ${!previewUrl ? 'no-image' : ''}`}
                  onClick={() => navigate(`/memory/${memory.id}`, { state: { from: '/' } })}
                >
                  {previewUrl
                    ? <img src={previewUrl} alt={memory.title} />
                    : (
                      <div
                        className="memory-card-default-bg"
                        style={{ background: `linear-gradient(145deg, ${displayCategory.color} 0%, ${displayCategory.color}dd 100%)` }}
                      >
                        {/* Scattered emoji pattern — evenly, widely distributed */}
                        <span style={{ position:'absolute', fontSize:'54px', top:'-5%',    left:'-5%',    opacity:0.15, transform:'rotate(-12deg)', lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'28px', top:'12%',    left:'20%',    opacity:0.18, transform:'rotate(18deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'40px', top:'5%',     left:'48%',    opacity:0.12, transform:'rotate(-8deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'72px', top:'-10%',   right:'-5%',   opacity:0.14, transform:'rotate(22deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'32px', top:'42%',    left:'5%',     opacity:0.2,  transform:'rotate(-15deg)', lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'20px', top:'38%',    left:'30%',    opacity:0.16, transform:'rotate(10deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'36px', top:'45%',    left:'58%',    opacity:0.14, transform:'rotate(-20deg)', lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'48px', top:'35%',    right:'10%',   opacity:0.13, transform:'rotate(15deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'50px', bottom:'-8%',  left:'12%',    opacity:0.12, transform:'rotate(25deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'24px', bottom:'15%', left:'26%',    opacity:0.18, transform:'rotate(-18deg)', lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'30px', bottom:'8%',  left:'45%',    opacity:0.15, transform:'rotate(8deg)',   lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'64px', bottom:'-12%', right:'15%',   opacity:0.11, transform:'rotate(-22deg)', lineHeight:1 }}>{displayCategory.emoji}</span>
                        <span style={{ position:'absolute', fontSize:'22px', bottom:'22%', right:'2%',    opacity:0.2,  transform:'rotate(12deg)',  lineHeight:1 }}>{displayCategory.emoji}</span>
                      </div>
                    )
                  }
                  <div className="memory-gradient-overlay"></div>
                  {/* Category badges — white background with colored text */}
                  <div className="memory-category-badges-container">
                    {categories.map(cat => (
                      <span key={cat.id} className="memory-category-badge" style={{ background: '#fff', color: cat.textColor }}>
                        <span className="badge-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0, color: cat.textColor }}>{cat.icon}</span>
                        {cat.name}
                      </span>
                    ))}
                  </div>
                  <div className="memory-card-content">
                    <div className="memory-card-title">{memory.title}</div>
                    <div className="memory-card-meta">
                      {formatDate(memory.date)}
                      {memory.created_by && <span> · added by {memory.created_by}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {memories.length > 5 && (
              <div className="see-all-button-container">
                <button className="see-all-button-large" onClick={() => navigate('/memories')}>
                  See all
                </button>
              </div>
            )}
          </>
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
