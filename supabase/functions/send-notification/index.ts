import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FIREBASE_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY') || '';

interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { token, title, body, data }: NotificationPayload = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'FCM token is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    if (!FIREBASE_SERVER_KEY) {
      console.error('FIREBASE_SERVER_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Send notification via FCM Legacy API
    const fcmResponse = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `key=${FIREBASE_SERVER_KEY}`,
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: title || 'New Memory',
          body: body || 'A new memory was added',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          click_action: 'https://just-us-seven-theta.vercel.app/',
        },
        data: data || {},
        priority: 'high',
      }),
    });

    const fcmData = await fcmResponse.json();

    if (!fcmResponse.ok) {
      console.error('FCM Error:', fcmData);
      return new Response(
        JSON.stringify({ error: 'Failed to send notification', details: fcmData }),
        {
          status: fcmResponse.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    console.log('Notification sent successfully:', fcmData);

    return new Response(
      JSON.stringify({ success: true, response: fcmData }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
})
