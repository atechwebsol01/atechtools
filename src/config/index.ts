// API base URL for PHP endpoints (local/dev/prod)
// Set this to your XAMPP server for local dev, e.g. 'http://localhost/api'
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://atechtools.org/api';
/**
 * Configuration settings for the application.
 * All environment variables are used through this configuration object.
 */

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
// import { clusterApiUrl } from '@solana/web3.js';

/**
 * Convert string environment variable to number, with fallback
 */
const getEnvNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const num = Number(value);
  return isNaN(num) ? fallback : num;
};

/**
 * Convert string environment variable to boolean, with fallback
 */
const getEnvBoolean = (value: string | undefined, fallback: boolean): boolean => {
  if (!value) return fallback;
  return value.toLowerCase() === 'true';
};

// Network Configuration
export const SOLANA_NETWORK = (import.meta.env.VITE_SOLANA_NETWORK || 'mainnet-beta') as WalletAdapterNetwork;

// HARDCODED for debug: Use your Helius endpoint directly
export const RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";
export const RPC_WS_ENDPOINT = "wss://mainnet.helius-rpc.com/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";
export const RPC_CONFIG = {
  maxRetries: getEnvNumber(import.meta.env.VITE_RPC_MAX_RETRIES, 3),
  retryDelay: getEnvNumber(import.meta.env.VITE_RPC_RETRY_DELAY, 2000),
};

// SOLANA ENDPOINTS
export const SOLANA_RPC_ENDPOINT = "https://mainnet.helius-rpc.com/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";

// Helius API Endpoints
export const HELIUS_API_URL = "https://mainnet.helius-rpc.com/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";
export const HELIUS_TOKEN_METADATA_URL = "https://api.helius.xyz/v0/transactions/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";
export const HELIUS_ADDRESS_TX_URL = "https://api.helius.xyz/v0/addresses/{address}/transactions/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";

// Treasury Configuration
export const TREASURY_WALLET = "4yQYkmfmE7hiwauaTHNgHmS8arN1BU6xm4xPoNjcbv75";

// Fee Configuration - Updated for proper tier implementation
export const BASIC_TIER_TRANSFER_FEE_BPS = getEnvNumber(import.meta.env.VITE_BASIC_TIER_TRANSFER_FEE_BPS, 20); // 0.2%
export const ADVANCED_TIER_TRANSFER_FEE_BPS = 0; // 0% for advanced
export const ENTERPRISE_TIER_TRANSFER_FEE_BPS = 0; // 0% for enterprise

// Plan Pricing (Basic: free, Advanced: 0.01 SOL, Enterprise: 0.015 SOL)
export const BASIC_CREATION_FEE = 0;
export const ADVANCED_CREATION_FEE = 0.01;
export const ENTERPRISE_CREATION_FEE = 0.015;
export const METADATA_FEE_BASIC = 0.01;
export const METADATA_FEE_ADVANCED = 0.01;
export const METADATA_FEE_ENTERPRISE = 0.01;

// Maximum fees for Token-2022
export const MAX_TRANSFER_FEE = {
  BASIC: BigInt(1000000000), // 1 token max fee for BASIC (FREE!!!)
  ADVANCED: BigInt(500000000), // 0.5 token max fee for ADVANCED
  ENTERPRISE: BigInt(5000000000), // 5 token max fee for ENTERPRISE (creator royalties)
};

// Timing Configuration (in milliseconds)
export const TIMING = {
  mintDelay: getEnvNumber(import.meta.env.VITE_MINT_DELAY, 8000),
  metadataDelay: getEnvNumber(import.meta.env.VITE_METADATA_DELAY, 10000),
  postMetadataDelay: getEnvNumber(import.meta.env.VITE_POST_METADATA_DELAY, 8000),
};

// IPFS Configuration
export const IPFS_CONFIG = {
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY || '',
  pinataSecretKey: import.meta.env.VITE_PINATA_SECRET_KEY || '',
};

// Feature Flags
export const FEATURES = {
  analytics: getEnvBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
};

// Royalty Configuration
export const ROYALTY = {
  defaultPercentage: getEnvNumber(import.meta.env.VITE_DEFAULT_ROYALTY_PERCENTAGE, 1.5),
  maxPercentage: getEnvNumber(import.meta.env.VITE_MAX_ROYALTY_PERCENTAGE, 5.0),
  minPercentage: getEnvNumber(import.meta.env.VITE_MIN_ROYALTY_PERCENTAGE, 0.0),
};

// Application metadata
export const APP_NAME = 'ATECHTOOLS';
export const APP_URL = 'https://atechtools.io';

// Convert SOL to lamports
export const SOL_TO_LAMPORTS = 1000000000;

// Admin Configuration
export const ADMIN_WALLETS = ["4yQYkmfmE7hiwauaTHNgHmS8arN1BU6xm4xPoNjcbv75"];

// Viral mechanics configuration
export const VIRAL_CONFIG = {
  tokensCreatedToday: Math.floor(Math.random() * 200) + 100, // Start with random base
  lastTokenCreatedAgo: '2 minutes ago',
  successStories: [
    { token: 'DogeCoin2025', marketCap: '$1.2M', time: '3 days ago' },
    { token: 'MoonRocket', marketCap: '$890K', time: '5 days ago' },
    { token: 'SolPepe', marketCap: '$2.1M', time: '1 week ago' },
  ],
  creatorLevels: ['Bronze', 'Silver', 'Gold', 'Diamond', 'Legendary'],
  achievements: [
    { id: 'first_token', name: 'First Steps', description: 'Create your first token', icon: '🎯' },
    { id: 'viral_token', name: 'Going Viral', description: 'Token reaches 100 holders', icon: '🚀' },
    { id: 'millionaire', name: 'Millionaire Maker', description: 'Token reaches $1M market cap', icon: '💎' },
    { id: 'fee_collector', name: 'Fee Collector', description: 'Earn 1 SOL in transfer fees', icon: '💰' },
    { id: 'serial_creator', name: 'Serial Creator', description: 'Create 5 tokens', icon: '🏭' },
  ]
};

// Plan features with updated fee structure
export interface PlanFeatures {
  transferFeeBps: number; // Transfer fee in basis points
  feeAuthority: 'treasury' | 'creator'; // Where fees go
  mintable: boolean;
  burnable: boolean;
  royalties: boolean;
  tokenImage: boolean;
  multiSig: boolean;
  advancedAnalytics: boolean;
  priorityProcessing: boolean;
  supportChannel: boolean;
  viralKit: boolean;
  aiMemeGenerator: boolean;
  customBranding: boolean;
  maxFee: bigint;
}

export const getPlanFeatures = (plan: 'basic' | 'advanced' | 'enterprise'): PlanFeatures => {
  switch (plan) {
    case 'basic':
      return {
        transferFeeBps: BASIC_TIER_TRANSFER_FEE_BPS, // 0.2% to treasury
        feeAuthority: 'treasury',
        mintable: false,
        burnable: false,
        royalties: false,
        tokenImage: true,
        multiSig: false,
        advancedAnalytics: false,
        priorityProcessing: false,
        supportChannel: false,
        viralKit: true,
        aiMemeGenerator: false,
        customBranding: false,
        maxFee: MAX_TRANSFER_FEE.BASIC,
      };
    case 'advanced':
      return {
        transferFeeBps: 0, // 0% for advanced
        feeAuthority: 'treasury',
        mintable: true,
        burnable: true,
        royalties: false,
        tokenImage: true,
        multiSig: false,
        advancedAnalytics: true,
        priorityProcessing: false,
        supportChannel: false,
        viralKit: true,
        aiMemeGenerator: false,
        customBranding: false,
        maxFee: MAX_TRANSFER_FEE.ADVANCED,
      };
    case 'enterprise':
      return {
        transferFeeBps: 0, // 0% for enterprise
        feeAuthority: 'creator', // Custom royalties go to creator
        mintable: true,
        burnable: true,
        royalties: true, // Can set 0-5% creator royalties
        tokenImage: true,
        multiSig: false,
        advancedAnalytics: true,
        priorityProcessing: true,
        supportChannel: true,
        viralKit: true,
        aiMemeGenerator: true,
        customBranding: false,
        maxFee: MAX_TRANSFER_FEE.ENTERPRISE,
      };
  }
};

// Token creation fees based on plan
export const getPlanFee = (plan: 'basic' | 'advanced' | 'enterprise'): number => {
  switch (plan) {
    case 'basic':
      return BASIC_CREATION_FEE;
    case 'advanced':
      return ADVANCED_CREATION_FEE;
    case 'enterprise':
      return ENTERPRISE_CREATION_FEE;
  }
};

export const getMetadataFee = (plan: 'basic' | 'advanced' | 'enterprise'): number => {
  switch (plan) {
    case 'basic':
      return METADATA_FEE_BASIC;
    case 'advanced':
      return METADATA_FEE_ADVANCED;
    case 'enterprise':
      return METADATA_FEE_ENTERPRISE;
  }
};

// Utility function to get fee configuration for token creation
export const getFeeConfig = (plan: 'basic' | 'advanced' | 'enterprise', creatorWallet?: string, customRoyaltyBps?: number) => {
  const features = getPlanFeatures(plan);
  if (plan === 'enterprise' && customRoyaltyBps !== undefined) {
    // Enterprise tier with custom creator royalties
    return {
      transferFeeBasisPoints: Math.max(0, Math.min(customRoyaltyBps, ROYALTY.maxPercentage * 100)),
      maximumFee: features.maxFee,
      transferFeeConfigAuthority: creatorWallet || TREASURY_WALLET,
      withdrawWithheldAuthority: creatorWallet || TREASURY_WALLET,
      feeAuthority: 'creator' as const,
    };
  } else if (plan === 'enterprise' && customRoyaltyBps === 0) {
    // Enterprise tier with no fees
    return null; // No fee extension
  } else {
    // BASIC and ADVANCED tiers - fees go to treasury
    return {
      transferFeeBasisPoints: features.transferFeeBps,
      maximumFee: features.maxFee,
      transferFeeConfigAuthority: TREASURY_WALLET,
      withdrawWithheldAuthority: TREASURY_WALLET,
      feeAuthority: 'treasury' as const,
    };
  }
};

// Check if wallet is admin
export const isAdminWallet = (walletAddress: string): boolean => {
  return ADMIN_WALLETS.includes(walletAddress);
};

// Gamification levels
export const getCreatorLevel = (tokensCreated: number): { level: string; color: string; next: number } => {
  if (tokensCreated === 0) return { level: 'Newcomer', color: 'text-gray-400', next: 1 };
  if (tokensCreated < 3) return { level: 'Bronze Creator', color: 'text-orange-400', next: 3 };
  if (tokensCreated < 10) return { level: 'Silver Creator', color: 'text-gray-300', next: 10 };
  if (tokensCreated < 25) return { level: 'Gold Creator', color: 'text-yellow-400', next: 25 };
  if (tokensCreated < 50) return { level: 'Diamond Creator', color: 'text-blue-400', next: 50 };
  return { level: 'Legendary Creator', color: 'text-purple-400', next: 100 };
};