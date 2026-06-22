# Deploy Push Notifications - Final Steps

Great news! FCM tokens are now being saved successfully. Here are the final steps to enable push notifications:

## Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console > Project Settings > Service Accounts](https://console.firebase.google.com/project/just-us-53056/settings/serviceaccounts/adminsdk)
2. Click "Generate new private key"
3. Download the JSON file (e.g., `just-us-53056-firebase-adminsdk-xxxxx.json`)
4. **Important**: Keep this file secure - it contains private credentials

## Step 2: Add Service Account to Supabase

1. Open the downloaded JSON file
2. Copy the **entire JSON content** (it should start with `{` and end with `}`)
3. Go to [Supabase Dashboard > Project Settings > Edge Functions](https://supabase.com/dashboard/project/uaahpmiitvoycuwsdsws/settings/functions)
4. Scroll to "Secrets" section
5. Add a new secret:
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: (paste the entire JSON content from step 2)

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
✅ Edge function created using FCM V1 API
⏳ Waiting for edge function deployment
⏳ Waiting for Firebase Service Account configuration

---

## Alternative: Deploy via Supabase Dashboard

If the CLI doesn't work, you can deploy via the dashboard:

1. Go to https://supabase.com/dashboard/project/uaahpmiitvoycuwsdsws/functions
2. Click "New Function"
3. Name it: `send-notification`
4. Paste the code from `supabase/functions/send-notification/index.ts`
5. Click "Deploy"
