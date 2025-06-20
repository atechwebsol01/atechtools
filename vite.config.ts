import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({  optimizeDeps: {
    include: ['bn.js', 'buffer', '@solana/web3.js', 'borsh', '@metaplex-foundation/umi-bundle-defaults'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      stream: 'stream-browserify',
      http: 'http-browserify',
      https: 'https-browserify',
      url: 'url/',
      assert: 'assert/',
      events: 'events/',
      util: 'util/',
      // Fix for bn.js and other Solana-related libraries
      'bn.js': path.resolve(__dirname, './node_modules/bn.js/lib/bn.js'),
      '@solana/web3.js': path.resolve(__dirname, './node_modules/@solana/web3.js/lib/index.browser.esm.js'),
      'borsh': path.resolve(__dirname, './node_modules/borsh/lib/index.js'),
      'eventemitter3': path.resolve(__dirname, './node_modules/eventemitter3/index.js'),
      'rpc-websockets/dist/lib/client': path.resolve(__dirname, './node_modules/rpc-websockets/dist/lib/client/index.js'),
      'rpc-websockets/dist/lib/client/websocket.browser': path.resolve(__dirname, './node_modules/rpc-websockets/dist/lib/client/websocket.browser.js')
    }
  },
  build: {
    rollupOptions: {
      external: ['fsevents']
    },
    commonjsOptions: {
      transformMixedEsModules: true
    }  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'ATECHTOOLS',
        short_name: 'ATECHTOOLS',
        description: 'Create and manage Solana tokens with advanced features',
        theme_color: '#8B5CF6',
        background_color: '#121212',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),  ],
  define: {
    'process.env': {},
    'global': {},
    // Fix for Vite not automatically injecting env variables
    'import.meta.env.VITE_SOLANA_NETWORK': JSON.stringify(process.env.VITE_SOLANA_NETWORK),
    'import.meta.env.VITE_RPC_ENDPOINT': JSON.stringify(process.env.VITE_RPC_ENDPOINT),
    'import.meta.env.VITE_RPC_WS_ENDPOINT': JSON.stringify(process.env.VITE_RPC_WS_ENDPOINT),
    'import.meta.env.VITE_RPC_MAX_RETRIES': JSON.stringify(process.env.VITE_RPC_MAX_RETRIES),
    'import.meta.env.VITE_RPC_RETRY_DELAY': JSON.stringify(process.env.VITE_RPC_RETRY_DELAY),
    'import.meta.env.VITE_TREASURY_WALLET_ADDRESS': JSON.stringify(process.env.VITE_TREASURY_WALLET_ADDRESS),
    'import.meta.env.VITE_BASIC_PLAN_FEE': JSON.stringify(process.env.VITE_BASIC_PLAN_FEE),
    'import.meta.env.VITE_ADVANCED_PLAN_FEE': JSON.stringify(process.env.VITE_ADVANCED_PLAN_FEE),
    'import.meta.env.VITE_ENTERPRISE_PLAN_FEE': JSON.stringify(process.env.VITE_ENTERPRISE_PLAN_FEE),
    'import.meta.env.VITE_DEFAULT_ROYALTY_PERCENTAGE': JSON.stringify(process.env.VITE_DEFAULT_ROYALTY_PERCENTAGE),
    'import.meta.env.VITE_MAX_ROYALTY_PERCENTAGE': JSON.stringify(process.env.VITE_MAX_ROYALTY_PERCENTAGE),
    'import.meta.env.VITE_ENABLE_ANALYTICS': JSON.stringify(process.env.VITE_ENABLE_ANALYTICS),
  }
});