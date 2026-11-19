import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatCurrency(value: number): string {
  const hasFractions = value % 1 !== 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasFractions ? 1 : 0,
    maximumFractionDigits: hasFractions ? 2 : 0,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  if (value >= 10_000_000) {
    return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  }
  if (value >= 100_000) {
    return `₹${(value / 100_000).toFixed(1)}L`;
  }
  if (value >= 1_000) {
    return `₹${(value / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(value);
}

function toSafeDate(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isValid(input) ? input : null;
  if (typeof input === 'number') {
    const d = new Date(input);
    return isValid(d) ? d : null;
  }
  const str = String(input).trim();
  if (!str) return null;
  const iso = parseISO(str);
  if (isValid(iso)) return iso;
  const direct = new Date(str);
  if (isValid(direct)) return direct;
  return null;
}

export function formatDate(dateInput: any): string {
  const date = toSafeDate(dateInput);
  if (!date) return '-';
  return format(date, 'MMM dd, yyyy');
}

export function formatDateTime(dateInput: any): string {
  const date = toSafeDate(dateInput);
  if (!date) return '-';
  return format(date, 'MMM dd, yyyy h:mm a');
}

export function formatRelativeTime(dateInput: any): string {
  const date = toSafeDate(dateInput);
  if (!date) return '-';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function formatPercentage(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}
