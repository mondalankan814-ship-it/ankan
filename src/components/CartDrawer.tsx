import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useLang } from '@/context/LanguageContext';
import { formatINR } from '@/lib/format';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartDrawer({ open, onClose, onCheckout }: CartDrawerProps) {
  const { items, updateQuantity, removeFromCart, subtotal, totalItems, clearCart } = useCart();
  const { t } = useLang();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col animate-slide-in-right shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-primary-600" />
            <h2 className="text-lg font-display font-bold text-dark-900">
              {t('yourCart')} {totalItems > 0 && `(${totalItems})`}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100">
            <X size={20} className="text-dark-500" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-dark-100 flex items-center justify-center mb-4">
              <ShoppingBag size={32} className="text-dark-300" />
            </div>
            <p className="text-dark-500 font-medium mb-1">{t('cartEmpty')}</p>
            <p className="text-sm text-dark-400">{t('addItemsToCart')}</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map((ci, idx) => (
                <div
                  key={`${ci.id}-${ci.portion}-${idx}`}
                  className="flex items-center gap-3 p-3 rounded-xl border border-dark-100 hover:border-dark-200"
                >
                  {ci.image_url && (
                    <img
                      src={ci.image_url}
                      alt={ci.name}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-dark-900 text-sm truncate">{ci.name}</p>
                    <p className="text-xs text-dark-500 capitalize">{ci.portion} · {formatINR(ci.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(ci.id, ci.portion, -1)}
                      className="w-7 h-7 rounded-lg bg-dark-100 hover:bg-dark-200 flex items-center justify-center"
                    >
                      <Minus size={14} className="text-dark-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold text-dark-900">{ci.quantity}</span>
                    <button
                      onClick={() => updateQuantity(ci.id, ci.portion, 1)}
                      className="w-7 h-7 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center"
                    >
                      <Plus size={14} className="text-primary-600" />
                    </button>
                    <button
                      onClick={() => removeFromCart(ci.id, ci.portion)}
                      className="w-7 h-7 rounded-lg hover:bg-error-50 flex items-center justify-center"
                    >
                      <Trash2 size={14} className="text-error-500" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={clearCart}
                className="w-full py-2 text-sm text-error-600 font-medium hover:bg-error-50 rounded-lg"
              >
                Clear Cart
              </button>
            </div>

            <div className="p-5 border-t border-dark-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-dark-600">{t('subtotal')}</span>
                <span className="font-display font-bold text-xl text-dark-900">{formatINR(subtotal)}</span>
              </div>
              <button
                onClick={onCheckout}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all"
              >
                {t('checkout')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
