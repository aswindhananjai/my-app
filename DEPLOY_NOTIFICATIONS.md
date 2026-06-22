# Deploy Push Notifications - Final Steps

Great news! FCM tokens are now being saved successfully. Here are the final steps to enable push notifications:

## Step 1: Get Firebase Server Key

1. Go to [Firebase Console](https://console.firebase.google.com/project/just-us-53056/settings/cloudmessaging)
2. Scroll to "Cloud Messaging API (Legacy)"
3. Copy the **Server key** (starts with `AAAAxxx...`)

## Step 2: Add Server Key to Supabase

1. Go to [Supabase Dashboard > Edge Functions](https://supabase.com/dashboard/project/uaahpmiitvoycuwsdsws/functions)
2. Click on "Manage secrets"
3. Add a new secret:
   - Name: `FIREBASE_SERVER_KEY`
   - Value: (paste the server key from step 1)

## Step 3: Deploy the Edge Function

Run this command to deploy:

```bash
npx supabase functions deploy send-notification --project-ref uaahpmiitvoycuwsdsws
```

If you're not logged in, first run:

```bash
npx supabase login
```

## Step 4: Test Notifications

1. Login as one user (e.g., Aswin)
2. Add a new memory
3. The other user (Anu) should receive a notification!

## Verification

Check the logs in Supabase Dashboard:
- Go to Edge Functions > send-notification > Logs
- You should see successful notification sends

## Current Status

✅ FCM tokens are being generated and saved
✅ Service worker is registered
✅ Permission granted
✅ Edge function created (needs deployment)
⏳ Waiting for edge function deployment
⏳ Waiting for Firebase Server Key configuration

---

## Alternative: Deploy via Supabase Dashboard

If the CLI doesn't work, you can deploy via the dashboard:

1. Go to https://supabase.com/dashboard/project/uaahpmiitvoycuwsdsws/functions
2. Click "New Function"
3. Name it: `send-notification`
4. Paste the code from `supabase/functions/send-notification/index.ts`
5. Click "Deploy"
