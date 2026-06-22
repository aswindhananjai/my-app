import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FIREBASE_SERVICE_ACCOUNT = Deno.env.get('FIREBASE_SERVICE_ACCOUNT') || '';
const PROJECT_ID = 'just-us-53056';

interface NotificationPayload {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// Helper to get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));

  const now = Math.floor(Date.now() / 1000);
  const jwtClaimSet = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  const signatureInput = `${jwtHeader}.${jwtClaimSet}`;

  // Import private key
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(serviceAccount.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the JWT
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const jwt = `${signatureInput}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
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

    if (!FIREBASE_SERVICE_ACCOUNT) {
      console.error('FIREBASE_SERVICE_ACCOUNT not configured');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    // Parse service account JSON
    const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    // Send notification via FCM V1 API
    const fcmResponse = await fetch(
      `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: {
            token: token,
            notification: {
              title: title || 'New Memory',
              body: body || 'A new memory was added',
            },
            webpush: {
              notification: {
                icon: '/favicon.ico',
                badge: '/favicon.ico',
              },
              fcm_options: {
                link: 'https://just-us-seven-theta.vercel.app/',
              },
            },
            data: data || {},
          },
        }),
      }
    );

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
