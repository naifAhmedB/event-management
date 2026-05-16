import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string, language: 'ar' | 'en'): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}

export function formatPrice(amount: number, language: 'ar' | 'en'): string {
  const formatted = new Intl.NumberFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  return language === 'ar' ? `${formatted} ريال` : `${formatted} SAR`;
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('966')) return `+${digits}`;
  if (digits.startsWith('0')) return `+966${digits.slice(1)}`;
  return `+966${digits}`;
}

export function getEventTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    women_wedding: '💐',
    graduation: '🎓',
    men_wedding: '🤵',
    newborn: '👶',
    opening: '🎊',
    birthday: '🎂',
  };
  return icons[type] || '📅';
}

export function getEventTypeColor(type: string): string {
  const colors: Record<string, string> = {
    women_wedding: 'bg-pink-50 border-pink-200 text-pink-700',
    graduation: 'bg-blue-50 border-blue-200 text-blue-700',
    men_wedding: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    newborn: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    opening: 'bg-green-50 border-green-200 text-green-700',
    birthday: 'bg-orange-50 border-orange-200 text-orange-700',
  };
  return colors[type] || 'bg-purple-50 border-purple-200 text-purple-700';
}
