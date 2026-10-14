import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export function isoDay(date?: string | Date) {
  if (!date) return todayISO();
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}