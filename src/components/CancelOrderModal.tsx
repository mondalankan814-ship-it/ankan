import { useState } from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { useLang } from '@/context/LanguageContext';

interface CancelOrderModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string | null) => Promise<void>;
}

export function CancelOrderModal({ open, onClose, onConfirm }: CancelOrderModalProps) {
  const { t } = useLang();
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const reasonOptions = [
    { value: 'changed_mind', label: t('cancelReasonChangedMind') },
    { value: 'wrong_item', label: t('cancelReasonWrongItem') },
    { value: 'delay', label: t('cancelReasonDelay') },
    { value: 'other', label: t('cancelReasonOther') },
  ];

  const finalReason =
    reason === 'other' && customReason.trim()
      ? customReason.trim()
      : reason && reason !== 'other'
        ? reasonOptions.find((r) => r.value === reason)?.label ?? null
        : null;

  const handleConfirm = async () => {
    setCancelling(true);
    setError('');
    try {
      await onConfirm(finalReason);
      setReason('');
      setCustomReason('');
    } catch {
      setError(t('cancellationFailed'));
    } finally {
      setCancelling(false);
    }
  };

  const handleClose = () => {
    if (cancelling) return;
    setReason('');
    setCustomReason('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-dark-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-error-600" />
            </div>
            <h2 className="font-display font-bold text-lg text-dark-900">{t('cancelOrderTitle')}</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={cancelling}
            className="p-2 rounded-lg hover:bg-dark-100 disabled:opacity-50"
          >
            <X size={20} className="text-dark-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-dark-600">{t('cancelOrderDesc')}</p>

          <div>
            <label className="block text-sm font-medium text-dark-700 mb-1.5">
              {t('cancelReason')}
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={cancelling}
              className="w-full px-3.5 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all bg-white disabled:opacity-60"
            >
              <option value="">{t('cancelReasonPlaceholder')}</option>
              {reasonOptions.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {reason === 'other' && (
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder={t('cancelReasonOtherPlaceholder')}
              disabled={cancelling}
              className="w-full px-3.5 py-2.5 rounded-xl border border-dark-200 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all disabled:opacity-60"
            />
          )}

          {error && (
            <p className="text-sm text-error-600 font-medium">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-dark-100 bg-dark-50/50">
          <button
            onClick={handleClose}
            disabled={cancelling}
            className="flex-1 py-3 rounded-xl border border-dark-200 text-dark-700 font-medium text-sm hover:bg-white disabled:opacity-60 transition-colors"
          >
            {t('keepOrder')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={cancelling}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-error-600 text-white font-semibold text-sm hover:bg-error-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {cancelling ? (
              <>
                <Loader2 size={16} className="animate-spin" /> {t('cancelling')}
              </>
            ) : (
              <>
                <AlertTriangle size={16} /> {t('confirmCancel')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
