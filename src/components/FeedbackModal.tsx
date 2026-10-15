import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { detectMood } from '@/lib/mood';
import { speakSoft, speakWarm, type VoiceLang } from '@/lib/voice';
import { useLang } from '@/context/LanguageContext';
import { useUser } from '@/context/UserContext';
import type { Order } from '@/types';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  order: Order | null;
  malePrefix: string;
  femalePrefix: string;
  feedbackVoices: Record<number, string>;
  greetingLang: VoiceLang;
}

const EMOJI_RATINGS = [
  { value: 5, emoji: '😄', labelKey: 'emojiGreat', color: 'bg-success-100 border-success-400 text-success-700' },
  { value: 4, emoji: '🙂', labelKey: 'emojiGood', color: 'bg-primary-100 border-primary-400 text-primary-700' },
  { value: 3, emoji: '😐', labelKey: 'emojiOkay', color: 'bg-warning-100 border-warning-400 text-warning-700' },
  { value: 2, emoji: '😞', labelKey: 'emojiBad', color: 'bg-accent-100 border-accent-400 text-accent-700' },
  { value: 1, emoji: '😡', labelKey: 'emojiVeryBad', color: 'bg-error-100 border-error-400 text-error-700' },
];

export function FeedbackModal({
  open,
  onClose,
  order,
  malePrefix,
  femalePrefix,
  feedbackVoices,
  greetingLang,
}: FeedbackModalProps) {
  const { profile } = useUser();
  const { t } = useLang();
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apologySpoken, setApologySpoken] = useState(false);

  if (!open || !order) return null;

  const handleSubmit = async () => {
    setSubmitting(true);
    const mood = detectMood(message, rating);
    const shouldApologize = mood === 'negative';

    try {
      await supabase.from('feedback').insert({
        order_id: order.id,
        profile_id: profile?.id ?? null,
        rating,
        message: message.trim() || null,
        mood,
        apology_triggered: shouldApologize,
      });

      const voiceResponse = feedbackVoices[rating] || '';
      const prefix = order.customer_gender === 'male' ? malePrefix : order.customer_gender === 'female' ? femalePrefix : '';
      const spoken = voiceResponse
        .replace(/\[NAME\]/g, order.customer_name)
        .replace(/\[TITLE\]/g, prefix);

      if (shouldApologize || rating <= 2) {
        speakSoft(spoken || 'We are so sorry for your experience. We will do better next time.', greetingLang);
        setApologySpoken(true);
      } else {
        speakWarm(spoken || `Thank you so much ${order.customer_name}. We are happy you enjoyed your meal.`, greetingLang);
      }

      setSubmitted(true);

      // Persist that feedback was given for this order so the auto-popup
      // doesn't appear again on future app opens.
      try {
        const raw = localStorage.getItem('ampalace_feedback_done');
        const ids = raw ? (JSON.parse(raw) as string[]) : [];
        if (!ids.includes(order.id)) {
          ids.push(order.id);
          localStorage.setItem('ampalace_feedback_done', JSON.stringify(ids));
        }
      } catch {
        // localStorage may be unavailable — non-critical
      }

      const delay = shouldApologize ? 4000 : 2500;
      setTimeout(() => {
        setSubmitted(false);
        setApologySpoken(false);
        setRating(5);
        setMessage('');
        onClose();
      }, delay);
    } catch {
      // error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up">
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <h2 className="text-lg font-display font-bold text-dark-900">{t('feedbackTitle')}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-dark-100">
            <X size={18} className="text-dark-500" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center">
            {apologySpoken ? (
              <>
                <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">🙏</span>
                </div>
                <p className="font-display font-semibold text-dark-900 mb-1">{t('feedbackSorry')}</p>
                <p className="text-sm text-dark-500">{t('feedbackSorryDesc')}</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-success-50 flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">😊</span>
                </div>
                <p className="font-display font-semibold text-dark-900">{t('feedbackThankYou')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <div>
              <p className="text-sm font-medium text-dark-700 mb-3">{t('feedbackSubtitle')}</p>
              <div className="grid grid-cols-5 gap-2">
                {EMOJI_RATINGS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRating(r.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                      rating === r.value
                        ? r.color
                        : 'border-dark-100 bg-white text-dark-400 hover:border-dark-200'
                    }`}
                  >
                    <span className="text-2xl">{r.emoji}</span>
                    <span className="text-[10px] font-medium">{t(r.labelKey as never)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-dark-700 mb-2">{t('feedbackTellMore')}</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                placeholder={t('feedbackPlaceholder')}
                className="w-full px-3 py-2.5 rounded-xl border border-dark-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-dark-900 text-sm resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl transition-all disabled:opacity-60"
            >
              <Send size={16} />
              {submitting ? t('feedbackSubmitting') : t('feedbackSubmit')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
