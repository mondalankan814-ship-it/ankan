import { useState } from 'react';
import { ShoppingBag, User, Phone, Languages, LogOut } from 'lucide-react';
import { Logo } from './Logo';
import { ProfileDropdown } from './ProfileDropdown';
import { useUser } from '@/context/UserContext';
import { useCart } from '@/context/CartContext';
import { useLang } from '@/context/LanguageContext';
import type { View } from '@/App';

interface HeaderProps {
  view: View;
  onNavigate: (view: View) => void;
  onOpenCart: () => void;
  appName?: string;
  appLogo?: string;
}

export function Header({ view, onNavigate, onOpenCart, appName, appLogo }: HeaderProps) {
  const { profile, signOut } = useUser();
  const { totalItems } = useCart();
  const { lang, setLang, t } = useLang();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-dark-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('home')} className="shrink-0">
            <Logo appName={appName} appLogo={appLogo} />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            <NavBtn label={t('home')} active={view === 'home'} onClick={() => onNavigate('home')} />
            <NavBtn label={t('menu')} active={view === 'menu'} onClick={() => onNavigate('menu')} />
            <NavBtn label={t('trackOrder')} active={view === 'track'} onClick={() => onNavigate('track')} />
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary-50 border border-primary-200 text-primary-700 hover:bg-primary-100 transition-colors"
              title="Switch language"
            >
              <Languages size={16} />
              <span className="text-xs font-bold">{lang === 'en' ? 'বাংলা' : 'EN'}</span>
            </button>

            {profile ? (
              <div className="relative" data-profile-dropdown>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-primary-200 flex items-center justify-center overflow-hidden shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <User size={14} className="text-primary-700" />
                    )}
                  </div>
                  <span className="hidden sm:inline text-sm font-medium text-dark-800 max-w-[100px] truncate">
                    {profile.name}
                  </span>
                </button>
                {dropdownOpen && (
                  <ProfileDropdown onClose={() => setDropdownOpen(false)} />
                )}
              </div>
            ) : null}

            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-dark-900 text-white hover:bg-dark-800 transition-colors"
            >
              <ShoppingBag size={18} />
              <span className="hidden sm:inline text-sm font-medium">{t('cart')}</span>
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('menu')}
              className="md:hidden p-2 rounded-xl bg-dark-100 text-dark-700"
              aria-label="Browse menu"
            >
              <Phone size={18} />
            </button>
          </div>
        </div>

        <nav className="md:hidden flex items-center gap-1 pb-2 overflow-x-auto scrollbar-hide">
          <NavBtn label={t('home')} active={view === 'home'} onClick={() => onNavigate('home')} />
          <NavBtn label={t('menu')} active={view === 'menu'} onClick={() => onNavigate('menu')} />
          <NavBtn label={t('trackOrder')} active={view === 'track'} onClick={() => onNavigate('track')} />
        </nav>
      </div>
    </header>
  );
}

function NavBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
        active
          ? 'bg-primary-50 text-primary-700'
          : 'text-dark-600 hover:text-dark-900 hover:bg-dark-100'
      }`}
    >
      {label}
    </button>
  );
}
