import { supabase } from './supabase.js';
import { getCurrentUser } from './auth.js';

/**
 * Validate word count in a text (max 75 words)
 */
export function validateWordCount(text) {
  if (!text || typeof text !== 'string') return { count: 0, isValid: true };

  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
  const count = words.length;

  return {
    count,
    isValid: count <= 75
  };
}

/**
 * Get a random thought using smart selection algorithm
 * Prioritizes newly added thoughts while still showing older ones
 */
export async function getRandomThought(forUser) {
  try {
    // Get the partner's name (whose thoughts we want to show)
    const partnerName = forUser === 'Aswin' ? 'Anu' : 'Aswin';

    // Fetch all thoughts created by the partner
    const { data: thoughts, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('created_by', partnerName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching thoughts:', error);
      return null;
    }

    if (!thoughts || thoughts.length === 0) {
      return null;
    }

    // Calculate weights for smart selection
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weightedThoughts = thoughts.map(thought => {
      const createdAt = new Date(thought.created_at);
      const isNew = createdAt > sevenDaysAgo;

      // New thoughts get 3x weight, others weighted by inverse view count
      const weight = isNew ? 3 : 1 / (thought.view_count + 1);

      return { ...thought, weight };
    });

    // Weighted random selection
    const totalWeight = weightedThoughts.reduce((sum, t) => sum + t.weight, 0);
    let random = Math.random() * totalWeight;

    for (const thought of weightedThoughts) {
      random -= thought.weight;
      if (random <= 0) {
        return thought;
      }
    }

    // Fallback to first thought
    return weightedThoughts[0];
  } catch (err) {
    console.error('Exception getting random thought:', err);
    return null;
  }
}

/**
 * Get all thoughts created by the current user
 */
export async function getAllMyThoughts() {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];

    const { data, error } = await supabase
      .from('thoughts')
      .select('*')
      .eq('created_by', currentUser)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my thoughts:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Exception fetching my thoughts:', err);
    return [];
  }
}

/**
 * Create a new thought
 */
export async function createThought(message) {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    // Validate word count
    const { isValid, count } = validateWordCount(message);
    if (!isValid) {
      throw new Error(`Message exceeds 75 words (${count} words)`);
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const { data, error } = await supabase
      .from('thoughts')
      .insert([{
        created_by: currentUser,
        message: message.trim()
      }])
      .select();

    if (error) {
      console.error('Error creating thought:', error);
      throw error;
    }

    return data[0];
  } catch (err) {
    console.error('Exception creating thought:', err);
    throw err;
  }
}

/**
 * Update an existing thought
 */
export async function updateThought(id, message) {
  try {
    // Validate word count
    const { isValid, count } = validateWordCount(message);
    if (!isValid) {
      throw new Error(`Message exceeds 75 words (${count} words)`);
    }

    if (!message.trim()) {
      throw new Error('Message cannot be empty');
    }

    const { error } = await supabase
      .from('thoughts')
      .update({
        message: message.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating thought:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Exception updating thought:', err);
    throw err;
  }
}

/**
 * Delete a thought
 */
export async function deleteThought(id) {
  try {
    const { error } = await supabase
      .from('thoughts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting thought:', error);
      throw error;
    }

    return true;
  } catch (err) {
    console.error('Exception deleting thought:', err);
    throw err;
  }
}

/**
 * Increment view count and update last viewed timestamp
 */
export async function incrementViewCount(id) {
  try {
    // First get the current view count
    const { data: thought, error: fetchError } = await supabase
      .from('thoughts')
      .select('view_count')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching thought for view count:', fetchError);
      return false;
    }

    // Increment the count
    const { error: updateError } = await supabase
      .from('thoughts')
      .update({
        view_count: (thought.view_count || 0) + 1,
        last_viewed_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error incrementing view count:', updateError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Exception incrementing view count:', err);
    return false;
  }
}
