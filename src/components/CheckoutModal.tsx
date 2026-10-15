import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, Truck, Store, Banknote, Smartphone, QrCode, Clock, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useUser } from '@/context/UserContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { formatINR } from '@/lib/format';
import { speakWarm } from '@/lib/voice';
import { CelebrationOverlay } from '@/components/CelebrationOverlay';
import type { Gender, Order } from '@/types';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
  settings: Record<string, string>;
  onOrderPlaced: (order: Order) => void;
}

type OrderType = 'delivery' | 'pickup';
type PaymentMethod = 'cod' | 'online';

function calcDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function CheckoutModal({ open, onClose, settings, onOrderPlaced }: CheckoutModalProps) {
  const { items, subtotal, clearCart } = useCart();
  const { profile } = useUser();
  const { t } = useLang();
  const [name, setName] = useState(profile?.name ?? '');
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'male');
  const [orderType, setOrderType] = useState<OrderType>('delivery');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');

  useEffect(() => {
    if (!success || !placedOrder) return;
    const timer = setTimeout(() => {
      setSuccess(false);
      onOrderPlaced(placedOrder);
    }, 6000);
    return () => clearTimeout(timer);
  }, [success, placedOrder, onOrderPlaced]);

  if (!open) return null;

  const onlinePaymentEnabled = settings.online_payment_enabled === 'true';
  const upiId = settings.upi_id || '';
  const qrCodeUrl = settings.qr_code_url || '';
  const storeOpenTime = settings.store_open_time || '17:00';
  const storeCloseTime = settings.store_close_time || '22:00';
  const storeClosed = settings.store_closed === 'true';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = storeOpenTime.split(':').map(Number);
  const [closeH, closeM] = storeCloseTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const isStoreOpen = !storeClosed && currentMinutes >= openMinutes && currentMinutes < closeMinutes;

  const radiusKm = parseFloat(settings.delivery_radius_km || '5');
  const baseCharge = parseFloat(settings.delivery_charge_base || '20');
  const perKmCharge = parseFloat(settings.delivery_charge_per_km || '5');
  const minOrder = parseFloat(settings.min_order_amount || '50');

  const isDelivery = orderType === 'delivery';
  const deliveryBlocked = isDelivery && !isStoreOpen;

  const calcDeliveryCharge = (dist: number | null): number => {
    if (!isDelivery) return 0;
    if (dist == null) return baseCharge;
    for (let i = 1; i <= 3; i++) {
      const maxKm = parseFloat(settings[`delivery_slab_${i}_max_km`] || '');
      const charge = parseFloat(settings[`delivery_slab_${i}_charge`] || '');
      if (!isNaN(maxKm) && !isNaN(charge) && maxKm > 0) {
        if (dist <= maxKm) return charge;
      }
    }
    return baseCharge + dist * perKmCharge;
  };

  const deliveryCharge = calcDeliveryCharge(distance);
  const total = subtotal + deliveryCharge;

  const restLat = parseFloat(settings.restaurant_lat || '23.3118');
  const restLng = parseFloat(settings.restaurant_lng || '88.5338');

  const applyLocation = (userLat: number, userLng: number) => {
    setLat(userLat);
    setLng(userLng);
    const dist = calcDistance(restLat, restLng, userLat, userLng);
    setDistance(dist);
    if (dist > radiusKm) {
      setError(t('locationTooFar', { dist: dist.toFixed(1), radius: radiusKm }));
    } else {
      setError('');
    }
  };

  const captureLocation = () => {
    setLocating(true);
    setError('');
    if (!navigator.geolocation) {
      setError(t('locationNotSupported'));
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        applyLocation(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
      },
      () => {
        setError(t('locationCaptureFailed'));
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const handlePlaceOrder = async () => {
    setError('');
    if (!name.trim()) {
      setError(t('errNamePhone'));
      return;
    }
    if (isDelivery && !address.trim()) {
      setError(t('errAddress'));
      return;
    }
    if (isDelivery && (lat == null || lng == null)) {
      setError(t('locationRequired'));
      return;
    }
    if (subtotal < minOrder) {
      setError(t('errMinOrder', { amount: formatINR(minOrder) }));
      return;
    }
    if (isDelivery && distance != null && distance > radiusKm) {
      setError(t('locationTooFar', { dist: distance.toFixed(1), radius: radiusKm }));
      return;
    }
    if (deliveryBlocked) {
      setError(t('errDeliveryHours', { open: storeOpenTime, close: storeCloseTime }));
      return;
    }
    if (paymentMethod === 'online' && !onlinePaymentEnabled) {
      setError(t('errOnlineUnavailable'));
      return;
    }

    setPlacing(true);
    try {
      const orderData = {
        profile_id: profile?.id ?? null,
        customer_name: name.trim(),
        customer_phone: profile?.phone ?? null,
        customer_gender: gender,
        items: JSON.parse(JSON.stringify(items)),
        subtotal,
        delivery_charge: deliveryCharge,
        total,
        status: 'pending' as const,
        order_type: orderType,
        payment_method: paymentMethod,
        delivery_address: isDelivery ? address.trim() : null,
        delivery_lat: isDelivery ? lat : null,
        delivery_lng: isDelivery ? lng : null,
        delivery_distance_km: isDelivery ? distance : null,
      };

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      if (insertError) throw insertError;

      const order = data as Order;

      const vLang = (settings.voice_language === 'bn' ? 'bn' : settings.voice_language === 'hi' ? 'hi' : 'en') as 'en' | 'bn' | 'hi';
      const prefix = gender === 'male'
        ? settings[`greeting_prefix_male_${vLang}`] || 'Sir'
        : gender === 'female'
          ? settings[`greeting_prefix_female_${vLang}`] || 'Maam'
          : '';
      const thankYouMsg = prefix
        ? `Thank you so much ${name} ${prefix}. Your order has been placed successfully. We are preparing your food with love. Your total is ${formatINR(total)}.`
        : `Thank you so much ${name}. Your order has been placed successfully. We are preparing your food with love. Your total is ${formatINR(total)}.`;
      speakWarm(thankYouMsg, vLang);

      if (profile) {
        await supabase.from('loyalty_progress').insert({
          profile_id: profile.id,
          order_id: order.id,
          item_image: items[0]?.image_url ?? null,
          item_name: items[0]?.name ?? null,
          item_images: items.map((i) => i.image_url).filter(Boolean) as string[],
          item_names: items.map((i) => i.name),
          box_number: (profile.loyalty_count % 7) + 1,
        });

        const newCount = profile.loyalty_count + 1;
        const unlocked = newCount >= 7;
        await supabase
          .from('profiles')
          .update({ loyalty_count: newCount, reward_unlocked: unlocked })
          .eq('id', profile.id);

        if (unlocked) {
          setTimeout(() => speakWarm(`Congratulations ${name} ${prefix}! You have unlocked a special loyalty reward!`, vLang), 3000);
        }

        for (const item of items) {
          await supabase.from('reminders').insert({
            profile_id: profile.id,
            phone: profile.phone,
            item_name: item.name,
            item_image: item.image_url,
            order_time: new Date().toISOString(),
            reminder_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            message: (settings.reorder_sms_template || '').replace('{name}', name).replace('{item}', item.name),
          });
        }
      }

      await supabase.from('notifications').insert({
        type: 'order',
        title: `New Order from ${name}`,
        body: `${items.length} item(s) · Total ${formatINR(total)} · ${orderType === 'pickup' ? 'Pickup' : (address || '').substring(0, 50)}`,
      });

      setSuccess(true);
      setPlacedOrder(order);
      clearCart();
    } catch {
      setError(t('errOrderFailed'));
    } finally {
      setPlacing(false);
    }
  };

  if (success && placedOrder) {
    return (
      <CelebrationOverlay
        total={total}
        isDelivery={isDelivery}
        deliveryText={t('deliverySuccess')}
        whatsappText={t('orderSentToWhatsapp')}
        onViewStatus={() => {
          setSuccess(false);
          onOrderPlaced(placedOrder);
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in-up flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="flex items-center justify-between p-5 border-b border-dark-100 bg-white rounded-t-2xl shrink-0">
          <h2 className="text-xl font-display font-bold text-dark-900">{t('checkoutTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100">
            <X size={20} className="text-dark-500" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Order Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">{t('orderType')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('delivery')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  orderType === 'delivery'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-dark-200 text-dark-600 hover:border-dark-300'
                }`}
              >
                <Truck size={18} /> {t('homeDelivery')}
              </button>
              <button
                type="button"
                onClick={() => { setOrderType('pickup'); setError(''); setDistance(null); }}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  orderType === 'pickup'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-dark-200 text-dark-600 hover:border-dark-300'
                }`}
              >
                <Store size={18} /> {t('dineInPickup')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1">{t('name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-dark-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">{t('gender')}</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  gender === 'male' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'
                }`}
              >
                {t('male')}
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  gender === 'female' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'
                }`}
              >
                {t('female')}
              </button>
              <button
                type="button"
                onClick={() => setGender('other')}
                className={`py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                  gender === 'other' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600'
                }`}
              >
                Other
              </button>
            </div>
          </div>

          {isDelivery && (
            <>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-primary-50 border border-primary-100">
                <MapPin size={16} className="text-primary-600 shrink-0 mt-0.5" />
                <p className="text-xs text-dark-600">
                  {t('deliveryInfo', { radius: radiusKm })}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1">{t('deliveryAddress')}</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  placeholder={t('addressPlaceholder')}
                  className="w-full px-3 py-2.5 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-dark-900 text-sm resize-none"
                />
              </div>

              <button
                onClick={captureLocation}
                disabled={locating}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-dark-100 hover:bg-dark-200 text-dark-800 font-medium text-sm transition-colors disabled:opacity-60"
              >
                {locating ? (
                  <><Loader2 size={18} className="animate-spin" /> {t('detectingLocation')}</>
                ) : lat != null ? (
                  <><MapPin size={18} className="text-success-600" /> {t('locationCaptured')} {distance != null && `(${distance.toFixed(1)} km)`}</>
                ) : (
                  <><MapPin size={18} /> {t('captureLocation')}</>
                )}
              </button>

              {lat == null && (
                <p className="text-xs text-error-600 text-center flex items-center justify-center gap-1">
                  <AlertCircle size={12} /> {t('locationRequiredHint')}
                </p>
              )}
            </>
          )}

          {deliveryBlocked && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-error-50 border border-error-200">
              <Clock size={16} className="text-error-600 shrink-0 mt-0.5" />
              <p className="text-xs text-error-700">
                {t('storeClosedNotice', { open: storeOpenTime, close: storeCloseTime })}{storeClosed ? t('storeManuallyClosed') : ''}
              </p>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-dark-700 mb-2">{t('paymentMethod')}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-success-500 bg-success-50 text-success-700'
                    : 'border-dark-200 text-dark-600 hover:border-dark-300'
                }`}
              >
                <Banknote size={18} /> {t('cashOnDelivery')}
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('online')}
                disabled={!onlinePaymentEnabled}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  paymentMethod === 'online'
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : onlinePaymentEnabled
                      ? 'border-dark-200 text-dark-600 hover:border-dark-300'
                      : 'border-dark-200 text-dark-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <Smartphone size={18} /> {t('onlineUpi')}
              </button>
            </div>
            {!onlinePaymentEnabled && (
              <p className="text-xs text-dark-400 mt-2 flex items-center gap-1.5">
                <AlertCircle size={12} /> {t('onlineUnavailable')}
              </p>
            )}
            {paymentMethod === 'online' && onlinePaymentEnabled && (
              <div className="mt-3 p-4 rounded-xl bg-dark-50 border border-dark-100 space-y-3">
                {qrCodeUrl && (
                  <div className="flex flex-col items-center">
                    <img src={qrCodeUrl} alt="Payment QR Code" className="w-40 h-40 rounded-xl object-contain bg-white p-2 border border-dark-100" />
                    <p className="text-xs text-dark-500 mt-2">{t('scanQr')}</p>
                  </div>
                )}
                {upiId && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-dark-100">
                    <span className="text-xs text-dark-500">{t('upiId')}</span>
                    <span className="text-sm font-medium text-dark-900 flex items-center gap-1.5">
                      <QrCode size={14} /> {upiId}
                    </span>
                  </div>
                )}
                {settings.bank_details && (
                  <div className="p-2.5 rounded-lg bg-white border border-dark-100">
                    <p className="text-xs text-dark-500 mb-1">{t('bankDetails')}</p>
                    <p className="text-sm text-dark-700 whitespace-pre-line">{settings.bank_details}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-error-50 border border-error-200 text-error-700 text-sm">
              {error}
            </div>
          )}

          <div className="rounded-xl bg-dark-50 border border-dark-100 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-600">{t('subtotal')} ({items.length})</span>
              <span className="font-medium text-dark-900">{formatINR(subtotal)}</span>
            </div>
            {isDelivery && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-600 flex items-center gap-1">
                  <Truck size={14} /> {t('deliveryCharge')}
                </span>
                <span className="font-medium text-dark-900">{formatINR(deliveryCharge)}</span>
              </div>
            )}
            {!isDelivery && (
              <div className="flex justify-between text-sm">
                <span className="text-dark-600 flex items-center gap-1">
                  <Store size={14} /> {t('pickup')}
                </span>
                <span className="font-medium text-success-600">{t('free')}</span>
              </div>
            )}
            <div className="border-t border-dark-200 pt-2 flex justify-between">
              <span className="font-display font-bold text-dark-900">{t('total')}</span>
              <span className="font-display font-bold text-xl text-primary-600">{formatINR(total)}</span>
            </div>
          </div>

          <button
            onClick={handlePlaceOrder}
            disabled={placing || items.length === 0 || (isDelivery && !address.trim()) || (isDelivery && lat == null) || deliveryBlocked}
            className={`w-full py-3.5 rounded-xl font-semibold shadow-lg transition-all ${
              (isDelivery && !address.trim())
                ? 'bg-dark-200 text-dark-400 shadow-none cursor-not-allowed border-2 border-error-200'
                : deliveryBlocked
                  ? 'bg-dark-200 text-dark-400 shadow-none cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-500 to-accent-600 text-white shadow-primary-500/30 hover:shadow-xl disabled:opacity-60'
            }`}
          >
            {placing ? t('placingOrder') : `${t('yourOrder')} · ${formatINR(total)}`}
          </button>
          {isDelivery && !address.trim() && (
            <p className="text-xs text-error-600 text-center flex items-center justify-center gap-1">
              <AlertCircle size={12} /> {t('enterAddressWarning')}
            </p>
          )}
          {isDelivery && address.trim() && lat == null && (
            <p className="text-xs text-error-600 text-center flex items-center justify-center gap-1">
              <AlertCircle size={12} /> {t('locationRequiredHint')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
