import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser, getUserData, updateUserProfilePicture } from '../utils/auth';
import { uploadImage } from '../utils/cloudinary';
import { supabase } from '../utils/supabase';
import { getUnreadActivityCount } from '../utils/activities';
import BottomNav from '../components/BottomNav';
import '../styles/Settings.css';

export default function Settings() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [uploading, setUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState(`/${currentUser.toLowerCase()}.png`);
  const [partnerPicture, setPartnerPicture] = useState(null);
  const [daysTogether, setDaysTogether] = useState(0);
  const [unreadActivityCount, setUnreadActivityCount] = useState(0);

  const partnerName = currentUser === 'Aswin' ? 'Anu' : 'Aswin';

  useEffect(() => {
    loadUserData();
    loadRelationshipData();
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    const count = await getUnreadActivityCount();
    setUnreadActivityCount(count);
  };

  const loadUserData = async () => {
    const [currentUserData, partnerData] = await Promise.all([
      getUserData(currentUser),
      getUserData(partnerName)
    ]);

    if (currentUserData?.profile_picture_url) {
      setProfilePicture(currentUserData.profile_picture_url);
    }

    if (partnerData?.profile_picture_url) {
      setPartnerPicture(partnerData.profile_picture_url);
    } else {
      setPartnerPicture(`/${partnerName.toLowerCase()}.png`);
    }
  };

  const loadRelationshipData = async () => {
    try {
      const { data: configData } = await supabase
        .from('relationship_config')
        .select('start_date')
        .single();

      if (configData) {
        const start = new Date(configData.start_date);
        const now = new Date();
        const diffTime = now.getTime() - start.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setDaysTogether(diffDays);
      }
    } catch (error) {
      console.error('Error loading relationship data:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/lock');
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Upload to Cloudinary
      const imageUrl = await uploadImage(file);

      // Update in database
      const success = await updateUserProfilePicture(currentUser, imageUrl);

      if (success) {
        // Update local state
        setProfilePicture(imageUrl);
        alert('Profile picture updated successfully!');
      } else {
        throw new Error('Failed to update database');
      }
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-scroll-container">
        <h1 className="settings-title">Settings</h1>

        {/* Profile Hero Card */}
        <div className="profile-hero-card">
          <svg className="hero-heart-decoration" width="120" height="120" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" />
          </svg>
          <div className="profile-hero-content">
            <img src={profilePicture} alt={currentUser} className="profile-hero-image" />
            <div className="profile-hero-info">
              <div className="profile-hero-name">{currentUser}</div>
              <div className="profile-hero-meta">with {partnerName} · {daysTogether} days</div>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Partner Card */}
          <div className="partner-card">
            <img src={partnerPicture} alt={partnerName} className="partner-avatar" />
            <div className="partner-info">
              <div className="partner-label">Madly in love with</div>
              <div className="partner-name">{partnerName}</div>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7.6 4.5 4.5 0 0 1 19.5 11c0 5.4-7.5 10-7.5 10Z" fill="#FF7A93" />
            </svg>
          </div>

          {/* Activity Section */}
          <div className="settings-section">
            <div className="section-label">ACTIVITY</div>
            <div className="activity-link-card" onClick={() => navigate('/activity')}>
              <div className="activity-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              </div>
              <div className="activity-text">
                <div className="activity-label">Activity</div>
                <div className="activity-subtitle">View your shared activity</div>
              </div>
              <div className="activity-badge-wrapper">
                {unreadActivityCount > 0 && (
                  <div className="activity-badge">{unreadActivityCount}</div>
                )}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Profile Section */}
          <div className="settings-section">
            <div className="section-label">PROFILE</div>
            <div className="profile-picture-card">
              <div className="profile-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2D6FE0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <circle cx="8.5" cy="10" r="1.6" />
                  <path d="m21 16-5-5L5 19" />
                </svg>
              </div>
              <div className="profile-text">
                <div className="profile-label">Profile picture</div>
              </div>
              <label className="change-btn">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                {uploading ? 'Uploading...' : 'Change'}
              </label>
            </div>
          </div>

          {/* Lock Button */}
          <button className="lock-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4.5" y="11" width="15" height="9" rx="2.5" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Lock app
          </button>

          {/* App Footer */}
          <div className="app-footer">
            <p className="app-version">Just us · v1.0.0</p>
            <p className="app-tagline">A space that's ours 💙</p>
          </div>
        </div>
      </div>

      {/* Bottom navigation - always 3 items: Memories | + | Settings */}
      <div className="bottom-nav-settings">
        <button className="nav-item-settings inactive" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>Memories</span>
        </button>

        {/* Center FAB */}
        <button className="nav-fab-settings" onClick={() => navigate('/add')}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14 M5 12h14" />
          </svg>
        </button>

        <button className="nav-item-settings active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
