import { Flame } from 'lucide-react';

export function Logo({
  size = 'md',
  appName,
  appLogo,
}: {
  size?: 'sm' | 'md' | 'lg';
  appName?: string;
  appLogo?: string;
}) {
  const dims = {
    sm: { box: 'w-9 h-9', icon: 18, text: 'text-lg' },
    md: { box: 'w-11 h-11', icon: 22, text: 'text-xl' },
    lg: { box: 'w-16 h-16', icon: 32, text: 'text-3xl' },
  }[size];

  const name = appName || 'AM Palace';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${dims.box} rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-lg shadow-primary-500/30 overflow-hidden shrink-0`}
      >
        {appLogo ? (
          <img src={appLogo} alt={name} className="w-full h-full object-cover" />
        ) : (
          <Flame size={dims.icon} className="text-white" />
        )}
      </div>
      <div className="flex flex-col leading-none">
        <span className={`font-display font-extrabold text-dark-900 ${dims.text}`}>
          {name}
        </span>
        <span className="text-[10px] font-medium text-primary-600 tracking-wider uppercase">
          Fast Food Delivery
        </span>
      </div>
    </div>
  );
}
