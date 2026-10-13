# Firebase Cloud Messaging (FCM) Integration Guide for ODA Market

This document describes the complete architecture, setup instructions, and testing procedures for Firebase Cloud Messaging (FCM) Web Push notifications in ODA Market.

---

## 1. Architecture Overview

- **Client Stack:** React 19 / Vite SPA, PWA Service Worker (`/firebase-messaging-sw.js`), Firebase Web SDK v10.
- **Backend Stack:** Node.js Express (`server.ts`), Vercel Serverless (`api/index.ts`), Firebase Admin SDK (`routes/fcmServerService.ts`), Supabase Edge Function (`supabase/functions/send-fcm-notification/index.ts`).
- **Database & Auth:** Supabase PostgreSQL (`public.fcm_tokens` table with RLS, with fallback to `auth.users.user_metadata.fcm_tokens`).

---

## 2. Firebase Configuration Details

### Web Client App (Public)
The client configuration is initialized in `src/lib/firebase.ts` and `public/firebase-messaging-sw.js`:
- **Project ID:** `odamarket-4cfaf`
- **Sender ID:** `627708466537`
- **App ID:** `1:627708466537:web:571a54825470b8ce8619f8`

### Generate Web Push VAPID Key (Firebase Console)
1. Navigate to [Firebase Console](https://console.firebase.google.com/) → Open project **odamarket-4cfaf**.
2. Click **Project settings** (gear icon) → **Cloud Messaging** tab.
3. Scroll down to **Web configuration** → Under **Web Push certificates**, click **Generate key pair**.
4. Copy the public key string (starts with `B...`).
5. Set it in your environment:
   ```bash
   VITE_FIREBASE_VAPID_KEY="YOUR_GENERATED_PUBLIC_KEY"
   ```

### Generate Server-Side Service Account Credentials (Never Expose in Frontend)
1. In Firebase Console → **Project settings** → **Service accounts** tab.
2. Ensure **Firebase Admin SDK** is selected with Node.js.
3. Click **Generate new private key** → confirm **Generate key**.
4. Download the JSON file securely.
5. In your server environment (or Vercel Dashboard → Environment Variables / Supabase Secrets), configure:
   - **Option A (Exact individual variables - Recommended):**
     ```bash
     project_id="odamarket-4cfaf"
     private_key_id="YOUR_KEY_ID"
     private_key="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"
     client_email="firebase-adminsdk-xxxxx@odamarket-4cfaf.iam.gserviceaccount.com"
     client_id="YOUR_CLIENT_ID"
     auth_url="https://accounts.google.com/o/oauth2/auth"
     authprovider_x509_cert_url="https://www.googleapis.com/oauth2/v1/certs"
     client_x509_cert_url="https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40odamarket-4cfaf.iam.gserviceaccount.com"
     universe_domain="googleapis.com"
     ```
   - **Option B (FIREBASE_ prefixed):**
     ```bash
     FIREBASE_PROJECT_ID="odamarket-4cfaf"
     FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@odamarket-4cfaf.iam.gserviceaccount.com"
     FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk...-----END PRIVATE KEY-----\n"
     ```
   - **Option C (Full JSON string or base64):**
     ```bash
     FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"odamarket-4cfaf",...}'
     ```

---

## 3. Database Setup (Supabase)

Run the SQL migration in the Supabase Dashboard **SQL Editor**:
File path: `supabase/migrations/20261013000001_create_fcm_tokens_table.sql`

This creates:
- `public.fcm_tokens` table with columns: `id`, `user_id`, `token`, `device_type`, `platform`, `browser`, `is_pwa`, `preferences`, `last_seen_at`.
- Strict Row Level Security (RLS) policies allowing users to read, update, and delete only their own device tokens.
- Automatic fallback: if the table has not yet been migrated, the server seamlessly manages tokens within `auth.users` metadata.

---

## 4. Platform & Browser Support

| Platform / Browser | Support Level | Requirements / Notes |
| :--- | :--- | :--- |
| **Chrome / Edge (Desktop & Android)** | Full Native Support | Standard browser notification permission prompt. |
| **Firefox (Desktop & Android)** | Full Native Support | Standard browser notification permission prompt. |
| **macOS Safari 16+** | Full Native Support | Prompts for permission in standard Safari tabs. |
| **iPhone / iPad Safari (iOS 16.4+)** | Supported via PWA | **Must be added to Home Screen**: User taps **Share** in Safari → **Add to Home Screen**, then opens the app and enables notifications in settings. |

---

## 5. End-to-End Testing Procedure

### Test 1: Explicit Permission & Token Generation
1. Navigate to **Buyer Dashboard → Settings → Notification Preferences** (`/buyer/settings`).
2. Verify the **Web Push Notifications** card displays "Not enabled".
3. Click **Enable Push Notifications**.
4. Accept the browser permission prompt when requested.
5. Verify the status updates immediately to **Active on this device** with a green pulse badge.

### Test 2: In-App Foreground Push Notification
1. Keep the ODA Market tab open in focus.
2. In the Notification Preferences card, click **Send Test Push**.
3. Verify an interactive toast alert appears in the foreground:
   *"ODA Market Test Alert: Your device is configured and receiving live push notifications successfully!"*
4. Click **View** on the toast to confirm it routes to the target page.

### Test 3: Background & Lock-Screen Push Notification
1. Minimize your browser window or switch to a different desktop application / mobile home screen.
2. Trigger a test push (either via another tab or using curl):
   ```bash
   curl -X POST https://your-domain.com/api/notifications/test-push \
     -H "Authorization: Bearer <USER_ACCESS_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"token": "<FCM_REGISTRATION_TOKEN>"}'
   ```
3. Verify the system lock-screen banner pops up with:
   - Title: "ODA Market Test Alert"
   - Icon: `/pwa-192x192.png`
   - Actions: "View Details" and "Dismiss"
4. Click the notification. Verify it brings ODA Market to the foreground and navigates to the target page.

### Test 4: Closed-Page / PWA Notification
1. Close all ODA Market tabs completely (service worker stays registered in background).
2. Trigger the notification.
3. Verify the notification appears via `/firebase-messaging-sw.js`.
4. Clicking it launches the browser, loads ODA Market, and focuses the target URL.

### Test 5: Authoritative Order Lifecycle Event
1. Complete a checkout transaction via Paystack.
2. Paystack webhook or `/api/checkout/verify` authoritatively verifies the payment HMAC signature and amount.
3. Upon verified payment:
   - Buyer receives: *"Order Confirmed! Your order #ODA-XXXXX is confirmed and is being prepared."*
   - Admins / Sellers receive: *"New Order Received! Order #ODA-XXXXX (KSh X,XXX) received."*
   - Entry is stored in `public.notifications` database table.
4. When Admin advances order to **Out for Delivery** or **Delivered**:
   - Buyer receives immediate push notification with tracking link (`/track-order?orderId=...`).

### Test 6: Promotional Notification Opt-Out
1. In Notification Preferences, turn off **Weekly Fresh Deals & Flash Discounts**.
2. When Admin broadcasts an announcement from the Admin Notification Center (`/admin/dashboard/notifications`), this device is automatically excluded.
3. Re-enabling the switch includes the device in subsequent promotional pushes.

### Test 7: Logout & Token Cleanup
1. Click **Sign Out** in the dashboard.
2. Verify the device token is unregistered from `/api/notifications/unregister-device`.
3. Notifications intended for that user account will no longer be delivered to the signed-out device.
