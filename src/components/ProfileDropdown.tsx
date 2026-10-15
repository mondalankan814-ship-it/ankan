import { useState, useRef, useEffect } from 'react';
import { User, Phone, LogOut, Camera, X } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabase';

interface ProfileDropdownProps {
  onClose: () => void;
}

export function ProfileDropdown({ onClose: _onClose }: ProfileDropdownProps) {
  const { profile, updateAvatar, signOut } = useUser();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-profile-dropdown]')) {
        _onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('click', handleClickOutside), 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [_onClose]);

  if (!profile) return null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      await updateAvatar(urlData.publicUrl);
    } catch {
      // fallback: use object URL as avatar (temporary)
      const objUrl = URL.createObjectURL(file);
      await updateAvatar(objUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    _onClose();
  };

  return (
    <div
      data-profile-dropdown
      className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-dark-100 overflow-hidden z-50"
    >
      {/* Header section with avatar */}
      <div className="bg-gradient-to-br from-primary-500 to-accent-600 p-5 text-center relative">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="relative mx-auto block group"
        >
          <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center overflow-hidden mx-auto">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <User size={32} className="text-white" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Camera size={14} className="text-dark-700" />
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
        <p className="font-display font-bold text-white text-lg mt-2">{profile.name}</p>
        <p className="text-white/80 text-sm capitalize">{profile.gender}</p>
      </div>

      {/* Phone number */}
      <div className="px-5 py-4 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <Phone size={16} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-dark-400">Registered Phone</p>
            <p className="text-sm font-medium text-dark-800 truncate">{profile.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Loyalty info */}
      <div className="px-5 py-4 border-b border-dark-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-dark-500">Loyalty Points</span>
          <span className="text-sm font-bold text-primary-600">{profile.loyalty_count} / 8</span>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleSignOut}
        className="w-full flex items-center gap-3 px-5 py-4 text-error-600 hover:bg-error-50 transition-colors font-medium text-sm"
      >
        <LogOut size={18} />
        Logout
      </button>
    </div>
  );
}
