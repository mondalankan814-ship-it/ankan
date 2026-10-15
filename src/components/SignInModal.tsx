import { useState, useRef, useEffect } from 'react';
import { X, Phone, KeyRound, Loader2, CheckCircle2, User, ShieldCheck, RefreshCw } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import type { Gender } from '@/types';
import { fetchSettings } from '@/lib/data';
import { speakWarm, preloadVoices } from '@/lib/voice';

interface SignInModalProps {
  open: boolean;
  onClose: () => void;
}

export function SignInModal({ open, onClose }: SignInModalProps) {
  const { sendOtp, verifyOtp, completeProfile } = useUser();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      fetchSettings().then(setSettings);
      // Preload voices on user interaction (modal open counts as interaction)
      preloadVoices();
    }
  }, [open]);

  const [isDemoMode, setIsDemoMode] = useState(true);

  // Auto-fill OTP via Web OTP API (Android Chrome only)
  useEffect(() => {
    if (step !== 'otp') return;
    if ('OTPCredential' in window) {
      const abortController = new AbortController();
      navigator.credentials
        .get({
          abortSignal: abortController.signal,
          otp: { transportMethods: ['sms'] },
        } as CredentialRequestOptions)
        .then((credential) => {
          if (credential && 'code' in credential) {
            const code = (credential as OTPCredential).code.replace(/\D/g, '').slice(0, 6);
            setOtp(code);
          }
        })
        .catch(() => {
          // User dismissed or not supported — ignore
        });
      return () => abortController.abort();
    }
  }, [step]);

  useEffect(() => {
    if (step === 'otp' && otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, [step]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!open) return null;

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (!validatePhone(phone.trim())) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    try {
      const result = await sendOtp(phone.trim());
      setPendingPhone(phone.trim());
      setStep('otp');
      setResendCooldown(60);
      setIsDemoMode(result.demo);
      if (result.demo) {
        setInfo(result.message || 'Demo OTP sent! Use 123456 to verify (test mode).');
      } else {
        setInfo('OTP sent to your phone via SMS.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setInfo('');
    setLoading(true);
    try {
      const result = await sendOtp(pendingPhone);
      setResendCooldown(60);
      if (result.demo) {
        setInfo(result.message || 'New OTP sent! Use 123456 to verify (test mode).');
      } else {
        setInfo('New OTP sent to your phone via SMS.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resend OTP.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');

    if (otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOtp(pendingPhone, otp.trim());
      if (!result.needsProfile && result.profile) {
        await playWelcomeGreeting(result.profile.name, result.profile.gender);
        onClose();
        resetForm();
      } else {
        setStep('profile');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Verification failed. Please check your code and try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const profile = await completeProfile(name.trim(), gender);
      await playWelcomeGreeting(profile.name, profile.gender);
      onClose();
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const playWelcomeGreeting = async (profileName: string, profileGender: Gender) => {
    const lang = (settings.voice_language === 'bn' ? 'bn' : settings.voice_language === 'hi' ? 'hi' : 'en') as 'en' | 'bn' | 'hi';
    const restaurantName = settings.app_name || 'AM Palace';
    const prefix = profileGender === 'male'
      ? (settings[`greeting_prefix_male_${lang}`] || 'Sir')
      : profileGender === 'female'
        ? (settings[`greeting_prefix_female_${lang}`] || "Ma'am")
        : '';
    const greetingTemplate = settings[`welcome_greeting_${lang}`] || '';
    let spoken = greetingTemplate
      .replace(/\[NAME\]/g, profileName)
      .replace(/\[TITLE\]/g, prefix)
      .replace(/\[RESTAURANT\]/g, restaurantName);
    if (!greetingTemplate.includes('[NAME]')) {
      spoken = `Welcome ${profileName} ${prefix} to ${restaurantName}!`;
    }
    await speakWarm(spoken, lang);
  };

  const resetForm = () => {
    setStep('phone');
    setPhone('');
    setOtp('');
    setName('');
    setGender('male');
    setError('');
    setInfo('');
    setPendingPhone('');
    setResendCooldown(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const voiceLang = (settings.voice_language === 'bn' ? 'bn' : settings.voice_language === 'hi' ? 'hi' : 'en') as 'en' | 'bn' | 'hi';
  const restaurantName = settings.app_name || 'AM Palace';
  const greetingText = voiceLang === 'bn' ? `${restaurantName}-এ স্বাগতম!` : voiceLang === 'hi' ? `${restaurantName} में स्वागत है!` : `Welcome to ${restaurantName}!`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-dark-900 via-dark-800 to-primary-900 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-primary-500 to-accent-600 p-6 text-center relative">
          <button onClick={handleClose} className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/20 transition-colors">
            <X size={20} className="text-white" />
          </button>
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
            {step === 'phone' && <Phone size={28} className="text-white" />}
            {step === 'otp' && <KeyRound size={28} className="text-white" />}
            {step === 'profile' && <User size={28} className="text-white" />}
          </div>
          <h2 className="text-xl font-display font-bold text-white">{greetingText}</h2>
          <p className="text-sm text-white/80 mt-1">
            {step === 'phone' && 'Login with your phone number to order'}
            {step === 'otp' && `Enter the 6-digit code sent to +91 ${pendingPhone}`}
            {step === 'profile' && 'Complete your profile'}
          </p>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`h-2 w-8 rounded-full transition-all ${step === 'phone' ? 'bg-primary-500' : 'bg-success-500'}`} />
            <div className={`h-2 w-8 rounded-full transition-all ${step === 'otp' ? 'bg-primary-500' : step === 'profile' ? 'bg-success-500' : 'bg-dark-200'}`} />
            <div className={`h-2 w-8 rounded-full transition-all ${step === 'profile' ? 'bg-primary-500' : 'bg-dark-200'}`} />
          </div>

          {/* Step: Phone */}
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Phone Number</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500 font-medium text-lg">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-dark-900 text-lg tracking-wider"
                  />
                </div>
                <p className="text-xs text-dark-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck size={12} className="text-success-500" />
                  {isDemoMode
                    ? <>A 6-digit OTP will be sent to your phone. Use <strong className="text-primary-600">123456</strong> for testing.</>
                    : 'A 6-digit OTP will be sent to your phone via SMS.'
                  }
                </p>
              </div>

              {error && <p className="text-sm text-error-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Enter 6-Digit OTP</label>
                <input
                  ref={otpInputRef}
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-dark-900 text-2xl tracking-[0.4em] text-center font-bold"
                />
                {info && (
                  <p className="text-xs text-success-600 mt-1.5 text-center flex items-center justify-center gap-1">
                    <CheckCircle2 size={12} /> {info}
                  </p>
                )}
                {!info && (
                  <p className="text-xs text-dark-400 mt-1.5 text-center">
                    {isDemoMode
                      ? <>Enter the 6-digit code (use <strong className="text-primary-600">123456</strong> for testing)</>
                      : 'Enter the 6-digit code sent to your phone'
                    }
                  </p>
                )}
              </div>

              {error && <p className="text-sm text-error-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><CheckCircle2 size={18} /> Verify & Continue</>}
              </button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => { setStep('phone'); setOtp(''); setError(''); setInfo(''); }}
                  className="text-sm text-dark-500 hover:text-dark-700 font-medium"
                >
                  Change phone number
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  {resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    <><RefreshCw size={14} /> Resend OTP</>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step: Profile */}
          {step === 'profile' && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="p-3 rounded-xl bg-success-50 border border-success-200 flex items-center gap-2">
                <ShieldCheck size={18} className="text-success-600 shrink-0" />
                <p className="text-xs text-success-700">Phone verified successfully! Please complete your profile.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Your Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Mohit"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-dark-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-dark-700 mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      gender === 'male' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                    }`}
                  >
                    Male (Sir)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      gender === 'female' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                    }`}
                  >
                    Female (Ma'am)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                      gender === 'other' ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-dark-200 text-dark-600 hover:border-dark-300'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>

              {error && <p className="text-sm text-error-600 font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
