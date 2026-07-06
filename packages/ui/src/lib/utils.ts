// packages/ui/src/lib/utils.ts
//
// cn() — className merge helper used by all shadcn/ui components.
// Combines clsx (conditional classes) with tailwind-merge (dedupes
// conflicting Tailwind utilities, e.g. "px-2 px-4" → "px-4").

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
