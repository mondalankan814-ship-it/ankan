export function formatINR(amount: number): string {
  return `₹${amount.toFixed(0)}`;
}

export function getGreetingPrefix(gender: 'male' | 'female' | 'other', malePrefix: string, femalePrefix: string): string {
  if (gender === 'male') return malePrefix;
  if (gender === 'female') return femalePrefix;
  return '';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
