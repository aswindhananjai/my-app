import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

/**
 * Get category icon based on memory category
 */
const getCategoryIcon = (category) => {
  const icons = {
    first: '💫',
    milestone: '🎯',
    trip: '✈️',
    gift: '🎁',
    moment: '❤️',
    quote: '💭',
    celebration: '🎉',
    special_day: '⭐',
    date: '🌹'
  };
  if (!category) return '💖';
  const parts = category.split(',').filter(Boolean);
  const primary = parts.find(p => p !== 'first') || parts[0] || 'first';
  return icons[primary] || '💖';
};

/**
 * Create an activity entry
 * Automatically marks the activity as read for the person who triggered it
 */
export async function createActivity(memoryId, actionType, actionBy, memoryTitle, memoryCategory, memoryImageUrl = null) {
  try {
    // Mark as read for the person who triggered the action
    const readField = actionBy === 'Aswin' ? 'read_by_aswin' : 'read_by_anu';

    const { data, error } = await supabase
      .from('activities')
      .insert([{
        memory_id: memoryId,
        action_type: actionType,
        action_by: actionBy,
        memory_title: memoryTitle,
        memory_icon: getCategoryIcon(memoryCategory),
        memory_image_url: memoryImageUrl,
        [readField]: true // Mark as read for the person who triggered it
      }])
      .select();

    if (error) {
      console.error('Error creating activity:', error);
      return null;
    }

    return data[0];
  } catch (err) {
    console.error('Exception creating activity:', err);
    return null;
  }
}

/**
 * Get all activities for the current user, sorted by newest first
 */
export async function getActivities() {
  try {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching activities:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching activities:', err);
    return [];
  }
}

/**
 * Get count of unread activities for the current user
 */
export async function getUnreadActivityCount() {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return 0;

    const readField = currentUser === 'Aswin' ? 'read_by_aswin' : 'read_by_anu';

    const { data, error } = await supabase
      .from('activities')
      .select('id', { count: 'exact', head: false })
      .eq(readField, false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.error('Exception getting unread count:', err);
    return 0;
  }
}

/**
 * Mark a specific activity as read for the current user
 */
export async function markActivityAsRead(activityId) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const readField = currentUser === 'Aswin' ? 'read_by_aswin' : 'read_by_anu';

    const { error } = await supabase
      .from('activities')
      .update({ [readField]: true })
      .eq('id', activityId);

    if (error) {
      console.error('Error marking activity as read:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception marking activity as read:', err);
    return false;
  }
}

/**
 * Mark all activities as read for the current user
 */
export async function markAllActivitiesAsRead() {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return false;

    const readField = currentUser === 'Aswin' ? 'read_by_aswin' : 'read_by_anu';

    const { error } = await supabase
      .from('activities')
      .update({ [readField]: true })
      .eq(readField, false);

    if (error) {
      console.error('Error marking all activities as read:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception marking all activities as read:', err);
    return false;
  }
}

/**
 * Check if an activity is read by the current user
 */
export function isActivityReadByCurrentUser(activity) {
  const currentUser = getCurrentUser();
  if (!currentUser) return true;

  return currentUser === 'Aswin' ? activity.read_by_aswin : activity.read_by_anu;
}

/**
 * Get formatted action text for an activity
 */
export function getActivityActionText(activity) {
  const actions = {
    created: 'created a memory',
    updated: 'updated a memory',
    deleted: 'deleted a memory'
  };
  return `${activity.action_by} ${actions[activity.action_type] || 'modified a memory'}`;
}
