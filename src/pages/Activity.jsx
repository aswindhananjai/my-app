import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getActivities,
  markActivityAsRead,
  markAllActivitiesAsRead,
  isActivityReadByCurrentUser,
  getActivityActionText,
  getUnreadActivityCount
} from '../utils/activities.js';
import { getCurrentUser } from '../utils/auth.js';
import '../styles/Activity.css';

const ACTIVITIES_PER_PAGE = 50;

function Activity() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activities, setActivities] = useState([]);
  const [displayedActivities, setDisplayedActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadActivities();
  }, []);

  useEffect(() => {
    // Update displayed activities when page changes
    const startIndex = 0;
    const endIndex = currentPage * ACTIVITIES_PER_PAGE;
    setDisplayedActivities(activities.slice(startIndex, endIndex));
    setHasMore(endIndex < activities.length);
  }, [currentPage, activities]);

  async function loadActivities() {
    setLoading(true);
    const data = await getActivities();
    setActivities(data);
    setDisplayedActivities(data.slice(0, ACTIVITIES_PER_PAGE));
    setHasMore(data.length > ACTIVITIES_PER_PAGE);

    // Count unread
    const unread = data.filter(activity => !isActivityReadByCurrentUser(activity)).length;
    setUnreadCount(unread);

    setLoading(false);
  }

  async function handleActivityClick(activity) {
    // Don't mark as read if user is the one who triggered it
    if (activity.action_by !== currentUser && !isActivityReadByCurrentUser(activity)) {
      await markActivityAsRead(activity.id);
    }

    // Navigate to memory detail page
    if (activity.memory_id) {
      navigate(`/memory/${activity.memory_id}`, { state: { from: '/activity' } });
    }
  }

  async function handleMarkAllAsRead() {
    setMarkingAllRead(true);
    const success = await markAllActivitiesAsRead();
    if (success) {
      // Reload activities to reflect the change
      await loadActivities();
    }
    setMarkingAllRead(false);
  }

  function handleLoadMore() {
    setCurrentPage(prev => prev + 1);
  }

  function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  }

  function getMemoryImage(activity) {
    if (!activity.memory_image_url) return null;

    try {
      if (activity.memory_image_url.startsWith('[')) {
        const urls = JSON.parse(activity.memory_image_url);
        return urls[0] || null;
      }
      return activity.memory_image_url;
    } catch (e) {
      return activity.memory_image_url;
    }
  }

  if (loading) {
    return (
      <div className="activity-page">
        <div className="activity-header">
          <div className="header-top">
            <button className="back-btn" onClick={() => navigate('/settings')}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="header-info">
              <h1 className="header-title">Activity</h1>
              <div className="header-subtitle">Loading...</div>
            </div>
          </div>
        </div>
        <div className="activity-loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-page">
      <div className="activity-header">
        <div className="header-top">
          <button className="back-btn" onClick={() => navigate('/settings')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div className="header-info">
            <h1 className="header-title">Activity</h1>
            <div className="header-subtitle">
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </div>
          </div>
        </div>
        {unreadCount > 0 && (
          <div className="header-actions">
            <button
              className="mark-all-read-button"
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
            >
              {markingAllRead ? 'Marking...' : 'Mark all read'}
            </button>
          </div>
        )}
      </div>

      <div className="activity-content">
        {displayedActivities.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-text">No activities yet</div>
            <div className="empty-subtext">Activity will appear here when memories are created, updated, or deleted</div>
          </div>
        ) : (
          <>
            {displayedActivities.map((activity) => {
              const isRead = activity.action_by === currentUser || isActivityReadByCurrentUser(activity);
              const imageUrl = getMemoryImage(activity);

              return (
                <div
                  key={activity.id}
                  className={`activity-card ${isRead ? 'read' : 'unread'}`}
                  onClick={() => handleActivityClick(activity)}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={activity.memory_title}
                      className="activity-thumbnail"
                    />
                  ) : (
                    <div className="activity-thumbnail-placeholder">
                      <span className="placeholder-icon">{activity.memory_icon || '💖'}</span>
                    </div>
                  )}

                  <div className="activity-info">
                    <div className="activity-title">{activity.memory_title}</div>
                    <div className="activity-action">
                      {getActivityActionText(activity)}
                    </div>
                    <div className="activity-time">
                      {formatRelativeTime(activity.created_at)}
                    </div>
                  </div>

                  {!isRead && <div className="unread-indicator"></div>}
                </div>
              );
            })}

            {hasMore && (
              <div className="load-more-container">
                <button
                  className="load-more-button"
                  onClick={handleLoadMore}
                >
                  Load more activities
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Activity;
