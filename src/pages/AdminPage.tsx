import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LayoutDashboard, Utensils, ShoppingBag, Settings, Tag, Bell,
  Plus, Edit2, Trash2, X, Save, Mic, MessageSquare, Truck, Package, Clock,
  ToggleLeft, ToggleRight, CreditCard, Banknote, QrCode, Smartphone,
  Navigation, MapPin, ImageIcon, Users, Activity, Phone, Palette, Upload, Flame, LocateFixed, Gift, Trophy, Ban,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';
import { fetchCategories, fetchMenuItems, fetchSettings, updateSetting } from '@/lib/data';
import { useLang } from '@/context/LanguageContext';
import type { Category, MenuItem, Order, Offer, Profile } from '@/types';

type AdminTab = 'dashboard' | 'menu' | 'orders' | 'analytics' | 'voice' | 'sms' | 'delivery' | 'payment' | 'offers' | 'branding' | 'loyalty';

const ADMIN_PASSWORD_KEY = 'admin_password';

export function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [passInput, setPassInput] = useState('');
  const [passError, setPassError] = useState('');
  const [storedPass, setStoredPass] = useState('admin123');
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const { t } = useLang();

  useEffect(() => {
    fetchSettings().then((s) => {
      if (s[ADMIN_PASSWORD_KEY]) setStoredPass(s[ADMIN_PASSWORD_KEY]);
    });
  }, []);

  const handleLogin = () => {
    if (passInput === storedPass) {
      setAuthed(true);
      setPassError('');
    } else {
      setPassError(t('incorrectPassword'));
    }
  };

  if (!authed) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-2xl shadow-lg border border-dark-100 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-dark-900 flex items-center justify-center">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-dark-900">{t('adminPanel')}</h1>
              <p className="text-sm text-dark-500">{t('enterPassword')}</p>
            </div>
          </div>
          <input
            type="password"
            value={passInput}
            onChange={(e) => setPassInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            placeholder={t('adminPassword')}
            className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-dark-900 mb-3"
          />
          {passError && <p className="text-sm text-error-600 mb-3">{passError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3.5 rounded-xl bg-dark-900 text-white font-semibold hover:bg-dark-800 transition-colors"
          >
            {t('login')}
          </button>
          <p className="text-xs text-dark-400 mt-4 text-center">{t('defaultPassword')}</p>
        </div>
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
    { key: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { key: 'menu', label: t('menu'), icon: Utensils },
    { key: 'orders', label: t('incomingOrders'), icon: ShoppingBag },
    { key: 'analytics', label: t('analytics'), icon: Users },
    { key: 'voice', label: t('voice'), icon: Mic },
    { key: 'sms', label: t('sms'), icon: MessageSquare },
    { key: 'delivery', label: t('delivery'), icon: Truck },
    { key: 'payment', label: t('payment'), icon: CreditCard },
    { key: 'offers', label: t('offers'), icon: Tag },
    { key: 'branding', label: 'Branding', icon: Palette },
    { key: 'loyalty', label: 'Loyalty', icon: Gift },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-display font-bold text-dark-900">{t('adminDashboard')}</h1>
        <div className="flex items-center gap-2">
          <a
            href="#/"
            className="px-4 py-2 rounded-lg bg-primary-100 text-primary-700 text-sm font-medium hover:bg-primary-200 transition-colors"
          >
            Back to Store
          </a>
          <button
            onClick={() => setAuthed(false)}
            className="px-4 py-2 rounded-lg bg-dark-100 text-dark-700 text-sm font-medium hover:bg-dark-200"
          >
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-6 overflow-x-auto scrollbar-hide">
        {tabs.map((tabItem) => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                tab === tabItem.key
                  ? 'bg-dark-900 text-white'
                  : 'bg-white text-dark-600 hover:bg-dark-100 border border-dark-100'
              }`}
            >
              <Icon size={16} /> {tabItem.label}
            </button>
          );
        })}
      </div>

      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'menu' && <MenuTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'analytics' && <AnalyticsTab />}
      {tab === 'voice' && <VoiceTab />}
      {tab === 'sms' && <SMSTab />}
      {tab === 'delivery' && <DeliveryTab />}
      {tab === 'payment' && <PaymentTab />}
      {tab === 'offers' && <OffersTab />}
      {tab === 'branding' && <BrandingTab />}
      {tab === 'loyalty' && <LoyaltyTab />}
    </div>
  );
}

function DashboardTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuCount, setMenuCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      const { data: ords } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
      setOrders((ords ?? []) as Order[]);
      const { count } = await supabase.from('menu_items').select('*', { count: 'exact', head: true });
      setMenuCount(count ?? 0);
      const { count: nc } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('is_read', false);
      setNotifCount(nc ?? 0);
    })();
  }, []);

  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const pending = activeOrders.filter((o) => o.status === 'pending').length;
  const cancelledCount = orders.length - activeOrders.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('totalOrders')} value={activeOrders.length.toString()} icon={ShoppingBag} color="primary" />
        <StatCard label={t('revenue')} value={formatINR(totalRevenue)} icon={Package} color="success" />
        <StatCard label={t('pendingLabel')} value={pending.toString()} icon={Clock} color="warning" />
        <StatCard label={t('menuItems')} value={menuCount.toString()} icon={Utensils} color="accent" />
      </div>

      {cancelledCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-50 border border-error-200">
          <Ban size={16} className="text-error-600 shrink-0" />
          <p className="text-sm text-error-700">
            {cancelledCount} cancelled {cancelledCount === 1 ? 'order' : 'orders'} excluded from revenue and totals.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-dark-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bell size={18} className="text-primary-600" />
          <h3 className="font-display font-semibold text-dark-900">{t('recentOrders')}</h3>
          {notifCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-accent-500 text-white text-xs font-bold">{notifCount}</span>
          )}
        </div>
        <div className="space-y-2">
          {orders.slice(0, 8).map((o) => (
            <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors">
              <div>
                <p className="font-medium text-sm text-dark-900">{o.customer_name}</p>
                <p className="text-xs text-dark-400">{formatDate(o.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`font-semibold text-sm ${o.status === 'cancelled' ? 'text-dark-400 line-through' : 'text-dark-900'}`}>{formatINR(o.total)}</p>
                <p className="text-xs text-dark-500">
                  {o.status === 'pending' ? t('statusPending') :
                   o.status === 'preparing' ? t('statusPreparing') :
                   o.status === 'out_for_delivery' ? t('statusOnTheWay') :
                   o.status === 'delivered' ? t('statusDelivered') :
                   o.status === 'cancelled' ? t('statusCancelled') : o.status}
                </p>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-sm text-dark-400 py-4 text-center">{t('noOrdersYet')}</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: typeof Package; color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600',
    success: 'from-success-500 to-success-600',
    warning: 'from-warning-500 to-warning-600',
    accent: 'from-accent-500 to-accent-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-dark-100 p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-white" />
      </div>
      <p className="text-2xl font-display font-bold text-dark-900">{value}</p>
      <p className="text-sm text-dark-500">{label}</p>
    </div>
  );
}

function MenuTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { t } = useLang();

  const loadData = useCallback(async () => {
    const [cats, its] = await Promise.all([fetchCategories(), fetchMenuItems()]);
    setCategories(cats);
    setItems(its);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (item: Partial<MenuItem>) => {
    if (item.id) {
      await supabase.from('menu_items').update({
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        half_price: item.half_price,
        full_price: item.full_price,
        has_half: item.has_half,
        has_full: item.has_full,
        is_available: item.is_available,
        category_id: item.category_id,
      }).eq('id', item.id);
    } else {
      await supabase.from('menu_items').insert({
        category_id: item.category_id,
        name: item.name,
        description: item.description,
        image_url: item.image_url,
        half_price: item.half_price ?? 0,
        full_price: item.full_price ?? 0,
        has_half: item.has_half ?? true,
        has_full: item.has_full ?? true,
        is_available: item.is_available ?? true,
      });
    }
    setShowForm(false);
    setEditing(null);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteItemConfirm'))) return;
    await supabase.from('menu_items').delete().eq('id', id);
    loadData();
  };

  const toggleAvailability = async (item: MenuItem) => {
    const newVal = !item.is_available;
    await supabase.from('menu_items').update({ is_available: newVal }).eq('id', item.id);
    setItems((prev) => prev.map((m) => m.id === item.id ? { ...m, is_available: newVal } : m));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-dark-900">{t('menuManagement')}</h3>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900 text-white text-sm font-medium hover:bg-dark-800"
        >
          <Plus size={16} /> {t('addItem')}
        </button>
      </div>

      {showForm && (
        <MenuItemForm
          item={editing}
          categories={categories}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl bg-white border border-dark-100 ${!item.is_available ? 'opacity-60' : ''}`}>
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.name}
                className={`w-14 h-14 rounded-lg object-cover ${!item.is_available ? 'grayscale' : ''}`}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-dark-900 text-sm ${!item.is_available ? 'text-dark-400' : ''}`}>{item.name}</p>
              <p className="text-xs text-dark-400">
                {item.has_half && `Half ${formatINR(item.half_price)}`}
                {item.has_half && item.has_full && ' · '}
                {item.has_full && `Full ${formatINR(item.full_price)}`}
              </p>
            </div>
            <button
              onClick={() => toggleAvailability(item)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
              title={item.is_available ? 'Mark as unavailable' : 'Mark as available'}
            >
              {item.is_available ? (
                <>
                  <ToggleRight size={28} className="text-success-500" />
                  <span className="text-success-600">{t('available')}</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={28} className="text-dark-400" />
                  <span className="text-dark-500">{t('unavailable')}</span>
                </>
              )}
            </button>
            <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-2 rounded-lg hover:bg-dark-100">
              <Edit2 size={16} className="text-dark-600" />
            </button>
            <button onClick={() => handleDelete(item.id)} className="p-2 rounded-lg hover:bg-error-50">
              <Trash2 size={16} className="text-error-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MenuItemForm({ item, categories, onSave, onCancel }: {
  item: MenuItem | null;
  categories: Category[];
  onSave: (item: Partial<MenuItem>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(item?.name ?? '');
  const [description, setDescription] = useState(item?.description ?? '');
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? '');
  const [halfPrice, setHalfPrice] = useState(item?.half_price ?? 0);
  const [fullPrice, setFullPrice] = useState(item?.full_price ?? 0);
  const [hasHalf, setHasHalf] = useState(item?.has_half ?? true);
  const [hasFull, setHasFull] = useState(item?.has_full ?? true);
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true);
  const [categoryId, setCategoryId] = useState(item?.category_id ?? categories[0]?.id ?? '');
  const { t } = useLang();

  return (
    <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-dark-900">{item ? t('editItem') : t('newItem')}</h4>
        <button onClick={onCancel} className="p-2 rounded-lg hover:bg-dark-100"><X size={18} className="text-dark-500" /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
      <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Image URL" className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-sm text-dark-700 mb-1">
            <input type="checkbox" checked={hasHalf} onChange={(e) => setHasHalf(e.target.checked)} className="rounded" /> {t('halfPrice')}
          </label>
          <input type="number" value={halfPrice} onChange={(e) => setHalfPrice(Number(e.target.value))} disabled={!hasHalf} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 disabled:opacity-50" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-dark-700 mb-1">
            <input type="checkbox" checked={hasFull} onChange={(e) => setHasFull(e.target.checked)} className="rounded" /> {t('fullPrice')}
          </label>
          <input type="number" value={fullPrice} onChange={(e) => setFullPrice(Number(e.target.value))} disabled={!hasFull} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 disabled:opacity-50" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-dark-700">
        <input type="checkbox" checked={isAvailable} onChange={(e) => setIsAvailable(e.target.checked)} className="rounded" /> {t('available')}
      </label>
      <button
        onClick={() => onSave({ id: item?.id, name, description, image_url: imageUrl, half_price: halfPrice, full_price: fullPrice, has_half: hasHalf, has_full: hasFull, is_available: isAvailable, category_id: categoryId })}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800"
      >
        <Save size={16} /> {t('save')}
      </button>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders((data ?? []) as Order[]);
    })();

    const channel = supabase
      .channel('orders-admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        } else if (payload.eventType === 'INSERT') {
          const inserted = payload.new as Order;
          setOrders((prev) => [inserted, ...prev]);
        }
      })
      .subscribe();

    const interval = setInterval(async () => {
      const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      setOrders((data ?? []) as Order[]);
    }, 5000);
    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === 'delivered') {
      patch.delivered_at = new Date().toISOString();
    } else {
      patch.delivered_at = null;
    }
    await supabase.from('orders').update(patch).eq('id', id);

    // When an order is cancelled, remove its loyalty reward box stamp
    // and decrement the customer's loyalty_count so progress stays accurate.
    if (status === 'cancelled') {
      await supabase.from('loyalty_progress').delete().eq('order_id', id);
      const { data: ord } = await supabase.from('orders').select('profile_id').eq('id', id).maybeSingle();
      const profileId = (ord as { profile_id: string | null } | null)?.profile_id;
      if (profileId) {
        const { data: prof } = await supabase
          .from('profiles')
          .select('loyalty_count')
          .eq('id', profileId)
          .maybeSingle();
        if (prof) {
          const newCount = Math.max(0, prof.loyalty_count - 1);
          await supabase
            .from('profiles')
            .update({ loyalty_count: newCount, reward_unlocked: newCount >= 7 })
            .eq('id', profileId);
        }
      }
    }

    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status: status as Order['status'], delivered_at: patch.delivered_at as string | null } : o));
  };

  const statuses = ['pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

  type OrderFilter = 'all' | 'active' | 'cancelled';
  const [filter, setFilter] = useState<OrderFilter>('all');

  const filteredOrders = filter === 'cancelled'
    ? orders.filter((o) => o.status === 'cancelled')
    : filter === 'active'
      ? orders.filter((o) => o.status !== 'cancelled')
      : orders;

  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  return (
    <div className="space-y-3">
      <h3 className="font-display font-semibold text-lg text-dark-900">{t('incomingOrders')}</h3>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'active', 'cancelled'] as OrderFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f
                ? f === 'cancelled'
                  ? 'bg-error-600 text-white'
                  : 'bg-dark-900 text-white'
                : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
            }`}
          >
            {f === 'all' ? `All (${orders.length})` : f === 'active' ? `Active (${orders.length - cancelledCount})` : `Cancelled (${cancelledCount})`}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-sm text-dark-400 py-8 text-center">
          {filter === 'cancelled' ? 'No cancelled orders.' : t('noOrdersYet')}
        </p>
      ) : (
        filteredOrders.map((o) => (
          <div key={o.id} className={`bg-white rounded-2xl border p-4 ${o.status === 'cancelled' ? 'border-error-200 bg-error-50/30' : 'border-dark-100'}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-dark-900">{o.customer_name}</p>
                <p className="text-sm text-dark-500">{o.customer_phone} · {formatDate(o.created_at)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${o.order_type === 'pickup' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                    {o.order_type === 'pickup' ? t('pickup') : t('homeDelivery')}
                  </span>
                  {o.payment_method === 'online' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-accent-100 text-accent-700">{t('onlineUpi')}</span>
                  )}
                  {o.payment_method === 'cod' && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-success-100 text-success-700">{t('cashOnDelivery')}</span>
                  )}
                </div>
                {o.delivery_address && (
                  <p className="text-xs text-dark-400 mt-1.5 flex items-start gap-1">
                    <MapPin size={12} className="text-primary-500 shrink-0 mt-0.5" />
                    {o.delivery_address}
                  </p>
                )}
                {o.delivery_lat && o.delivery_lng && (
                  <a
                    href={`https://www.google.com/maps?q=${o.delivery_lat},${o.delivery_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Navigation size={12} /> {t('navigateMaps')}
                  </a>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className={`font-display font-bold text-lg ${o.status === 'cancelled' ? 'text-dark-400 line-through' : 'text-dark-900'}`}>{formatINR(o.total)}</p>
                <p className="text-xs text-dark-400">{o.status === 'cancelled' ? 'Excluded from revenue' : `Sub: ${formatINR(o.subtotal)} + ${formatINR(o.delivery_charge)}`}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {o.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-dark-50 border border-dark-100">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-dark-100 shrink-0">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={14} className="text-dark-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-dark-800 truncate">{item.name}</p>
                    <p className="text-[10px] text-dark-400">{item.quantity}× {item.portion} · {formatINR(item.price)}</p>
                  </div>
                  <p className="text-xs font-semibold text-dark-700 shrink-0">{formatINR(item.price * item.quantity)}</p>
                </div>
              ))}
            </div>
            {o.status === 'cancelled' && (
              <div className="mb-3 p-3 rounded-xl bg-error-50 border border-error-200">
                <div className="flex items-center gap-2 mb-1">
                  <Ban size={14} className="text-error-600 shrink-0" />
                  <span className="text-xs font-bold text-error-700">Order Cancelled</span>
                </div>
                {o.cancellation_reason && (
                  <p className="text-xs text-error-600 ml-5">
                    <span className="font-medium">Reason:</span> {o.cancellation_reason}
                  </p>
                )}
                <p className="text-xs text-error-500 ml-5 mt-0.5">
                  <span className="font-medium">Cancelled at:</span> {formatDate(o.created_at)}
                </p>
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(o.id, s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                    o.status === s
                      ? 'bg-dark-900 text-white'
                      : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                  }`}
                >
                  {s === 'pending' ? t('statusPending') :
                   s === 'preparing' ? t('statusPreparingLabel') :
                   s === 'out_for_delivery' ? t('statusOutForDeliveryLabel') :
                   s === 'delivered' ? t('statusDeliveredLabel') :
                   s === 'cancelled' ? t('statusCancelledLabel') : s}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function AnalyticsTab() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeCount, setActiveCount] = useState(0);
  const [orderStats, setOrderStats] = useState({ totalRevenue: 0, totalOrders: 0, cancelledOrders: 0, avgOrderValue: 0 });
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setProfiles((data ?? []) as Profile[]);

      const { data: ords } = await supabase.from('orders').select('total, status').order('created_at', { ascending: false });
      const allOrders = (ords ?? []) as { total: number; status: string }[];
      const active = allOrders.filter((o) => o.status !== 'cancelled');
      const revenue = active.reduce((sum, o) => sum + o.total, 0);
      setOrderStats({
        totalRevenue: revenue,
        totalOrders: active.length,
        cancelledOrders: allOrders.length - active.length,
        avgOrderValue: active.length > 0 ? Math.round(revenue / active.length) : 0,
      });
    })();

    const fetchActive = async () => {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from('active_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('last_seen', twoMinAgo);
      setActiveCount(count ?? 0);
    };
    fetchActive();
    const interval = setInterval(fetchActive, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <Users size={20} className="text-primary-600" /> {t('analytics')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-dark-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-3">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-3xl font-display font-bold text-dark-900">{profiles.length}</p>
          <p className="text-sm text-dark-500">{t('totalRegisteredUsers')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-dark-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center mb-3">
            <Activity size={20} className="text-white" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-display font-bold text-dark-900">{activeCount}</p>
            <span className="flex items-center gap-1 text-xs font-medium text-success-600">
              <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" /> Live
            </span>
          </div>
          <p className="text-sm text-dark-500">{t('liveActiveUsers')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-dark-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center mb-3">
            <Package size={20} className="text-white" />
          </div>
          <p className="text-2xl font-display font-bold text-dark-900">{formatINR(orderStats.totalRevenue)}</p>
          <p className="text-sm text-dark-500">Total Revenue</p>
        </div>
        <div className="bg-white rounded-2xl border border-dark-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-3">
            <ShoppingBag size={20} className="text-white" />
          </div>
          <p className="text-2xl font-display font-bold text-dark-900">{orderStats.totalOrders}</p>
          <p className="text-sm text-dark-500">Active Orders</p>
        </div>
        <div className="bg-white rounded-2xl border border-dark-100 p-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center mb-3">
            <CreditCard size={20} className="text-white" />
          </div>
          <p className="text-2xl font-display font-bold text-dark-900">{formatINR(orderStats.avgOrderValue)}</p>
          <p className="text-sm text-dark-500">Avg Order Value</p>
        </div>
      </div>

      {orderStats.cancelledOrders > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error-50 border border-error-200">
          <Ban size={16} className="text-error-600 shrink-0" />
          <p className="text-sm text-error-700">
            {orderStats.cancelledOrders} cancelled {orderStats.cancelledOrders === 1 ? 'order' : 'orders'} excluded from revenue and sales totals.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-dark-100 p-5">
        <h4 className="font-semibold text-dark-900 mb-3">{t('registeredUsersList')}</h4>
        {profiles.length === 0 ? (
          <p className="text-sm text-dark-400 py-4 text-center">{t('noRegisteredUsers')}</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-50 hover:bg-dark-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-700">{p.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-dark-900">{p.name}</p>
                    <p className="text-xs text-dark-400 flex items-center gap-1">
                      <Phone size={10} /> {p.phone || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {p.phone_verified && (
                    <span className="px-2 py-0.5 rounded-full bg-success-100 text-success-600 text-[10px] font-medium">
                      {t('phoneVerified')}
                    </span>
                  )}
                  <p className="text-xs text-dark-400 mt-0.5">{formatDate(p.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { t } = useLang();

  useEffect(() => { fetchSettings().then(setSettings); }, []);

  const voiceLang = (settings.voice_language === 'bn' ? 'bn' : settings.voice_language === 'hi' ? 'hi' : 'en') as 'en' | 'bn' | 'hi';

  const langSuffix = voiceLang;
  const emojiRatings = [
    { key: `feedback_voice_5_${langSuffix}`, label: t('rating5Label'), emoji: '😄' },
    { key: `feedback_voice_4_${langSuffix}`, label: t('rating4Label'), emoji: '🙂' },
    { key: `feedback_voice_3_${langSuffix}`, label: t('rating3Label'), emoji: '😐' },
    { key: `feedback_voice_2_${langSuffix}`, label: t('rating2Label'), emoji: '😞' },
    { key: `feedback_voice_1_${langSuffix}`, label: t('rating1Label'), emoji: '😡' },
  ];

  const greetingKey = `welcome_greeting_${langSuffix}`;
  const malePrefixKey = `greeting_prefix_male_${langSuffix}`;
  const femalePrefixKey = `greeting_prefix_female_${langSuffix}`;
  const apologyKey = `apology_message_${langSuffix}`;
  const loyaltyKey = `loyalty_reward_text_${langSuffix}`;

  const allKeys = [
    'voice_language',
    `welcome_greeting_en`, `welcome_greeting_bn`, `welcome_greeting_hi`,
    `greeting_prefix_male_en`, `greeting_prefix_male_bn`, `greeting_prefix_male_hi`,
    `greeting_prefix_female_en`, `greeting_prefix_female_bn`, `greeting_prefix_female_hi`,
    `apology_message_en`, `apology_message_bn`, `apology_message_hi`,
    `loyalty_reward_text_en`, `loyalty_reward_text_bn`, `loyalty_reward_text_hi`,
    ...[1,2,3,4,5].map(n => `feedback_voice_${n}_en`),
    ...[1,2,3,4,5].map(n => `feedback_voice_${n}_bn`),
    ...[1,2,3,4,5].map(n => `feedback_voice_${n}_hi`),
  ];

  const handleSave = async () => {
    setSaving(true);
    for (const key of allKeys) {
      if (settings[key] !== undefined) {
        await updateSetting(key, settings[key]);
      }
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <Mic size={20} className="text-primary-600" /> {t('voiceGreetingSettings')}
      </h3>

      {/* Admin Voice Language Selector */}
      <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl border border-primary-200 p-5 space-y-4">
        <div>
          <label className="block text-sm font-bold text-dark-800 mb-1">{t('voiceLanguageAdmin')}</label>
          <p className="text-xs text-dark-500 mb-3">{t('voiceLanguageAdminHint')}</p>
          <div className="grid grid-cols-3 gap-2">
            {(['en', 'bn', 'hi'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setSettings({ ...settings, voice_language: l })}
                className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  voiceLang === l
                    ? 'border-primary-500 bg-white text-primary-700 shadow-sm'
                    : 'border-transparent bg-white/50 text-dark-500 hover:bg-white'
                }`}
              >
                {l === 'en' ? t('greetingEnglish') : l === 'bn' ? t('greetingBengali') : t('greetingHindi')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates for selected language */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-dark-100">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
            {voiceLang === 'en' ? t('greetingEnglish') : voiceLang === 'bn' ? t('greetingBengali') : t('greetingHindi')} Templates
          </span>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">{t('welcomeGreeting')}</label>
          <p className="text-xs text-dark-400 mb-2">{t('welcomeGreetingHint')}</p>
          <textarea
            value={settings[greetingKey] ?? ''}
            onChange={(e) => setSettings({ ...settings, [greetingKey]: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">{t('malePrefix')}</label>
            <input
              value={settings[malePrefixKey] ?? ''}
              onChange={(e) => setSettings({ ...settings, [malePrefixKey]: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">{t('femalePrefix')}</label>
            <input
              value={settings[femalePrefixKey] ?? ''}
              onChange={(e) => setSettings({ ...settings, [femalePrefixKey]: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">{t('apologyTemplate')}</label>
          <textarea
            value={settings[apologyKey] ?? ''}
            onChange={(e) => setSettings({ ...settings, [apologyKey]: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">{t('loyaltyTemplate')}</label>
          <textarea
            value={settings[loyaltyKey] ?? ''}
            onChange={(e) => setSettings({ ...settings, [loyaltyKey]: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>
      </div>

      {/* Emoji Feedback Voice Manager */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div>
          <h4 className="font-semibold text-dark-900 mb-1">{t('emojiFeedbackManager')}</h4>
          <p className="text-xs text-dark-400 mb-3">{t('emojiFeedbackHint')}</p>
        </div>
        {emojiRatings.map((r) => (
          <div key={r.key}>
            <label className="flex items-center gap-2 text-sm font-medium text-dark-700 mb-1">
              <span className="text-xl">{r.emoji}</span> {r.label}
            </label>
            <textarea
              value={settings[r.key] ?? ''}
              onChange={(e) => setSettings({ ...settings, [r.key]: e.target.value })}
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
      >
        <Save size={16} /> {saving ? t('saving') : t('saveSettings')}
      </button>
    </div>
  );
}

function SMSTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [reminders, setReminders] = useState<{ id: string; item_name: string; phone: string | null; status: string; reminder_time: string }[]>([]);
  const { t } = useLang();

  useEffect(() => {
    fetchSettings().then(setSettings);
    supabase.from('reminders').select('*').order('created_at', { ascending: false }).limit(20).then(({ data }) => {
      setReminders((data ?? []) as never);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSetting('reorder_sms_template', settings.reorder_sms_template ?? '');
    await updateSetting('sms_provider', settings.sms_provider ?? '');
    await updateSetting('sms_api_key', settings.sms_api_key ?? '');
    await updateSetting('sms_sender_id', settings.sms_sender_id ?? '');
    await updateSetting('sms_dlt_template_id', settings.sms_dlt_template_id ?? '');
    await updateSetting('sms_live_enabled', settings.sms_live_enabled === 'true' ? 'true' : 'false');
    setSaving(false);
  };

  const liveEnabled = settings.sms_live_enabled === 'true';
  const hasApiKey = (settings.sms_api_key ?? '').trim().length > 0;

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <MessageSquare size={20} className="text-primary-600" /> {t('reOrderSmsTemplates')}
      </h3>

      {/* SMS Gateway Configuration */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div>
          <h4 className="font-semibold text-dark-900">SMS Gateway Settings</h4>
          <p className="text-xs text-dark-400 mt-0.5">Configure your SMS provider to send real OTP messages. When disabled, demo OTP (123456) is used for testing.</p>
        </div>

        {/* Live SMS Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-dark-50 border border-dark-100">
          <div>
            <p className="text-sm font-semibold text-dark-800">Enable Live SMS</p>
            <p className="text-xs text-dark-400 mt-0.5">
              {liveEnabled
                ? hasApiKey
                  ? 'Live SMS is ON — real OTPs will be sent via your gateway.'
                  : 'Live SMS is ON but no API key set. Add your API key below and save.'
                : 'Live SMS is OFF — demo OTP (123456) will be used for all logins.'}
            </p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, sms_live_enabled: liveEnabled ? 'false' : 'true' })}
            className="flex items-center gap-1.5"
          >
            {liveEnabled
              ? <><ToggleRight size={32} className="text-success-500" /><span className="text-xs font-medium text-success-600">ON</span></>
              : <><ToggleLeft size={32} className="text-dark-400" /><span className="text-xs font-medium text-dark-500">OFF</span></>
            }
          </button>
        </div>

        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">SMS Provider</label>
          <p className="text-xs text-dark-400 mb-2">Select your SMS gateway provider.</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(['msg91', 'textlocal', 'fast2sms', 'gupshup', 'generic', ''].map((p) => (
              <button
                key={p || 'none'}
                onClick={() => setSettings({ ...settings, sms_provider: p })}
                className={`px-3 py-2.5 rounded-lg text-xs font-medium capitalize transition-all ${
                  (settings.sms_provider ?? '') === p
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                }`}
              >
                {p === '' ? 'None' : p}
              </button>
            )))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">API Key</label>
          <input
            type="password"
            value={settings.sms_api_key ?? ''}
            onChange={(e) => setSettings({ ...settings, sms_api_key: e.target.value })}
            placeholder="Enter your SMS gateway API key"
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
          />
        </div>

        {/* Sender ID & DLT Template ID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">Sender ID</label>
            <input
              value={settings.sms_sender_id ?? ''}
              onChange={(e) => setSettings({ ...settings, sms_sender_id: e.target.value })}
              placeholder="e.g. AMPALCE"
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">DLT Template ID</label>
            <input
              value={settings.sms_dlt_template_id ?? ''}
              onChange={(e) => setSettings({ ...settings, sms_dlt_template_id: e.target.value })}
              placeholder="e.g. 1107165800000032"
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
            />
          </div>
        </div>

        {/* Status Badge */}
        <div className={`p-3 rounded-xl border ${liveEnabled && hasApiKey ? 'bg-success-50 border-success-200' : 'bg-warning-50 border-warning-200'}`}>
          <p className={`text-xs font-medium ${liveEnabled && hasApiKey ? 'text-success-700' : 'text-warning-700'}`}>
            {liveEnabled && hasApiKey
              ? 'Live mode active — real SMS OTPs will be sent to customers.'
              : liveEnabled && !hasApiKey
                ? 'Live mode enabled but API key is missing. Demo OTP (123456) will be used until an API key is saved.'
                : 'Demo mode active — all OTPs default to 123456. Enable Live SMS to send real OTPs.'}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('saveSettings')}
        </button>
      </div>

      {/* Re-order SMS Template */}
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">{t('smsTemplate')}</label>
          <p className="text-xs text-dark-400 mb-2">{t('smsTemplateHint')}</p>
          <textarea
            value={settings.reorder_sms_template ?? ''}
            onChange={(e) => setSettings({ ...settings, reorder_sms_template: e.target.value })}
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('saveTemplate')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 p-5">
        <h4 className="font-semibold text-dark-900 mb-3">{t('scheduledReminders')}</h4>
        {reminders.length === 0 ? (
          <p className="text-sm text-dark-400">{t('noReminders')}</p>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-50">
                <div>
                  <p className="text-sm font-medium text-dark-900">{r.item_name}</p>
                  <p className="text-xs text-dark-400">{r.phone} · {formatDate(r.reminder_time)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${r.status === 'sent' ? 'bg-success-100 text-success-600' : 'bg-warning-100 text-warning-600'}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const { t } = useLang();

  useEffect(() => { fetchSettings().then(setSettings); }, []);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by this browser.');
      return;
    }
    setDetecting(true);
    setGpsError('');
    setGpsSuccess(false);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        let address = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
            { headers: { 'Accept-Language': 'en' } },
          );
          if (res.ok) {
            const data = await res.json();
            address = data.display_name ?? '';
          }
        } catch {
          // reverse geocoding is best-effort; coordinates still get filled
        }
        setSettings((prev) => ({
          ...prev,
          restaurant_lat: lat,
          restaurant_lng: lng,
          ...(address ? { store_address: address } : {}),
        }));
        setDetecting(false);
        setGpsSuccess(true);
        setTimeout(() => setGpsSuccess(false), 3000);
      },
      (err) => {
        setDetecting(false);
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Please allow location access in your browser.'
            : err.code === err.POSITION_UNAVAILABLE
            ? 'Location unavailable. Try again or enter coordinates manually.'
            : err.code === err.TIMEOUT
            ? 'Location request timed out. Try again.'
            : 'Could not detect location. Please try again.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const fields = [
    { key: 'delivery_radius_km', label: t('deliveryRadius') },
    { key: 'delivery_charge_base', label: t('baseDeliveryCharge') },
    { key: 'delivery_charge_per_km', label: t('perKmCharge') },
    { key: 'min_order_amount', label: t('minOrderAmount') },
    { key: 'restaurant_lat', label: t('branchLatitude') },
    { key: 'restaurant_lng', label: t('branchLongitude') },
    { key: 'store_open_time', label: t('storeOpenTime') },
    { key: 'store_close_time', label: t('storeCloseTime') },
  ];

  const slabFields = [
    { num: '1', labelKey: 'delivery_slab_1_label', maxKey: 'delivery_slab_1_max_km', chargeKey: 'delivery_slab_1_charge' },
    { num: '2', labelKey: 'delivery_slab_2_label', maxKey: 'delivery_slab_2_max_km', chargeKey: 'delivery_slab_2_charge' },
    { num: '3', labelKey: 'delivery_slab_3_label', maxKey: 'delivery_slab_3_max_km', chargeKey: 'delivery_slab_3_charge' },
  ];

  const handleSave = async () => {
    setSaving(true);
    for (const f of fields) {
      if (settings[f.key] !== undefined) {
        await updateSetting(f.key, settings[f.key]);
      }
    }
    await updateSetting('store_closed', settings.store_closed === 'true' ? 'true' : 'false');
    await updateSetting('store_address', settings.store_address ?? '');
    await updateSetting('owner_whatsapp_number', settings.owner_whatsapp_number ?? '');
    await updateSetting('helpline_number', settings.helpline_number ?? '');
    for (const slab of slabFields) {
      await updateSetting(slab.labelKey, settings[slab.labelKey] ?? '');
      await updateSetting(slab.maxKey, settings[slab.maxKey] ?? '');
      await updateSetting(slab.chargeKey, settings[slab.chargeKey] ?? '');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <Truck size={20} className="text-primary-600" /> {t('deliveryAndStoreHours')}
      </h3>
      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
          <p className="text-xs text-dark-600">
            {t('branchLocationInfo')}
          </p>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
          <div>
            <p className="text-sm font-medium text-dark-800">{t('storeStatus')}</p>
            <p className="text-xs text-dark-400">{t('storeStatusHint')}</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, store_closed: settings.store_closed === 'true' ? 'false' : 'true' })}
            className="flex items-center gap-1.5"
          >
            {settings.store_closed === 'true' ? (
              <><ToggleLeft size={32} className="text-error-500" /><span className="text-xs font-medium text-error-600">{t('closed')}</span></>
            ) : (
              <><ToggleRight size={32} className="text-success-500" /><span className="text-xs font-medium text-success-600">{t('open')}</span></>
            )}
          </button>
        </div>

        {/* Store Address */}
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-1">{t('storeAddress')}</label>
          <textarea
            value={settings.store_address ?? ''}
            onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>

        {/* GPS Location Detection */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-semibold text-dark-800 flex items-center gap-2">
                <LocateFixed size={18} className="text-primary-600" /> Detect Live Location
              </p>
              <p className="text-xs text-dark-500 mt-0.5">Use your device GPS to auto-fill the store coordinates and address.</p>
            </div>
            <button
              onClick={handleDetectLocation}
              disabled={detecting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60 transition-colors"
            >
              <LocateFixed size={16} className={detecting ? 'animate-spin' : ''} />
              {detecting ? 'Detecting...' : 'Use My Current Location'}
            </button>
          </div>
          {gpsSuccess && (
            <p className="text-xs font-medium text-success-700 flex items-center gap-1.5">
              <MapPin size={14} /> Location detected! Coordinates and address filled in below. Save to confirm.
            </p>
          )}
          {gpsError && (
            <p className="text-xs font-medium text-error-600">{gpsError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-dark-700 mb-1">{f.label}</label>
              <input
                value={settings[f.key] ?? ''}
                onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
              />
            </div>
          ))}
        </div>

        {/* Owner WhatsApp Number */}
        <div className="p-3 rounded-xl bg-success-50 border border-success-200">
          <label className="block text-sm font-medium text-dark-800 mb-1">{t('ownerWhatsappNumber')}</label>
          <p className="text-xs text-dark-500 mb-2">{t('ownerWhatsappHint')}</p>
          <input
            value={settings.owner_whatsapp_number ?? ''}
            onChange={(e) => setSettings({ ...settings, owner_whatsapp_number: e.target.value })}
            placeholder="+91XXXXXXXXXX"
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
          />
        </div>

        {/* Helpline Number */}
        <div className="p-3 rounded-xl bg-primary-50 border border-primary-200">
          <label className="block text-sm font-medium text-dark-800 mb-1">Helpline Number</label>
          <p className="text-xs text-dark-500 mb-2">Displayed on the Track Order page so customers can call for help with their order.</p>
          <input
            value={settings.helpline_number ?? ''}
            onChange={(e) => setSettings({ ...settings, helpline_number: e.target.value })}
            placeholder="+91XXXXXXXXXX"
            className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
          />
        </div>

        {/* Delivery Fee Slabs */}
        <div>
          <label className="block text-sm font-medium text-dark-700 mb-2">{t('deliveryFeeSlabs')}</label>
          <div className="space-y-2">
            {slabFields.map((slab) => (
              <div key={slab.num} className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-dark-50 border border-dark-100">
                <input
                  value={settings[slab.labelKey] ?? ''}
                  onChange={(e) => setSettings({ ...settings, [slab.labelKey]: e.target.value })}
                  placeholder={t('slabLabelPlaceholder', { num: slab.num })}
                  className="px-2.5 py-2 rounded-lg border border-dark-200 text-xs outline-none focus:border-primary-500"
                />
                <input
                  value={settings[slab.maxKey] ?? ''}
                  onChange={(e) => setSettings({ ...settings, [slab.maxKey]: e.target.value })}
                  placeholder={t('slabMaxKmPlaceholder')}
                  type="number"
                  className="px-2.5 py-2 rounded-lg border border-dark-200 text-xs outline-none focus:border-primary-500"
                />
                <input
                  value={settings[slab.chargeKey] ?? ''}
                  onChange={(e) => setSettings({ ...settings, [slab.chargeKey]: e.target.value })}
                  placeholder={t('slabChargePlaceholder')}
                  type="number"
                  className="px-2.5 py-2 rounded-lg border border-dark-200 text-xs outline-none focus:border-primary-500"
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-dark-400 mt-1">{t('slabHint')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('saveSettings')}
        </button>
      </div>
    </div>
  );
}

function PaymentTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const { t } = useLang();

  useEffect(() => { fetchSettings().then(setSettings); }, []);

  const onlineEnabled = settings.online_payment_enabled === 'true';

  const handleSave = async () => {
    setSaving(true);
    await updateSetting('online_payment_enabled', settings.online_payment_enabled === 'true' ? 'true' : 'false');
    await updateSetting('upi_id', settings.upi_id ?? '');
    await updateSetting('bank_details', settings.bank_details ?? '');
    await updateSetting('qr_code_url', settings.qr_code_url ?? '');
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <CreditCard size={20} className="text-primary-600" /> {t('paymentSettings')}
      </h3>

      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-dark-50 border border-dark-100">
          <div>
            <p className="text-sm font-medium text-dark-800 flex items-center gap-2">
              <Smartphone size={16} className="text-primary-600" /> {t('onlinePaymentUpi')}
            </p>
            <p className="text-xs text-dark-400 mt-0.5">{t('enableOnlineHint')}</p>
          </div>
          <button
            onClick={() => setSettings({ ...settings, online_payment_enabled: onlineEnabled ? 'false' : 'true' })}
            className="flex items-center gap-1.5"
          >
            {onlineEnabled ? (
              <><ToggleRight size={32} className="text-success-500" /><span className="text-xs font-medium text-success-600">{t('enabled')}</span></>
            ) : (
              <><ToggleLeft size={32} className="text-dark-400" /><span className="text-xs font-medium text-dark-500">{t('disabled')}</span></>
            )}
          </button>
        </div>

        {onlineEnabled && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">{t('upiIdLabel')}</label>
              <input
                value={settings.upi_id ?? ''}
                onChange={(e) => setSettings({ ...settings, upi_id: e.target.value })}
                placeholder="e.g. ampalace@okbank"
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">{t('qrCodeUrl')}</label>
              <input
                value={settings.qr_code_url ?? ''}
                onChange={(e) => setSettings({ ...settings, qr_code_url: e.target.value })}
                placeholder="https://example.com/qr-code.png"
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
              />
              <p className="text-xs text-dark-400 mt-1">{t('qrCodeHint')}</p>
              {settings.qr_code_url && (
                <div className="mt-2 flex justify-center">
                  <img src={settings.qr_code_url} alt="QR Code Preview" className="w-32 h-32 rounded-xl object-contain bg-white p-2 border border-dark-100" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-dark-700 mb-1">{t('bankDetailsOptional')}</label>
              <textarea
                value={settings.bank_details ?? ''}
                onChange={(e) => setSettings({ ...settings, bank_details: e.target.value })}
                rows={3}
                placeholder={'Bank Name\nAccount Number\nIFSC Code'}
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
              />
            </div>
          </div>
        )}

        {!onlineEnabled && (
          <div className="p-3 rounded-xl bg-warning-50 border border-warning-200">
            <p className="text-xs text-warning-700 flex items-center gap-1.5">
              <Banknote size={14} /> {t('onlineDisabledNotice')}
            </p>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('savePaymentSettings')}
        </button>
      </div>
    </div>
  );
}

function OffersTab() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [discount, setDiscount] = useState(0);
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
      setOffers((data ?? []) as Offer[]);
    })();
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) return;
    await supabase.from('offers').insert({
      title: title.trim(),
      description: desc.trim() || null,
      image_url: imgUrl.trim() || null,
      discount_percent: discount,
      is_active: true,
    });
    setShowForm(false);
    setTitle(''); setDesc(''); setImgUrl(''); setDiscount(0);
    const { data } = await supabase.from('offers').select('*').order('created_at', { ascending: false });
    setOffers((data ?? []) as Offer[]);
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from('offers').update({ is_active: !active }).eq('id', id);
    setOffers((prev) => prev.map((o) => o.id === id ? { ...o, is_active: !active } : o));
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('deleteOfferConfirm'))) return;
    await supabase.from('offers').delete().eq('id', id);
    setOffers((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-dark-900">{t('offersPromotions')}</h3>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-900 text-white text-sm font-medium hover:bg-dark-800">
          <Plus size={16} /> {t('addOffer')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('offerTitle')} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('description')} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
          <input value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} placeholder={t('imageUrl')} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
          <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder={t('discountPercent')} className="w-full px-3 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500" />
          <button onClick={handleAdd} className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium text-sm hover:bg-primary-600">{t('createOffer')}</button>
        </div>
      )}

      <div className="space-y-2">
        {offers.map((o) => (
          <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-dark-100">
            {o.image_url && <img src={o.image_url} alt={o.title} className="w-14 h-14 rounded-lg object-cover" />}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-dark-900 text-sm">{o.title}</p>
              <p className="text-xs text-dark-400">{o.description} · {o.discount_percent}% off</p>
            </div>
            <button onClick={() => toggleActive(o.id, o.is_active)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${o.is_active ? 'bg-success-100 text-success-600' : 'bg-dark-100 text-dark-500'}`}>
              {o.is_active ? t('active') : t('inactive')}
            </button>
            <button onClick={() => handleDelete(o.id)} className="p-2 rounded-lg hover:bg-error-50">
              <Trash2 size={16} className="text-error-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function BrandingTab() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [appName, setAppName] = useState('');
  const [appLogo, setAppLogo] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLang();

  useEffect(() => {
    fetchSettings().then((s) => {
      setSettings(s);
      setAppName(s.app_name || 'AM Palace');
      setAppLogo(s.app_logo || '');
    });
  }, []);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `app-logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      setAppLogo(urlData.publicUrl);
    } catch {
      setAppLogo(URL.createObjectURL(file));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await updateSetting('app_name', appName);
    await updateSetting('app_logo', appLogo);
    setSettings({ ...settings, app_name: appName, app_logo: appLogo });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <Palette size={20} className="text-primary-600" /> Branding Settings
      </h3>

      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl border border-primary-200 p-6">
        <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-3">Live Preview</p>
        <div className="bg-white rounded-xl p-4 inline-flex items-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center overflow-hidden shrink-0">
            {appLogo ? (
              <img src={appLogo} alt={appName} className="w-full h-full object-cover" />
            ) : (
              <Flame size={22} className="text-white" />
            )}
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-display font-extrabold text-xl text-dark-900">{appName || 'AM Palace'}</span>
            <span className="text-[10px] font-medium text-primary-600 tracking-wider uppercase">Fast Food Delivery</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <label className="block text-sm font-medium text-dark-700">App Name</label>
        <p className="text-xs text-dark-400">This name appears in the header, footer, and throughout the customer app.</p>
        <input
          value={appName}
          onChange={(e) => setAppName(e.target.value)}
          placeholder="AM Palace"
          className="w-full px-4 py-3 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
        />
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-3">
        <label className="block text-sm font-medium text-dark-700">App Logo</label>
        <p className="text-xs text-dark-400">Upload a square image (recommended 256x256px). Leave empty to use the default flame icon.</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center overflow-hidden shrink-0">
            {appLogo ? (
              <img src={appLogo} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Flame size={32} className="text-white" />
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-900 text-white text-sm font-medium hover:bg-dark-800 disabled:opacity-60"
            >
              <Upload size={16} /> {uploading ? 'Uploading...' : 'Upload Logo'}
            </button>
            {appLogo && (
              <button
                onClick={() => setAppLogo('')}
                className="text-xs text-error-600 hover:text-error-700 font-medium"
              >
                Remove logo (use default)
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('saveSettings')}
        </button>
        {saved && (
          <span className="text-sm font-medium text-success-600">Saved! Changes are now live across the app.</span>
        )}
      </div>
    </div>
  );
}

function LoyaltyTab() {
  const [rewardName, setRewardName] = useState('');
  const [rewardImage, setRewardImage] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    fetchSettings().then((s) => {
      setRewardName(s.loyalty_reward_name || 'Free Meal');
      setRewardImage(s.loyalty_reward_image || '');
      setRewardDescription(s.loyalty_reward_description || '');
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await updateSetting('loyalty_reward_name', rewardName.trim() || 'Free Meal');
    await updateSetting('loyalty_reward_image', rewardImage.trim());
    await updateSetting('loyalty_reward_description', rewardDescription.trim());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <h3 className="font-display font-semibold text-lg text-dark-900 flex items-center gap-2">
        <Gift size={20} className="text-primary-600" /> Loyalty Reward Settings
      </h3>

      <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-2xl border border-primary-200 p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0 overflow-hidden">
            {rewardImage ? (
              <img src={rewardImage} alt={rewardName} className="w-full h-full object-cover" />
            ) : (
              <Trophy size={24} className="text-white" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary-600 mb-1">Current Reward</p>
            <p className="text-lg font-display font-bold text-dark-900">
              {rewardName || 'Free Meal'}
            </p>
            {rewardDescription && (
              <p className="text-xs text-dark-500 mt-0.5">{rewardDescription}</p>
            )}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                i < 7
                  ? 'bg-gradient-to-br from-secondary-400 to-secondary-600 text-white'
                  : 'bg-dark-100 text-dark-400'
              }`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        <p className="text-xs text-dark-500 mt-3">
          When a customer fills all 7 boxes, this reward appears on their loyalty card.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-dark-100 p-5 space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-700">Reward Title</label>
          <p className="text-xs text-dark-400">
            Set what customers earn when their loyalty box is full. Examples: "Free Drink", "10% Off", "Free Dessert".
          </p>
          <input
            value={rewardName}
            onChange={(e) => setRewardName(e.target.value)}
            placeholder="e.g. Free Drink, 10% Off, Free Dessert"
            className="w-full px-4 py-3 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-700">Reward Image URL</label>
          <p className="text-xs text-dark-400">
            Add a photo of the reward item. Shown on the customer's loyalty card when unlocked.
          </p>
          <input
            value={rewardImage}
            onChange={(e) => setRewardImage(e.target.value)}
            placeholder="https://example.com/free-drink.jpg"
            className="w-full px-4 py-3 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500"
          />
          {rewardImage && (
            <div className="mt-2 flex justify-center">
              <img src={rewardImage} alt="Reward preview" className="w-24 h-24 rounded-xl object-cover border border-dark-100" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-700">Reward Description</label>
          <p className="text-xs text-dark-400">
            A short description shown beneath the reward name on the loyalty card.
          </p>
          <textarea
            value={rewardDescription}
            onChange={(e) => setRewardDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Enjoy a complimentary drink on your next visit!"
            className="w-full px-4 py-3 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 resize-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 disabled:opacity-60"
        >
          <Save size={16} /> {saving ? t('saving') : t('saveSettings')}
        </button>
        {saved && (
          <span className="text-sm font-medium text-success-600">Saved! Reward name is now live on customer loyalty cards.</span>
        )}
      </div>
    </div>
  );
}
