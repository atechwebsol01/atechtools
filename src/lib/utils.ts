import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines and merges tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number, currency = 'SOL', digits = 2): string {
  return `${amount.toFixed(digits)} ${currency}`;
}

/**
 * Formats a large number with commas
 */
export function formatLargeNumber(num: number | string): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Truncates text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Utility function to truncate wallet addresses
export const truncateAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  if (address.length <= chars * 2) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

// Validate token name
export const isValidTokenName = (name: string): { valid: boolean; message: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'Token name is required' };
  }
  
  if (name.length < 2) {
    return { valid: false, message: 'Token name must be at least 2 characters long' };
  }
  
  if (name.length > 32) {
    return { valid: false, message: 'Token name must be 32 characters or less' };
  }
  
  // Check for invalid characters
  const invalidChars = /[<>"/\\|?*\x00-\x1F]/;
  if (invalidChars.test(name)) {
    return { valid: false, message: 'Token name contains invalid characters' };
  }
  
  return { valid: true, message: 'Valid token name' };
};

// Validate token symbol
export const isValidTokenSymbol = (symbol: string): boolean => {
  if (!symbol) return false;
  // Symbol should be 2-10 characters, uppercase letters and numbers only
  const symbolRegex = /^[A-Z0-9]{2,10}$/;
  return symbolRegex.test(symbol);
};

// Validate image file
export const isValidImageFile = (file: File | null): boolean => {
  if (!file) return false;
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  return validTypes.includes(file.type) && file.size <= maxSize;
};

// Format large numbers
export const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format SOL amount
export const formatSOL = (amount: number | string): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0.0000';
  if (num >= 1) {
    return num.toFixed(4);
  } else {
    return num.toFixed(6);
  }
};

/**
 * Sleep utility for animation or rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function to limit the rate at which a function can fire
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validates input as a numeric value
 */
export function isNumeric(value: string): boolean {
  return /^-?\d+(\.\d+)?$/.test(value);
}

/**
 * Copy to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Check if URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate social media URLs
 */
export const validateSocialUrl = (url: string, platform: string): { valid: boolean; message: string } => {
  if (!url) return { valid: true, message: 'Optional field' };
  if (!isValidUrl(url)) {
    return { valid: false, message: 'Invalid URL format' };
  }
  const socialPatterns: Record<string, RegExp> = {
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+/i,
    discord: /^https?:\/\/(www\.)?discord\.(gg|com)\/.+/i,
    telegram: /^https?:\/\/(www\.)?t\.me\/.+/i,
    website: /^https?:\/\/.+/i,
  };
  const pattern = socialPatterns[platform.toLowerCase()];
  if (pattern && !pattern.test(url)) {
    return { valid: false, message: `Invalid ${platform} URL format` };
  }
  return { valid: true, message: 'Valid URL' };
};

/**
 * Calculate fee amount
 */
export const calculateFeeAmount = (amount: number, feeBasisPoints: number): number => {
  return Math.floor((amount * feeBasisPoints) / 10000);
};

/**
 * Convert basis points to percentage
 */
export const basisPointsToPercentage = (basisPoints: number): number => {
  return basisPoints / 100;
};

/**
 * Convert percentage to basis points
 */
export const percentageToBasisPoints = (percentage: number): number => {
  return Math.round(percentage * 100);
};

/**
 * Format percentage
 */
export const formatPercentage = (percentage: number, decimals = 1): string => {
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Check if running in development
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Get environment variable with fallback
 */
export const getEnvVar = (key: string, fallback: string = ''): string => {
  return import.meta.env[key] || process.env[key] || fallback;
};

/**
 * Local storage helpers with error handling
 */
export const localStorageHelpers = {
  get: (key: string, defaultValue: any = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key: string, value: any): boolean => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key: string): boolean => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Default export for backwards compatibility
export default {
  cn,
  truncateAddress,
  isValidTokenName,
  isValidTokenSymbol,
  isValidImageFile,
  formatNumber,
  formatCurrency,
  formatSOL,
  debounce,
  sleep,
  copyToClipboard,
  generateRandomString,
  isValidUrl,
  validateSocialUrl,
  calculateFeeAmount,
  basisPointsToPercentage,
  percentageToBasisPoints,
  formatPercentage,
  isDevelopment,
  getEnvVar,
  localStorageHelpers
};