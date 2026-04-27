import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function nanoid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: decimals,
  }).format(n);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function formatRoas(n: number): string {
  return `${n.toFixed(2)}x`;
}
