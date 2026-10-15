import { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Package, CheckCircle2, Navigation, MessageSquare, Bike, Store, Timer, ImageIcon, XCircle, CheckCircle, Phone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatINR, formatDate } from '@/lib/format';
import { fetchSettings } from '@/lib/data';
import { useLang } from '@/context/LanguageContext';
import { CancelOrderModal } from '@/components/CancelOrderModal';
import type { Order, CartItem } from '@/types';

interface TrackPageProps {
  onGiveFeedback: (order: Order) => void;
}

export function TrackPage({ onGiveFeedback }: TrackPageProps) {
  const { t } = useLang();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [demoProgress, setDemoProgress] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<Order | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [helpline, setHelpline] = useState('');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    loadOrders();
    fetchSettings().then((s) => setHelpline(s.helpline_number ?? ''));
    const interval = setInterval(loadOrders, 10000);

    // Realtime subscription for instant status updates
    const channel = supabase
      .channel('orders-track-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Order;
          setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        } else if (payload.eventType === 'INSERT') {
          const inserted = payload.new as Order;
          setOrders((prev) => [inserted, ...prev].slice(0, 20));
        }
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  const handleCancelOrder = async (reason: string | null) => {
    if (!cancelTarget) return;
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', cancellation_reason: reason })
      .eq('id', cancelTarget.id);
    if (error) throw error;

    // Remove the loyalty reward box entry for this order so reward images
    // only reflect active, non-cancelled orders. Also decrement loyalty_count.
    await supabase.from('loyalty_progress').delete().eq('order_id', cancelTarget.id);

    if (cancelTarget.profile_id) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('loyalty_count')
        .eq('id', cancelTarget.profile_id)
        .maybeSingle();
      if (prof) {
        const newCount = Math.max(0, prof.loyalty_count - 1);
        await supabase
          .from('profiles')
          .update({ loyalty_count: newCount, reward_unlocked: newCount >= 7 })
          .eq('id', cancelTarget.profile_id);
      }
    }

    // Send WhatsApp cancellation notification to the store
    const settingsMap = await fetchSettings();
    const ownerWhatsapp = settingsMap.owner_whatsapp_number || '';
    if (ownerWhatsapp) {
      const cleanNumber = ownerWhatsapp.replace(/[^0-9]/g, '');
      const itemsList = cancelTarget.items.map(i => `  - ${i.quantity}x ${i.name} (${i.portion}) = ${formatINR(i.price * i.quantity)}`).join('\n');
      const orderDate = new Date(cancelTarget.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
      const cancelMsg = `*ORDER CANCELLED - ${settingsMap.app_name || 'AM Palace'}*\n\n*Customer:* ${cancelTarget.customer_name}\n*Phone:* ${cancelTarget.customer_phone || 'N/A'}\n*Date/Time:* ${orderDate}\n*Reason:* ${reason || 'Not specified'}\n\n*Cancelled Items:*\n${itemsList}\n\n*Total:* ${formatINR(cancelTarget.total)}\n*Payment:* ${cancelTarget.payment_method === 'cod' ? 'Cash on Delivery' : 'Online (UPI)'}`;
      const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(cancelMsg)}`;
      window.open(url, '_blank');
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'cancelled', cancellation_reason: reason } : o)),
    );
    showToast(t('orderCancelled'));
    setCancelTarget(null);
  };

  const selectedOrder = orders.find((o) => o.id === selectedId) ?? orders[0] ?? null;

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDemoProgress(0);

    if (selectedOrder && selectedOrder.status === 'out_for_delivery') {
      intervalRef.current = setInterval(() => {
        setDemoProgress((prev) => {
          if (prev >= 100) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 100;
          }
          return prev + 2;
        });
      }, 800);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedOrder?.id, selectedOrder?.status]);

  const statusSteps = [
    { key: 'pending', label: t('statusOrderPlaced'), icon: Package },
    { key: 'preparing', label: t('statusPreparing'), icon: Clock },
    { key: 'out_for_delivery', label: t('statusOutForDelivery'), icon: Navigation },
    { key: 'delivered', label: t('statusDelivered'), icon: CheckCircle2 },
  ];

  const currentStep = selectedOrder
    ? statusSteps.findIndex((s) => s.key === selectedOrder.status)
    : -1;

  const etaMinutes = (() => {
    if (!selectedOrder) return 0;
    if (selectedOrder.status === 'delivered') return 0;
    if (selectedOrder.status === 'pending') return 35;
    if (selectedOrder.status === 'preparing') return 25;
    if (selectedOrder.status === 'out_for_delivery') {
      const remaining = 100 - demoProgress;
      return Math.max(1, Math.round((remaining / 100) * 15));
    }
    return 30;
  })();

  const isDeliveryOrder = selectedOrder?.order_type !== 'pickup';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-display font-bold text-dark-900 mb-6">{t('trackYourOrders')}</h1>

      {loading ? (
        <div className="text-center py-16 text-dark-400">{t('loading')}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={48} className="text-dark-300 mx-auto mb-3" />
          <p className="text-dark-500 font-medium">{t('noOrders')}</p>
          <p className="text-sm text-dark-400 mt-1">{t('placeOrderToTrack')}</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedId(order.id)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  selectedOrder?.id === order.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-dark-100 bg-white hover:border-dark-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-dark-900 text-sm">{order.customer_name}</span>
                  <span className="text-xs font-medium text-primary-600">{formatINR(order.total)}</span>
                </div>
                <p className="text-xs text-dark-400">{formatDate(order.created_at)}</p>
                <div className="mt-2 flex items-center gap-2">
                  <StatusBadge status={order.status} />
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${order.order_type === 'pickup' ? 'bg-secondary-100 text-secondary-700' : 'bg-primary-100 text-primary-700'}`}>
                    {order.order_type === 'pickup' ? t('pickup') : t('homeDelivery')}
                  </span>
                  <span className="text-[10px] text-dark-400">
                    {order.items.length} {t('items')}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selectedOrder && (
            <div className="lg:col-span-2 bg-white rounded-2xl border border-dark-100 p-6">
              <div className="mb-5">
                <h2 className="font-display font-bold text-lg text-dark-900 mb-1">{t('orderDetails')}</h2>
                <p className="text-sm text-dark-400">{formatDate(selectedOrder.created_at)}</p>
              </div>

              {/* ETA Banner */}
              {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                <div className="mb-5 p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shrink-0">
                    <Timer size={24} className="text-white" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-dark-900 text-lg">
                      {t('eta', { min: etaMinutes })}
                    </p>
                    <p className="text-xs text-dark-500">
                      {isDeliveryOrder
                        ? t('deliveryInfo', { radius: selectedOrder.delivery_distance_km != null ? selectedOrder.delivery_distance_km.toFixed(1) : '' })
                        : t('pickupSuccess')}
                    </p>
                  </div>
                </div>
              )}

              {/* Demo Tracking Path */}
              {isDeliveryOrder && selectedOrder.status === 'out_for_delivery' && (
                <div className="mb-6 p-4 rounded-xl bg-dark-50 border border-dark-100">
                  <p className="text-sm font-medium text-dark-700 mb-3 flex items-center gap-2">
                    <Bike size={16} className="text-primary-600" /> {t('liveDeliveryTracking')}
                  </p>
                  <div className="relative h-12 rounded-full bg-dark-100 overflow-hidden">
                    <div className="absolute top-1/2 left-3 right-3 h-1 -translate-y-1/2 bg-dark-200 rounded-full" />
                    <div
                      className="absolute top-1/2 left-3 h-1 -translate-y-1/2 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full transition-all duration-700"
                      style={{ width: `calc(${demoProgress}% * 0.85)` }}
                    />
                    <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10">
                      <div className="w-7 h-7 rounded-full bg-dark-900 flex items-center justify-center">
                        <Store size={14} className="text-white" />
                      </div>
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 z-10 transition-all duration-700"
                      style={{ left: `calc(${demoProgress}% * 0.8 + 8px)` }}
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg">
                        <Bike size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="absolute top-1/2 right-2 -translate-y-1/2 z-10">
                      <div className="w-7 h-7 rounded-full bg-success-500 flex items-center justify-center">
                        <MapPin size={14} className="text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-dark-400">{t('restaurant')}</span>
                    <span className="text-xs font-medium text-primary-600">{demoProgress}%</span>
                    <span className="text-xs text-dark-400">{t('yourLocation')}</span>
                  </div>
                </div>
              )}

              {/* Progress Steps */}
              <div className="space-y-3 mb-6">
                {statusSteps.map((step, idx) => {
                  const Icon = step.icon;
                  const isDone = idx <= currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={step.key} className="flex items-center gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isDone
                              ? 'bg-gradient-to-br from-primary-500 to-accent-600 text-white'
                              : 'bg-dark-100 text-dark-400'
                          } ${isCurrent ? 'ring-4 ring-primary-200' : ''}`}
                        >
                          <Icon size={18} />
                        </div>
                        {idx < statusSteps.length - 1 && (
                          <div className={`w-0.5 h-6 ${idx < currentStep ? 'bg-primary-500' : 'bg-dark-200'}`} />
                        )}
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${isDone ? 'text-dark-900' : 'text-dark-400'}`}>
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Multi-Item Cards with Pictures */}
              <div className="mb-6">
                <p className="text-sm font-medium text-dark-700 mb-3">{t('items')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedOrder.items.map((item: CartItem, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 border border-dark-100">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-dark-100 shrink-0">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-dark-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-dark-900 truncate">{item.name}</p>
                        <p className="text-xs text-dark-400">
                          {item.quantity}× {item.portion} · {formatINR(item.price)}
                        </p>
                      </div>
                      <p className="font-semibold text-sm text-dark-900 shrink-0">
                        {formatINR(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between pt-3 mt-2 border-t border-dark-100">
                  <span className="font-display font-bold text-dark-900">{t('total')}</span>
                  <div className="text-right">
                    {selectedOrder.status === 'cancelled' ? (
                      <>
                        <span className="font-display font-bold text-dark-400 line-through">{formatINR(selectedOrder.total)}</span>
                        <p className="text-[10px] text-error-500 font-medium">Refunded · Excluded from totals</p>
                      </>
                    ) : (
                      <span className="font-display font-bold text-primary-600">{formatINR(selectedOrder.total)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Location */}
              {selectedOrder.delivery_lat && selectedOrder.delivery_lng && (
                <div className="mb-6 p-4 rounded-xl bg-primary-50 border border-primary-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-primary-600" />
                    <span className="text-sm font-medium text-dark-800">{t('liveLocation')}</span>
                    {selectedOrder.delivery_distance_km != null && (
                      <span className="text-xs text-dark-500">
                        ({t('kmAway', { km: selectedOrder.delivery_distance_km.toFixed(1) })})
                      </span>
                    )}
                  </div>
                  {selectedOrder.delivery_address && (
                    <p className="text-xs text-dark-600 mb-2">{selectedOrder.delivery_address}</p>
                  )}
                  <p className="text-xs text-dark-500 mb-2">
                    {selectedOrder.delivery_lat.toFixed(4)}, {selectedOrder.delivery_lng.toFixed(4)}
                  </p>
                  <a
                    href={`https://www.google.com/maps?q=${selectedOrder.delivery_lat},${selectedOrder.delivery_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Navigation size={12} /> {t('openInMaps')}
                  </a>
                </div>
              )}

              {/* Cancelled Order Banner */}
              {selectedOrder.status === 'cancelled' && (
                <div className="mb-6 p-5 rounded-xl bg-error-50 border border-error-200 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-error-100 flex items-center justify-center shrink-0">
                    <XCircle size={24} className="text-error-600" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-error-700 text-base">{t('orderCancelledMsg')}</p>
                    {selectedOrder.cancellation_reason && (
                      <p className="text-xs text-error-500 mt-0.5">{selectedOrder.cancellation_reason}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.status === 'delivered' && (
                <button
                  onClick={() => onGiveFeedback(selectedOrder)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-900 text-white font-medium text-sm hover:bg-dark-800 transition-colors"
                >
                  <MessageSquare size={16} /> {t('giveFeedback')}
                </button>
              )}

              {/* Cancel Order Button — only for pending/preparing */}
              {(selectedOrder.status === 'pending' || selectedOrder.status === 'preparing') && (
                <button
                  onClick={() => setCancelTarget(selectedOrder)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-error-200 bg-error-50 text-error-700 font-semibold text-sm hover:bg-error-100 hover:border-error-300 transition-all mt-3"
                >
                  <XCircle size={18} /> {t('cancelOrder')}
                </button>
              )}

              {/* Helpline Call Button */}
              {helpline && (
                <a
                  href={`tel:${helpline}`}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 font-medium text-sm hover:bg-primary-100 transition-all mt-3"
                >
                  <Phone size={16} /> Need help? Call {helpline}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <CancelOrderModal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancelOrder}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-fade-in-up">
          <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-dark-900 text-white shadow-2xl">
            <CheckCircle size={18} className="text-success-400 shrink-0" />
            <span className="text-sm font-medium">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const styles: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-600',
    preparing: 'bg-primary-100 text-primary-700',
    out_for_delivery: 'bg-secondary-100 text-secondary-700',
    delivered: 'bg-success-100 text-success-600',
    cancelled: 'bg-error-100 text-error-600',
  };
  const labels: Record<string, string> = {
    pending: t('statusPending'),
    preparing: t('statusPreparing'),
    out_for_delivery: t('statusOnTheWay'),
    delivered: t('statusDelivered'),
    cancelled: t('statusCancelled'),
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
}
