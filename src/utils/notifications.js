import { messaging, getToken, onMessage } from './firebase';
import { supabase } from './supabase';
import { getCurrentUser } from './auth';

// VAPID key - You'll need to generate this in Firebase Console
// Go to Project Settings > Cloud Messaging > Web Push certificates
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY';

/**
 * Request notification permission and get FCM token
 */
export async function requestNotificationPermission() {
  console.log('[FCM] requestNotificationPermission called');
  console.log('[FCM] Messaging available:', !!messaging);
  console.log('[FCM] Current permission:', Notification.permission);

  if (!messaging) {
    console.warn('[FCM] Messaging not supported in this browser');
    return null;
  }

  try {
    // Check if notification permission is already granted
    if (Notification.permission === 'granted') {
      console.log('[FCM] Permission already granted, getting token');
      return await getFCMToken();
    }

    // Request permission
    console.log('[FCM] Requesting permission...');
    const permission = await Notification.requestPermission();
    console.log('[FCM] Permission result:', permission);

    if (permission === 'granted') {
      console.log('[FCM] Notification permission granted, getting token');
      return await getFCMToken();
    } else {
      console.log('[FCM] Notification permission denied');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Get FCM token and save it to Supabase
 */
async function getFCMToken() {
  try {
    console.log('[FCM] Getting token with VAPID key:', VAPID_KEY.substring(0, 20) + '...');

    // Register service worker — use default scope so FCM can control it properly
    let serviceWorkerRegistration;
    if ('serviceWorker' in navigator) {
      console.log('[FCM] Registering / updating service worker...');
      try {
        // Always register with root scope (/) for FCM compatibility
        serviceWorkerRegistration = await navigator.serviceWorker.register(
          '/firebase-messaging-sw.js'
        );
        // Wait until the SW is active
        await navigator.serviceWorker.ready;
        console.log('[FCM] Service worker ready');
      } catch (swError) {
        console.error('[FCM] Service worker registration failed:', swError);
        // Don't throw — let FCM try without an explicit SW registration
      }
    }

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration,
    });

    if (token) {
      console.log('[FCM] Token obtained:', token.substring(0, 30) + '...');
      await saveFCMToken(token);
      return token;
    } else {
      console.log('[FCM] No registration token available. Make sure notifications are allowed in browser settings.');
      return null;
    }
  } catch (error) {
    console.error('[FCM] Error getting FCM token:', error);
    console.error('[FCM] Error details:', error.message, error.code);
    return null;
  }
}

/**
 * Save FCM token to user's record in Supabase
 */
async function saveFCMToken(token) {
  try {
    const currentUser = getCurrentUser();
    console.log('[FCM] Current user:', currentUser);
    console.log('[FCM] Token to save:', token);

    if (!currentUser) {
      console.error('[FCM] No current user found');
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .update({ fcm_token: token })
      .eq('name', currentUser)
      .select();

    if (error) {
      console.error('[FCM] Error saving FCM token:', error);
    } else {
      console.log('[FCM] Token saved successfully. Updated rows:', data);
    }
  } catch (error) {
    console.error('[FCM] Error in saveFCMToken:', error);
  }
}

/**
 * Set up foreground message listener
 */
export function setupForegroundMessageListener() {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);

    const notificationTitle = payload.notification?.title || 'New Memory';
    const notificationOptions = {
      body: payload.notification?.body || 'A new memory was added',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'memory-notification',
      requireInteraction: false,
    };

    // Show notification if browser supports it
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notificationTitle, notificationOptions);
    }
  });
}

/**
 * Send notification to partner when memory is added
 */
export async function sendMemoryAddedNotification(memoryTitle, addedBy) {
  try {
    // Get partner's name
    const partnerName = addedBy === 'Aswin' ? 'Anu' : 'Aswin';

    // Get partner's FCM token
    const { data, error } = await supabase
      .from('users')
      .select('fcm_token')
      .eq('name', partnerName)
      .single();

    if (error || !data?.fcm_token) {
      console.log('Partner FCM token not found');
      return;
    }

    // Get Supabase URL and anon key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration missing');
      return;
    }

    // Call Supabase Edge Function to send notification
    const response = await fetch(`${supabaseUrl}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        token: data.fcm_token,
        title: 'New Memory Added',
        body: `${addedBy} added a memory`,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to send notification:', errorData);
    } else {
      console.log('Notification sent successfully to', partnerName);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}
