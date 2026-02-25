import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const GLOBAL_CURRENCY_SYMBOL = 'ر.س';

export function formatCurrency(amount: number, currencyCode?: string): string {
  const code = currencyCode || 'SAR';

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  let symbol = code;
  if (code === 'SAR' || code === 'ر.س') symbol = 'ر.س';
  else if (code === 'YER' || code === 'ر.ي') symbol = 'ر.ي';
  else if (code === 'USD' || code === '$') symbol = '$';

  if (symbol === '$') {
    return `${symbol}${formattedNumber}`;
  }
  return `${formattedNumber} ${symbol}`;
}

export function formatNumberDisplay(value: number): string {
  // Format non-currency numbers to English digits
  return new Intl.NumberFormat('en-US').format(value);
}