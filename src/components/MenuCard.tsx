import { Plus, Flame } from 'lucide-react';
import type { MenuItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatINR } from '@/lib/format';

interface MenuCardProps {
  item: MenuItem;
}

export function MenuCard({ item }: MenuCardProps) {
  const { addToCart } = useCart();
  const unavailable = !item.is_available;

  return (
    <div
      className={`group bg-white rounded-2xl overflow-hidden border border-dark-100 hover:border-dark-200 hover:shadow-xl transition-all duration-300 ${
        unavailable ? 'opacity-75' : ''
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-dark-100">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
              unavailable ? 'grayscale brightness-[0.5] contrast-75' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Flame size={40} className="text-dark-300" />
          </div>
        )}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-lg bg-dark-900/80 text-white text-sm font-semibold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      <div className={`p-4 ${unavailable ? 'grayscale' : ''}`}>
        <h3 className={`font-display font-semibold text-lg mb-1 ${unavailable ? 'text-dark-400' : 'text-dark-900'}`}>
          {item.name}
        </h3>
        {item.description && (
          <p className={`text-sm mb-3 line-clamp-2 ${unavailable ? 'text-dark-300' : 'text-dark-500'}`}>
            {item.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {item.has_half && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${unavailable ? 'bg-dark-50 text-dark-300' : 'bg-dark-100 text-dark-700'}`}>
              Half {formatINR(item.half_price)}
            </span>
          )}
          {item.has_full && (
            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${unavailable ? 'bg-dark-50 text-dark-300' : 'bg-primary-50 text-primary-700'}`}>
              Full {formatINR(item.full_price)}
            </span>
          )}
        </div>

        {unavailable ? (
          <div className="w-full py-2.5 rounded-xl bg-dark-100 text-dark-400 text-sm font-medium text-center">
            Currently Unavailable
          </div>
        ) : (
          <div className="flex gap-2">
            {item.has_half && (
              <button
                onClick={() => addToCart(item, 'half')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-dark-100 hover:bg-dark-200 text-dark-800 text-sm font-medium transition-colors"
              >
                <Plus size={15} /> Half
              </button>
            )}
            {item.has_full && (
              <button
                onClick={() => addToCart(item, 'full')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 hover:shadow-lg hover:shadow-primary-500/30 text-white text-sm font-medium transition-all"
              >
                <Plus size={15} /> Full
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
