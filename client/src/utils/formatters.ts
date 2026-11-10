import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export function formatDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'N/A';
  return format(date, 'MMM dd, yyyy');
}

export function formatDateTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'N/A';
  return format(date, 'MMM dd, yyyy h:mm a');
}

export function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  if (!isValid(date)) return 'N/A';
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
