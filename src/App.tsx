import { useState, useEffect, useRef } from 'react';
import { UserProvider, useUser } from '@/context/UserContext';
import { CartProvider } from '@/context/CartContext';
import { LanguageProvider, useLang } from '@/context/LanguageContext';
import { Header } from '@/components/Header';
import { HomePage } from '@/pages/HomePage';
import { TrackPage } from '@/pages/TrackPage';
import { AdminPage } from '@/pages/AdminPage';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { SignInModal } from '@/components/SignInModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import { fetchSettings } from '@/lib/data';
import { supabase } from '@/lib/supabase';
import { speakWarm, setVoiceLang, prepareNameForSpeech, type VoiceLang } from '@/lib/voice';
import { getGreetingPrefix, formatINR } from '@/lib/format';
import type { Order } from '@/types';

export type View = 'home' | 'menu' | 'track';

const SESSION_KEY = 'am_palace_session_token';

function getSessionToken(): string {
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

function AppContent() {
  const { profile, loading } = useUser();
  const { t } = useLang();
  const [view, setView] = useState<View>('home');
  const [showAdmin, setShowAdmin] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [feedbackOrder, setFeedbackOrder] = useState<Order | null>(null);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const greetingSpoken = useRef(false);
  const feedbackCheckDone = useRef(false);
  const sessionStarted = useRef(false);

  useEffect(() => {
    fetchSettings().then(setSettings);
  }, []);

  // Re-fetch settings when admin panel is closed so branding changes reflect immediately
  useEffect(() => {
    if (!showAdmin) {
      fetchSettings().then(setSettings);
    }
  }, [showAdmin]);

  useEffect(() => {
    if (settings.app_name) {
      document.title = `${settings.app_name} — Fast Food Delivery`;
    }
  }, [settings.app_name]);

  // Set global voice language from admin setting
  const voiceLang = ((settings.voice_language === 'bn' ? 'bn' : settings.voice_language === 'hi' ? 'hi' : 'en') as VoiceLang);

  useEffect(() => {
    setVoiceLang(voiceLang);
  }, [voiceLang]);

  // Gate app behind login — show sign-in if not logged in
  useEffect(() => {
    if (!loading && !profile && !showAdmin) {
      setSignInOpen(true);
    }
    if (showAdmin) {
      setSignInOpen(false);
    }
  }, [loading, profile, showAdmin]);

  // Active session heartbeat
  useEffect(() => {
    if (loading || showAdmin) return;
    const token = getSessionToken();
    const heartbeat = async () => {
      await supabase.from('active_sessions').upsert({
        session_token: token,
        profile_id: profile?.id ?? null,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'session_token' });
    };
    heartbeat();
    const interval = setInterval(heartbeat, 15000);
    return () => clearInterval(interval);
  }, [loading, profile, showAdmin]);

  // Cleanup old sessions on unmount
  useEffect(() => {
    return () => {
      const token = getSessionToken();
      supabase.from('active_sessions').delete().eq('session_token', token).then(() => {});
    };
  }, []);

  useEffect(() => {
    if (!loading && !greetingSpoken.current && profile) {
      const langKey = `welcome_greeting_${voiceLang}`;
      const restaurantName = settings.app_name || 'AM Palace';
      const fallback = voiceLang === 'bn'
        ? `${restaurantName}-এ [TITLE] [NAME]-কে স্বাগতম!`
        : voiceLang === 'hi'
          ? `${restaurantName} में [TITLE] [NAME] का स्वागत है!`
          : `Welcome [NAME] [TITLE] to ${restaurantName}!`;
      const template = settings[langKey] || fallback;
      if (!template) return;
      greetingSpoken.current = true;
      const timer = setTimeout(() => {
        const prefix = getGreetingPrefix(
          profile.gender,
          settings[`greeting_prefix_male_${voiceLang}`] || 'Sir',
          settings[`greeting_prefix_female_${voiceLang}`] || 'Maam',
        );
        const spoken = template
          .replace(/\[NAME\]/g, prepareNameForSpeech(profile.name))
          .replace(/\[TITLE\]/g, prefix)
          .replace(/\[RESTAURANT\]/g, restaurantName);
        speakWarm(spoken, voiceLang);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [loading, settings, profile, voiceLang]);

  // Auto-popup feedback for delivered orders 30 min after delivery, on app open
  useEffect(() => {
    if (loading || !profile || feedbackCheckDone.current) return;
    feedbackCheckDone.current = true;
    (async () => {
      try {
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('*')
          .eq('profile_id', profile.id)
          .eq('status', 'delivered')
          .not('delivered_at', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);
        if (!deliveredOrders || deliveredOrders.length === 0) return;

        // Load locally dismissed feedback order IDs (persistent across app opens)
        const dismissedRaw = localStorage.getItem('ampalace_feedback_done');
        const dismissedIds = new Set<string>(dismissedRaw ? (JSON.parse(dismissedRaw) as string[]) : []);

        const THIRTY_MIN = 30 * 60 * 1000;
        const now = Date.now();
        const eligible = (deliveredOrders as Order[]).filter(
          (o) => o.delivered_at && now - new Date(o.delivered_at).getTime() >= THIRTY_MIN,
        );
        if (eligible.length === 0) return;

        // Find the first eligible order that hasn't received feedback yet
        // and hasn't been locally dismissed
        for (const order of eligible) {
          if (dismissedIds.has(order.id)) continue;
          const { data: existingFeedback } = await supabase
            .from('feedback')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();
          if (!existingFeedback) {
            setTimeout(() => setFeedbackOrder(order), 2000);
            return;
          }
        }
      } catch {
        // silent
      }
    })();
  }, [loading, profile]);

  const handleNavigate = (v: View) => {
    setView(v);
    if (v === 'menu') {
      setView('home');
      setTimeout(() => {
        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  useEffect(() => {
    const checkAdminRoute = () => {
      const hash = window.location.hash.toLowerCase();
      setShowAdmin(hash === '#/admin' || hash === '#admin');
    };
    checkAdminRoute();
    window.addEventListener('hashchange', checkAdminRoute);
    window.addEventListener('popstate', checkAdminRoute);
    return () => {
      window.removeEventListener('hashchange', checkAdminRoute);
      window.removeEventListener('popstate', checkAdminRoute);
    };
  }, []);

  const handleOrderNow = () => {
    if (!profile) {
      setSignInOpen(true);
    } else {
      setView('home');
      setTimeout(() => {
        document.getElementById('menu-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const handleCheckout = () => {
    setCartOpen(false);
    if (!profile) {
      setSignInOpen(true);
    } else {
      setCheckoutOpen(true);
    }
  };

  const handleOrderPlaced = (order: Order) => {
    openWhatsApp(order, settings);
    setCheckoutOpen(false);
    setView('track');
  };

  const openWhatsApp = (order: Order, currentSettings: Record<string, string>) => {
    const ownerWhatsapp = currentSettings.owner_whatsapp_number || '';
    if (!ownerWhatsapp) return;
    const cleanNumber = ownerWhatsapp.replace(/[^0-9]/g, '');
    const genderLabel = order.customer_gender === 'male' ? 'Sir' : order.customer_gender === 'female' ? "Ma'am" : '';
    const mapsLink = order.delivery_lat && order.delivery_lng
      ? `https://www.google.com/maps?q=${order.delivery_lat},${order.delivery_lng}`
      : 'N/A';
    const itemsList = order.items.map(i => `  - ${i.quantity}x ${i.name} (${i.portion}) = ${formatINR(i.price * i.quantity)}`).join('\n');
    const orderDate = new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    const msg = `*New Order - ${currentSettings.app_name || 'AM Palace'}*\n\n*Customer:* ${order.customer_name} (${genderLabel})\n*Phone:* ${order.customer_phone || 'N/A'}\n*Order Type:* ${order.order_type === 'delivery' ? 'Home Delivery' : 'Pickup'}\n${order.order_type === 'delivery' ? `*Address:* ${order.delivery_address || 'N/A'}\n*GPS Location:* ${mapsLink}\n` : ''}*Date/Time:* ${orderDate}\n\n*Items:*\n${itemsList}\n\n*Subtotal:* ${formatINR(order.subtotal)}\n*Delivery Charge:* ${formatINR(order.delivery_charge)}\n*Total:* ${formatINR(order.total)}\n*Payment:* ${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (UPI)'}`;
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const triggerReminders = () => {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-reminders`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };
      fetch(url, { method: 'POST', headers }).catch(() => {});
    };
    triggerReminders();
    const interval = setInterval(triggerReminders, 60000);
    return () => clearInterval(interval);
  }, []);

  const feedbackVoices: Record<number, string> = {
    1: settings[`feedback_voice_1_${voiceLang}`] || '',
    2: settings[`feedback_voice_2_${voiceLang}`] || '',
    3: settings[`feedback_voice_3_${voiceLang}`] || '',
    4: settings[`feedback_voice_4_${voiceLang}`] || '',
    5: settings[`feedback_voice_5_${voiceLang}`] || '',
  };

  const isGated = !loading && !profile && !showAdmin;
  const showLoading = loading && !showAdmin;

  return (
    <div className="min-h-screen bg-dark-50">
      {(showAdmin || (!isGated && !showLoading)) && <Header view={view} onNavigate={handleNavigate} onOpenCart={() => setCartOpen(true)} appName={settings.app_name} appLogo={settings.app_logo} />}

      <main>
        {showAdmin ? (
          <AdminPage />
        ) : showLoading ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : isGated ? (
          <div className="min-h-[60vh]" />
        ) : (
          <>
            {view === 'home' && <HomePage onOrderNow={handleOrderNow} />}
            {view === 'track' && <TrackPage onGiveFeedback={setFeedbackOrder} />}
          </>
        )}
      </main>

      {(!isGated || showAdmin) && (
        <footer className="bg-dark-900 text-dark-400 py-8 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
            <p className="font-display font-bold text-white text-lg mb-1">{settings.app_name || 'AM Palace'}</p>
            <p className="text-sm">{t('footerTagline')}</p>
            <a
              href="#/admin"
              className="inline-block mt-3 text-[10px] text-dark-600 hover:text-dark-400 transition-colors select-none"
              aria-label="Admin"
              tabIndex={-1}
            >
              &middot;
            </a>
          </div>
        </footer>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onCheckout={handleCheckout}
      />

      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        settings={settings}
        onOrderPlaced={handleOrderPlaced}
      />

      <SignInModal
        open={signInOpen}
        onClose={() => setSignInOpen(false)}
      />

      <FeedbackModal
        open={feedbackOrder !== null}
        onClose={() => setFeedbackOrder(null)}
        order={feedbackOrder}
        malePrefix={settings[`greeting_prefix_male_${voiceLang}`] || 'Sir'}
        femalePrefix={settings[`greeting_prefix_female_${voiceLang}`] || 'Maam'}
        feedbackVoices={feedbackVoices}
        greetingLang={voiceLang}
      />
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </CartProvider>
    </UserProvider>
  );
}
