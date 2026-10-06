import { create } from "zustand";
import { User } from "@supabase/supabase-js";

interface Profile {
  id: string;
  role: "customer" | "buyer" | "seller" | "admin" | "super_admin" | "moderator" | "support_agent" | "content_manager";
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  email?: string | null;
  business_name: string | null;
  company_type: string | null;
  logo_url: string | null;
  cover_image: string | null;
  bio: string | null;
  location: string | null;
  country: string | null;
  phone: string | null;
  phone_number?: string | null;
  address?: string | null;
  whatsapp: string | null;
  verified: boolean;
}

export interface PendingOtpChallenge {
  challengeId: string;
  challengeToken: string;
  userId: string;
  email: string;
  maskedEmail: string;
  expiresAt: string;
  resendAvailableAt: number;
  redirectTo?: string;
}

const PENDING_OTP_STORAGE_KEY = "oda_pending_login_otp";

export function loadStoredPendingOtpChallenge(): PendingOtpChallenge | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(PENDING_OTP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingOtpChallenge;
    if (!parsed?.challengeId || !parsed?.challengeToken || !parsed?.expiresAt) {
      window.localStorage.removeItem(PENDING_OTP_STORAGE_KEY);
      return null;
    }
    if (Date.now() > new Date(parsed.expiresAt).getTime()) {
      window.localStorage.removeItem(PENDING_OTP_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredPendingOtpChallenge(challenge: PendingOtpChallenge | null): void {
  try {
    if (typeof window === "undefined") return;
    if (!challenge) {
      window.localStorage.removeItem(PENDING_OTP_STORAGE_KEY);
    } else {
      window.localStorage.setItem(PENDING_OTP_STORAGE_KEY, JSON.stringify(challenge));
    }
  } catch {
    // Ignore storage errors
  }
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  pendingOtpChallenge: PendingOtpChallenge | null;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (isLoading: boolean) => void;
  setPendingOtpChallenge: (challenge: PendingOtpChallenge | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  pendingOtpChallenge: loadStoredPendingOtpChallenge(),
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  setPendingOtpChallenge: (challenge) => {
    saveStoredPendingOtpChallenge(challenge);
    set({ pendingOtpChallenge: challenge });
  },
  signOut: () => {
    const existing = loadStoredPendingOtpChallenge();
    if (existing?.challengeId && existing?.challengeToken) {
      fetch("/api/auth/login-cancel-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: existing.challengeId,
          challengeToken: existing.challengeToken,
          userId: existing.userId,
        }),
      }).catch(() => {});
    }
    saveStoredPendingOtpChallenge(null);
    set({ user: null, profile: null, pendingOtpChallenge: null });
  },
}));
