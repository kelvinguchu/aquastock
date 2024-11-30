import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as dateFnsFormat } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function format(date: Date, formatStr: string): string {
  return dateFnsFormat(date, formatStr);
}

// Helper function to format numbers with commas
export function formatNumber(num: number): string {
  return num.toLocaleString('en-KE');
}

// Helper function to format percentages
export function formatPercentage(num: number, decimals: number = 1): string {
  return `${num.toFixed(decimals)}%`;
}

// Helper function to format dates in a consistent way
export function formatDate(date: Date): string {
  return dateFnsFormat(date, 'MMM dd, yyyy');
}

// Helper function to format time
export function formatTime(date: Date): string {
  return dateFnsFormat(date, 'HH:mm');
}

// Helper function to format date and time together
export function formatDateTime(date: Date): string {
  return dateFnsFormat(date, 'MMM dd, yyyy HH:mm');
}
