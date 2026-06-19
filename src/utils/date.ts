import { format } from 'date-fns';

export function getLocalDateKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}
