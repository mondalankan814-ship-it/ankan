import { useMemo } from 'react';
import { Star, Tag, Truck } from 'lucide-react';
import type { Offer } from '@/types';
import { useLang } from '@/context/LanguageContext';

interface HeroProps {
  onOrderNow: () => void;
  offers: Offer[];
}

export function Hero({ onOrderNow, offers }: HeroProps) {
  const activeOffer = useMemo(() => offers[0], [offers]);
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden bg-dark-900">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'url(https://images.pexels.com/photos/5531102/pexels-photo-5531102.jpeg?auto=compress&cs=tinysrgb&h=900&w=1600)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-dark-950/95 via-dark-900/80 to-dark-900/40" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/20 border border-primary-400/30 mb-4">
            <Star size={14} className="text-secondary-400 fill-secondary-400" />
            <span className="text-xs font-medium text-secondary-300">{t('premiumQuality')}</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-4">
            {t('cravingTitle')}
            <span className="block bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              {t('cravingHighlight')}
            </span>
          </h1>

          <p className="text-lg text-dark-300 mb-8 max-w-md">
            {t('heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onOrderNow}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
            >
              {t('orderNow')}
            </button>
            <div className="flex items-center gap-2 px-4 py-2 text-dark-300">
              <Truck size={18} className="text-primary-400" />
              <span className="text-sm">{t('freeDelivery')}</span>
            </div>
          </div>

          {activeOffer && (
            <div className="mt-8 inline-flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20">
              <Tag size={20} className="text-secondary-400" />
              <div>
                <p className="text-sm font-semibold text-white">{activeOffer.title}</p>
                <p className="text-xs text-dark-300">{activeOffer.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
