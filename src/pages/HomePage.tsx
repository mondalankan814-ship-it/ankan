import { useState, useEffect, useMemo, useCallback } from 'react';
import { Flame, Utensils, Soup, Search, X } from 'lucide-react';
import { fetchCategories, fetchMenuItems, fetchActiveOffers } from '@/lib/data';
import type { Category, MenuItem, Offer } from '@/types';
import { MenuCard } from '@/components/MenuCard';
import { Hero } from '@/components/Hero';
import { LoyaltyTracker } from '@/components/LoyaltyTracker';
import { useUser } from '@/context/UserContext';
import { useLang } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import type { LoyaltyProgress } from '@/types';

interface HomePageProps {
  onOrderNow: () => void;
}

const iconMap: Record<string, typeof Flame> = {
  flame: Flame,
  utensils: Utensils,
  'bowl-rice': Soup,
  soup: Soup,
};

export function HomePage({ onOrderNow }: HomePageProps) {
  const { profile } = useUser();
  const { t } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [progress, setProgress] = useState<LoyaltyProgress[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProgress = useCallback(async () => {
    if (!profile) return;
    const { data } = await supabase
      .from('loyalty_progress')
      .select('*')
      .eq('profile_id', profile.id)
      .order('filled_at', { ascending: true })
      .limit(7);
    setProgress((data ?? []) as LoyaltyProgress[]);
  }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const [cats, items, offs] = await Promise.all([
          fetchCategories(),
          fetchMenuItems(),
          fetchActiveOffers(),
        ]);
        setCategories(cats);
        setMenuItems(items);
        setOffers(offs);
        await loadProgress();
      } catch {
        // handled silently
      } finally {
        setLoading(false);
      }
    })();
  }, [loadProgress]);

  // Realtime: refresh loyalty boxes when rows are inserted or deleted
  // (e.g. when an order is cancelled and its reward box is removed)
  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('loyalty-progress-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loyalty_progress' }, () => {
        loadProgress();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, loadProgress]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (activeCat) {
      items = items.filter((m) => m.category_id === activeCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return items;
  }, [menuItems, activeCat, searchQuery]);

  return (
    <div>
      <Hero onOrderNow={onOrderNow} offers={offers} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {profile && (
          <LoyaltyTracker profile={profile} progress={progress} />
        )}

        {/* Prominent Search Bar — above categories */}
        <div className="relative">
          <Search size={22} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for dishes... e.g. Burger, Soup, Chicken"
            className="w-full pl-12 pr-12 py-3.5 rounded-2xl border-2 border-primary-200 bg-white text-base outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all text-dark-900 shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-dark-100 hover:bg-dark-200 flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-dark-500" />
            </button>
          )}
        </div>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-bold text-dark-900">{t('browseCategory')}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <CatCard
              name={t('allItems')}
              icon={Utensils}
              active={activeCat === null}
              onClick={() => setActiveCat(null)}
            />
            {categories.map((cat) => {
              const Icon = iconMap[cat.icon || ''] || Flame;
              return (
                <CatCard
                  key={cat.id}
                  name={cat.name}
                  icon={Icon}
                  active={activeCat === cat.id}
                  onClick={() => setActiveCat(cat.id)}
                />
              );
            })}
          </div>
        </section>

        <section id="menu-section" className="scroll-mt-20">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-display font-bold text-dark-900">
              {searchQuery.trim()
                ? `Search: "${searchQuery.trim()}"`
                : activeCat
                  ? categories.find((c) => c.id === activeCat)?.name
                  : t('popularItems')}
            </h2>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden">
                  <div className="aspect-[4/3] shimmer" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-3/4 rounded shimmer" />
                    <div className="h-3 w-1/2 rounded shimmer" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-16">
              <Search size={40} className="text-dark-300 mx-auto mb-3" />
              <p className="text-dark-500 font-medium">No items found matching "{searchQuery}"</p>
              <button
                onClick={() => setSearchQuery('')}
                className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredItems.map((item) => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CatCard({
  name,
  icon: Icon,
  active,
  onClick,
}: {
  name: string;
  icon: typeof Flame;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
        active
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-dark-100 bg-white text-dark-700 hover:border-dark-200'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          active ? 'bg-primary-500 text-white' : 'bg-dark-100 text-dark-500'
        }`}
      >
        <Icon size={20} />
      </div>
      <span className="font-medium text-sm text-left">{name}</span>
    </button>
  );
}
