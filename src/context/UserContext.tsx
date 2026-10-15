import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchSettings } from '@/lib/data';
import type { Profile, Gender } from '@/types';

const DEMO_OTP = '123456';
const MOCK_SESSION_KEY = 'ampalace_mock_session';
const MOCK_PENDING_KEY = 'ampalace_mock_pending_phone';

export interface SendOtpResult {
  demo: boolean;
  message: string;
}

interface UserContextValue {
  profile: Profile | null;
  loading: boolean;
  sendOtp: (phone: string) => Promise<SendOtpResult>;
  verifyOtp: (phone: string, token: string) => Promise<{ needsProfile: boolean; profile: Profile | null }>;
  completeProfile: (name: string, gender: Gender) => Promise<Profile>;
  updateAvatar: (url: string) => Promise<void>;
  signOut: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  if (cleaned.startsWith('+')) return cleaned;
  return `+${cleaned}`;
}

async function storeDemoOtp(phone: string): Promise<void> {
  await supabase.from('otp_codes').insert({
    phone,
    code: DEMO_OTP,
    is_demo: true,
    consumed: false,
    expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore mock session from localStorage, or check Supabase Auth
  useEffect(() => {
    let mounted = true;

    (async () => {
      // Mock session takes priority for testing
      const mockSession = localStorage.getItem(MOCK_SESSION_KEY);
      if (mockSession && mounted) {
        try {
          const p = JSON.parse(mockSession) as Profile;
          setProfile(p);
        } catch {
          localStorage.removeItem(MOCK_SESSION_KEY);
        }
        if (mounted) setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted) {
          await loadProfileFromAuth(session.user.id);
        }
      } catch {
        // No active session — that's fine
      }
      if (mounted) setLoading(false);
    })();

    // Listen for auth state changes (real Supabase sessions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          await loadProfileFromAuth(session.user.id);
        } else if (!localStorage.getItem(MOCK_SESSION_KEY)) {
          setProfile(null);
        }
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadProfileFromAuth = async (authUserId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) return;
    if (data) {
      setProfile(data as Profile);
    }
  };

  const sendOtp = async (phone: string): Promise<SendOtpResult> => {
    const formattedPhone = formatPhone(phone);
    localStorage.setItem(MOCK_PENDING_KEY, formattedPhone);

    // Check if live SMS is enabled
    const settings = await fetchSettings();
    const liveEnabled = settings.sms_live_enabled === 'true';
    const hasApiKey = (settings.sms_api_key ?? '').trim().length > 0;

    if (liveEnabled && hasApiKey) {
      // Call edge function to send real SMS OTP
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms-otp`;
        const headers: Record<string, string> = {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        };
        const res = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({ phone: formattedPhone }),
        });
        const data = await res.json() as { success?: boolean; demo?: boolean; message?: string; error?: string };
        if (!res.ok || !data.success) {
          throw new Error(data.error ?? 'Failed to send OTP.');
        }
        return {
          demo: data.demo ?? false,
          message: data.message ?? 'OTP sent.',
        };
      } catch {
        // If edge function fails, fall back to demo OTP
        await storeDemoOtp(formattedPhone);
        return {
          demo: true,
          message: 'SMS gateway unavailable. Using demo OTP (123456) for testing.',
        };
      }
    }

    // Demo mode: store demo OTP in database so verify can check it
    await storeDemoOtp(formattedPhone);
    return {
      demo: true,
      message: 'Demo OTP sent. Use 123456 to verify (test mode).',
    };
  };

  const verifyOtp = async (phone: string, token: string): Promise<{ needsProfile: boolean; profile: Profile | null }> => {
    const formattedPhone = formatPhone(phone);

    // Check OTP against database
    const { data: otpRows } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('consumed', false)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestOtp = (otpRows ?? []) as { id: string; code: string; expires_at: string }[];
    const now = new Date();

    if (latestOtp.length === 0) {
      // No OTP record found — allow demo OTP as fallback
      if (token !== DEMO_OTP) {
        throw new Error('Invalid verification code. Please request a new OTP.');
      }
    } else {
      const record = latestOtp[0];
      const expired = new Date(record.expires_at) < now;
      if (expired) {
        throw new Error('Your OTP has expired. Please request a new one.');
      }
      if (record.code !== token) {
        throw new Error('Invalid verification code. Please check and try again.');
      }
      // Mark OTP as consumed
      await supabase.from('otp_codes').update({ consumed: true }).eq('id', record.id);
    }

    // Look up existing profile by phone
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', formattedPhone)
      .maybeSingle();

    if (existing) {
      const p = existing as Profile;
      if (!p.phone_verified) {
        await supabase.from('profiles').update({ phone_verified: true }).eq('id', p.id);
        p.phone_verified = true;
      }
      setProfile(p);
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(p));
      localStorage.removeItem(MOCK_PENDING_KEY);
      return { needsProfile: false, profile: p };
    }

    // No profile yet — caller needs to complete profile
    return { needsProfile: true, profile: null };
  };

  const completeProfile = async (name: string, gender: Gender): Promise<Profile> => {
    const pendingPhone = localStorage.getItem(MOCK_PENDING_KEY) || null;

    const { data, error } = await supabase
      .from('profiles')
      .insert({
        name,
        gender,
        phone: pendingPhone,
        phone_verified: true,
        auth_user_id: null,
      })
      .select()
      .single();
    if (error) throw error;
    const p = data as Profile;
    setProfile(p);
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(p));
    localStorage.removeItem(MOCK_PENDING_KEY);
    return p;
  };

  const updateAvatar = async (url: string) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', profile.id);
    if (error) throw error;
    const updated = { ...profile, avatar_url: url };
    setProfile(updated);
    if (localStorage.getItem(MOCK_SESSION_KEY)) {
      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(updated));
    }
  };

  const signOut = () => {
    localStorage.removeItem(MOCK_SESSION_KEY);
    localStorage.removeItem(MOCK_PENDING_KEY);
    supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <UserContext.Provider value={{ profile, loading, sendOtp, verifyOtp, completeProfile, updateAvatar, signOut }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
