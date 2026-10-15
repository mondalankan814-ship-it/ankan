import { useEffect, useMemo, useRef } from 'react';
import { PartyPopper, CheckCircle2, ArrowRight } from 'lucide-react';

interface CelebrationOverlayProps {
  total: number;
  isDelivery: boolean;
  deliveryText: string;
  whatsappText: string;
  onViewStatus: () => void;
}

const CONFETTI_COLORS = [
  '#f97316', '#fbbf24', '#f43f5e', '#22c55e',
  '#3b82f6', '#a855f7', '#ec4899', '#06b6d4',
  '#fde047', '#fb923c',
];

const CONFETTI_SHAPES = ['rect', 'circle', 'triangle'] as const;

interface ConfettiPiece {
  id: number;
  color: string;
  shape: (typeof CONFETTI_SHAPES)[number];
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}

interface BurstPiece {
  id: number;
  color: string;
  shape: (typeof CONFETTI_SHAPES)[number];
  delay: number;
  duration: number;
  size: number;
}

function generateConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
    left: Math.random() * 100,
    delay: Math.random() * 1.5,
    duration: 2.5 + Math.random() * 2,
    size: 8 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));
}

function generateBurst(count: number): BurstPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    shape: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
    delay: Math.random() * 0.3,
    duration: 1.5 + Math.random() * 1,
    size: 8 + Math.random() * 8,
  }));
}

function ConfettiShape({ color, shape, size }: { color: string; shape: (typeof CONFETTI_SHAPES)[number]; size: number }) {
  if (shape === 'circle') {
    return (
      <div
        style={{
          width: size,
          height: size,
          background: color,
          borderRadius: '50%',
        }}
      />
    );
  }
  if (shape === 'triangle') {
    return (
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size / 2}px solid transparent`,
          borderRight: `${size / 2}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size * 1.4,
        background: color,
        borderRadius: '2px',
      }}
    />
  );
}

function playCelebrationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Celebration melody: ascending notes C5-E5-G5-C6 + sparkle
    const notes = [
      { freq: 523.25, start: 0, dur: 0.12 },
      { freq: 659.25, start: 0.1, dur: 0.12 },
      { freq: 783.99, start: 0.2, dur: 0.12 },
      { freq: 1046.5, start: 0.3, dur: 0.25 },
      { freq: 1318.5, start: 0.35, dur: 0.4 },
      { freq: 1568.0, start: 0.4, dur: 0.5 },
    ];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, 0);
    masterGain.gain.exponentialRampToValueAtTime(0.3, 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.001, 1.2);
    masterGain.connect(ctx.destination);

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.freq, ctx.currentTime + note.start);

      gain.gain.setValueAtTime(0, ctx.currentTime + note.start);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + note.start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + note.start + note.dur);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(ctx.currentTime + note.start);
      osc.stop(ctx.currentTime + note.start + note.dur + 0.05);
    });

    // Add a soft "pop" at the very start
    const popOsc = ctx.createOscillator();
    const popGain = ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(200, ctx.currentTime);
    popOsc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
    popGain.gain.setValueAtTime(0.15, ctx.currentTime);
    popGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    popOsc.connect(popGain);
    popGain.connect(masterGain);
    popOsc.start(ctx.currentTime);
    popOsc.stop(ctx.currentTime + 0.2);

    // Cleanup
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 2000);
  } catch {
    // Audio not available — silent fallback
  }
}

export function CelebrationOverlay({
  total,
  isDelivery,
  deliveryText,
  whatsappText,
  onViewStatus,
}: CelebrationOverlayProps) {
  const chimePlayed = useRef(false);
  const fallingConfetti = useMemo(() => generateConfetti(60), []);
  const leftBurst = useMemo(() => generateBurst(25), []);
  const rightBurst = useMemo(() => generateBurst(25), []);

  useEffect(() => {
    if (chimePlayed.current) return;
    chimePlayed.current = true;
    playCelebrationChime();
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-hidden">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md" />

      {/* Falling confetti layer */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {fallingConfetti.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece confetti-fall"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              transform: `rotate(${piece.rotation}deg)`,
            }}
          >
            <ConfettiShape color={piece.color} shape={piece.shape} size={piece.size} />
          </div>
        ))}
      </div>

      {/* Left party popper burst */}
      <div className="absolute bottom-0 left-0 pointer-events-none" style={{ width: '50vw', height: '100vh' }}>
        <div className="absolute bottom-8 left-4 sm:left-8 animate-popper">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center shadow-2xl shadow-primary-500/50">
            <PartyPopper size={32} className="text-white" />
          </div>
        </div>
        {leftBurst.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece confetti-burst-left"
            style={{
              bottom: '60px',
              left: '32px',
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          >
            <ConfettiShape color={piece.color} shape={piece.shape} size={piece.size} />
          </div>
        ))}
      </div>

      {/* Right party popper burst */}
      <div className="absolute bottom-0 right-0 pointer-events-none" style={{ width: '50vw', height: '100vh' }}>
        <div className="absolute bottom-8 right-4 sm:right-8 animate-popper">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center shadow-2xl shadow-secondary-500/50">
            <PartyPopper size={32} className="text-white" />
          </div>
        </div>
        {rightBurst.map((piece) => (
          <div
            key={piece.id}
            className="confetti-piece confetti-burst-right"
            style={{
              bottom: '60px',
              right: '32px',
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
            }}
          >
            <ConfettiShape color={piece.color} shape={piece.shape} size={piece.size} />
          </div>
        ))}
      </div>

      {/* Center card */}
      <div className="relative bg-white rounded-3xl p-8 sm:p-10 flex flex-col items-center animate-success-pop max-w-sm w-full shadow-2xl z-10">
        <div className="relative mb-5">
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-secondary-400 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/40 animate-glow-pulse">
            <PartyPopper size={48} className="text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full bg-success-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 size={22} className="text-white" />
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-dark-900 mb-2 text-center">
          Congratulations!
        </h2>
        <p className="text-dark-500 text-sm sm:text-base text-center mb-3">
          Order Successful!
        </p>

        <div className="px-6 py-2 rounded-2xl bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100 mb-4">
          <p className="text-primary-600 font-display font-extrabold text-2xl">
            {`₹${total.toFixed(0)}`}
          </p>
        </div>

        <p className="text-xs text-dark-400 text-center mb-1">
          {isDelivery ? deliveryText : whatsappText}
        </p>
        <p className="text-xs text-success-600 text-center mb-5 flex items-center justify-center gap-1">
          {whatsappText}
        </p>

        <button
          onClick={onViewStatus}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-primary-500 to-accent-600 text-white font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          View Order Status
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
