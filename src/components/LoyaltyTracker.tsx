import { useEffect, useState } from 'react';
import { Gift, Trophy, Flame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { LoyaltyProgress, Profile } from '@/types';

interface LoyaltyTrackerProps {
  profile: Profile;
  progress: LoyaltyProgress[];
}

function BoxCollage({ box }: { box: LoyaltyProgress }) {
  const images = box.item_images && box.item_images.length > 0
    ? box.item_images.filter(Boolean)
    : box.item_image
      ? [box.item_image]
      : [];
  const names = box.item_names && box.item_names.length > 0
    ? box.item_names
    : box.item_name
      ? [box.item_name]
      : [];

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Flame size={16} className="text-secondary-400/60" />
      </div>
    );
  }

  // Single item — full image
  if (images.length === 1) {
    return (
      <img
        src={images[0] ?? undefined}
        alt={names[0] ?? ''}
        className="w-full h-full object-cover"
      />
    );
  }

  // 2 items — side by side
  if (images.length === 2) {
    return (
      <div className="w-full h-full grid grid-cols-2 gap-0.5">
        {images.slice(0, 2).map((img, i) => (
          <img
            key={i}
            src={img ?? undefined}
            alt={names[i] ?? ''}
            className="w-full h-full object-cover"
          />
        ))}
      </div>
    );
  }

  // 3+ items — 2x2 grid with first 4 images
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-0.5">
      {images.slice(0, 4).map((img, i) => (
        <div key={i} className="relative overflow-hidden">
          <img
            src={img ?? undefined}
            alt={names[i] ?? ''}
            className="w-full h-full object-cover"
          />
          {i === 3 && images.length > 4 && (
            <div className="absolute inset-0 bg-dark-900/60 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">+{images.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function LoyaltyTracker({ profile, progress }: LoyaltyTrackerProps) {
  const filledCount = progress.length;
  const boxes = Array.from({ length: 7 }, (_, i) => progress[i] ?? null);
  const [rewardName, setRewardName] = useState('Free Meal');
  const [rewardImage, setRewardImage] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['loyalty_reward_name', 'loyalty_reward_image', 'loyalty_reward_description']);
      const map: Record<string, string> = {};
      for (const row of data ?? []) {
        map[row.key] = row.value;
      }
      if (map.loyalty_reward_name) setRewardName(map.loyalty_reward_name);
      if (map.loyalty_reward_image) setRewardImage(map.loyalty_reward_image);
      if (map.loyalty_reward_description) setRewardDescription(map.loyalty_reward_description);
    })();
  }, []);

  return (
    <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl p-5 sm:p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-bold text-lg flex items-center gap-2">
            <Trophy size={20} className="text-secondary-400" />
            Loyalty Rewards
          </h3>
          <p className="text-sm text-dark-300 mt-0.5">
            {profile.reward_unlocked
              ? `${rewardName} unlocked! Enjoy your reward.`
              : `${7 - filledCount} more orders to unlock your ${rewardName}`}
          </p>
        </div>
        <div className="text-2xl font-display font-extrabold text-secondary-400 shrink-0">
          {filledCount}/7
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
        {boxes.map((box, i) => {
          const itemCount = box
            ? (box.item_images?.length ?? (box.item_image ? 1 : 0))
            : 0;

          return (
            <div
              key={i}
              className="group relative aspect-square rounded-xl overflow-hidden border-2 transition-all"
            >
              {box ? (
                <>
                  <div className="w-full h-full">
                    <BoxCollage box={box} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 via-transparent to-transparent" />
                  {itemCount > 1 && (
                    <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full bg-dark-900/80 text-white text-[9px] font-bold">
                      {itemCount} items
                    </span>
                  )}
                  <span className="absolute bottom-1 left-1 text-[9px] font-bold text-white/90 drop-shadow">
                    #{i + 1}
                  </span>
                </>
              ) : (
                <div className="w-full h-full border-2 border-dark-600 bg-dark-700/40 flex items-center justify-center">
                  <span className="text-xs font-bold text-dark-500">{i + 1}</span>
                </div>
              )}

              {box && (
                <div className="absolute inset-0 bg-dark-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-1.5 z-10">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-secondary-400 mb-0.5">Order #{i + 1}</p>
                    <p className="text-[9px] text-white/80 leading-tight line-clamp-3">
                      {box.item_names && box.item_names.length > 0
                        ? box.item_names.join(', ')
                        : box.item_name ?? ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {profile.reward_unlocked && (
        <div className="mt-4 flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-secondary-500/20 to-primary-500/20 border border-secondary-400/30">
          {rewardImage ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-secondary-400/30">
              <img src={rewardImage} alt={rewardName} className="w-full h-full object-cover" />
            </div>
          ) : (
            <Gift size={26} className="text-secondary-400 shrink-0" />
          )}
          <div>
            <p className="font-semibold text-white text-sm">{rewardName} Unlocked!</p>
            <p className="text-xs text-dark-300">{rewardDescription || `You've earned ${rewardName.toLowerCase()} on your next order.`}</p>
          </div>
        </div>
      )}
    </div>
  );
}
