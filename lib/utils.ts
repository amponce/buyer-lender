import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export the cn function with explicit type
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue || 0)
}
