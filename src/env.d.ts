/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SOLANA_NETWORK: string
  readonly VITE_RPC_ENDPOINT: string
  readonly VITE_TREASURY_WALLET_ADDRESS: string
  readonly VITE_BASIC_PLAN_FEE: string
  readonly VITE_ADVANCED_PLAN_FEE: string
  readonly VITE_ENTERPRISE_PLAN_FEE: string
  readonly VITE_DEFAULT_ROYALTY_PERCENTAGE: string
  readonly VITE_MAX_ROYALTY_PERCENTAGE: string
  readonly VITE_ENABLE_ANALYTICS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
