// ==============================================================================
// Supabase Edge Function: send-fcm-notification
// Sends push notifications via Firebase Cloud Messaging HTTP v1 API
// Deploy with: supabase functions deploy send-fcm-notification
// ==============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PushRequest {
  userId: string;
  title: string;
  body: string;
  url?: string;
  orderId?: string;
  type?: string;
  category?: string;
}

function getDenoEnv(...keys: string[]): string | undefined {
  for (const k of keys) {
    try {
      const val = Deno.env.get(k);
      if (val && val.trim()) return val.trim();
    } catch {
      // ignore
    }
  }
  return undefined;
}

function resolveServiceAccount(): { serviceAccount: any | null; projectId: string } {
  const projectId =
    getDenoEnv("project_id", "PROJECT_ID", "FIREBASE_PROJECT_ID") || "odamarket-4cfaf";

  const rawJson = getDenoEnv("FIREBASE_SERVICE_ACCOUNT", "SERVICE_ACCOUNT");
  if (rawJson) {
    try {
      if (rawJson.startsWith("{")) {
        const sa = JSON.parse(rawJson);
        return { serviceAccount: sa, projectId: sa.project_id || projectId };
      }
      const sa = JSON.parse(atob(rawJson));
      return { serviceAccount: sa, projectId: sa.project_id || projectId };
    } catch (e) {
      console.warn("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", e);
    }
  }

  const rawPrivateKey = getDenoEnv("private_key", "PRIVATE_KEY", "FIREBASE_PRIVATE_KEY");
  const clientEmail = getDenoEnv("client_email", "CLIENT_EMAIL", "FIREBASE_CLIENT_EMAIL");

  if (clientEmail && rawPrivateKey) {
    let privateKey = rawPrivateKey;
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    privateKey = privateKey.replace(/\\n/g, "\n");

    const privateKeyId = getDenoEnv("private_key_id", "PRIVATE_KEY_ID", "FIREBASE_PRIVATE_KEY_ID");
    const clientId = getDenoEnv("client_id", "CLIENT_ID", "FIREBASE_CLIENT_ID");
    const authUrl = getDenoEnv("auth_url", "auth_uri", "AUTH_URL", "AUTH_URI") || "https://accounts.google.com/o/oauth2/auth";
    const authProviderCertUrl = getDenoEnv("authprovider_x509_cert_url", "auth_provider_x509_cert_url", "AUTHPROVIDER_X509_CERT_URL") || "https://www.googleapis.com/oauth2/v1/certs";
    const clientCertUrl = getDenoEnv("client_x509_cert_url", "CLIENT_X509_CERT_URL") || `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`;
    const universeDomain = getDenoEnv("universe_domain", "UNIVERSE_DOMAIN") || "googleapis.com";

    return {
      serviceAccount: {
        type: "service_account",
        project_id: projectId,
        private_key_id: privateKeyId,
        private_key: privateKey,
        client_email: clientEmail,
        client_id: clientId,
        auth_uri: authUrl,
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: authProviderCertUrl,
        client_x509_cert_url: clientCertUrl,
        universe_domain: universeDomain,
      },
      projectId,
    };
  }

  return { serviceAccount: null, projectId };
}

/**
 * Generates an OAuth2 access token for Google Firebase API using service account credentials
 */
async function getGoogleAccessToken(sa: any): Promise<string> {
  const serviceAccount = typeof sa === "string"
    ? (sa.startsWith("{") ? JSON.parse(sa) : JSON.parse(atob(sa)))
    : sa;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (str: string) =>
    btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

  const unsignedJwt = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(JSON.stringify(claimSet))}`;

  // Sign using Web Crypto API
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsignedJwt)
  );

  const signedJwt = `${unsignedJwt}.${base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  )}`;

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signedJwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const { serviceAccount, projectId: firebaseProjectId } = resolveServiceAccount();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, title, body, url, orderId, type, category }: PushRequest = await req.json();

    if (!userId || !title || !body) {
      return new Response(JSON.stringify({ error: "userId, title, and body are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Fetch user FCM tokens from fcm_tokens or user_metadata
    let tokens: string[] = [];
    const { data: tokenRows } = await supabase
      .from("fcm_tokens")
      .select("token, preferences")
      .eq("user_id", userId);

    if (tokenRows && tokenRows.length > 0) {
      tokens = tokenRows
        .filter((r) => {
          if (category === "promotions") return r.preferences?.promotions === true;
          return r.preferences?.orders !== false;
        })
        .map((r) => r.token);
    } else {
      const { data: userRes } = await supabase.auth.admin.getUserById(userId);
      const metaTokens = userRes?.user?.user_metadata?.fcm_tokens || [];
      tokens = metaTokens.map((t: any) => t.token);
    }

    // Record in-app notification in database
    await supabase.from("notifications").insert([{
      user_id: userId,
      title,
      message: body,
      type: type || "order_status",
      order_id: orderId || null,
      is_read: false
    }]);

    if (!serviceAccount || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          mode: serviceAccount ? "sent" : "simulation",
          tokensTargeted: tokens.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getGoogleAccessToken(serviceAccount);
    const targetUrl = url || (orderId ? `/track-order?orderId=${orderId}` : "/notifications");

    // Send HTTP v1 message to each token
    let successCount = 0;
    for (const token of tokens) {
      const fcmUrl = `https://fcm.googleapis.com/v1/projects/${firebaseProjectId}/messages:send`;
      const fcmMessage = {
        message: {
          token,
          notification: { title, body },
          data: {
            title,
            body,
            url: targetUrl,
            orderId: orderId || "",
            type: type || "order_status",
          },
          webpush: {
            fcm_options: { link: targetUrl },
            notification: {
              icon: "/pwa-192x192.png",
              badge: "/favicon.png",
            },
          },
        },
      };

      const res = await fetch(fcmUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fcmMessage),
      });

      if (res.ok) successCount++;
    }

    return new Response(
      JSON.stringify({ success: true, successCount, totalTokens: tokens.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
