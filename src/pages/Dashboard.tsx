// pages/Dashboard.tsx - Enhanced with admin access and better integration

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@solana/wallet-adapter-react';
import { useTokenContext } from '@/context/TokenContext';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import RoyaltyClaimCard from '@/components/RoyaltyClaimCard';
import GamificationPanel from '@/components/GamificationPanel';
import { LiquidityDialog } from '@/components/LiquidityModal';
import { TradingInterface } from '@/components/TradingInterface';
import NavBar from '@/components/NavBar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import {
  Plus, 
  Droplets, 
  ExternalLink, 
  Crown,
  Shield,
  TrendingUp,
  AlertTriangle,
  Coins,
  DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isAdminWallet } from '@/config';
import { truncateAddress } from '@/lib/utils';

const Dashboard: React.FC = () => {
  const { publicKey } = useWallet();
  const {
    tokens,
    isLoading,
    refresh,
    error,
    isLiquidityModalOpen,
    setIsLiquidityModalOpen,
    selectedToken,
    setSelectedToken,
    solBalance
  } = useTokenContext();

  const [activeTab, setActiveTab] = useState<'overview' | 'creator-royalties' | 'trading' | 'gamification'>('overview');

  // Check if current user is admin
  const isAdmin = publicKey ? isAdminWallet(publicKey.toString()) : false;

  const handleTokenAction = (action: 'liquidity', token: any) => {
    setSelectedToken(token);
    if (action === 'liquidity') {
      setIsLiquidityModalOpen(true);
    }
  };
  const openInExplorer = (mintAddress: string) => {
    const url = `https://solscan.io/token/${mintAddress}`;
    window.open(url, '_blank');
  };
  // Add SOL as a pseudo-token at the top of the list
  const solToken = {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    balance: (Number(solBalance) * LAMPORTS_PER_SOL).toString(),
    image: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    supply: '',
    description: 'Native token of the Solana blockchain',
    plan: undefined,
    metadataUri: undefined,
  };
  const allTokens = [solToken, ...tokens];

  if (!publicKey) {
    return (
      <>
        <NavBar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
          <div className="glass-card p-8 rounded-xl max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-gradient-purple-blue mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-white/80 mb-6">
              Connect your Solana wallet to view your token dashboard.
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-token-purple/5">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gradient-purple-blue mb-2">
                Token Dashboard
              </h1>
              <p className="text-white/60">
                Manage your tokens, royalties, and earnings
              </p>
              <p className="text-white/40 text-sm font-mono mt-1">
                {truncateAddress(publicKey.toString())}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-0">
              {/* Admin Access */}
              {isAdmin && (
                <Link to="/admin">
                  <Button className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white">
                    <Shield className="mr-2" size={16} />
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              
              <Button onClick={refresh} variant="outline" disabled={isLoading}>
                <TrendingUp className="mr-2" size={16} />
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </Button>
              
              <Link to="/create">
                <Button className="btn-gradient-primary">
                  <Plus className="mr-2" size={16} />
                  Create Token
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              className="glass-card p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Tokens</p>
                  <p className="text-2xl font-bold text-white">{tokens.length}</p>
                </div>
                <Coins className="text-token-blue" size={24} />
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Creator Tokens</p>
                  <p className="text-2xl font-bold text-token-purple">
                    {tokens.filter((t: any) => t.balance && Number(t.balance) > 0).length}
                  </p>
                </div>
                <Crown className="text-token-purple" size={24} />
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Est. Portfolio</p>
                  <p className="text-2xl font-bold text-token-green">$--</p>
                </div>
                <DollarSign className="text-token-green" size={24} />
              </div>
            </motion.div>

            <motion.div 
              className="glass-card p-6 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Network</p>
                  <p className="text-lg font-bold text-white">Solana</p>
                </div>
                <div className="w-3 h-3 rounded-full bg-token-green animate-pulse"></div>
              </div>
            </motion.div>
          </div>

          {/* Tab Navigation */}
          <div className="glass-card rounded-xl mb-8">
            <div className="border-b border-white/10">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                {[
                  { id: 'overview', name: 'Token Overview', icon: Coins },
                  { id: 'creator-royalties', name: 'Creator Royalties', icon: Crown },
                  { id: 'trading', name: 'Trading', icon: TrendingUp },
                  { id: 'gamification', name: 'Achievements', icon: Shield },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-token-purple text-token-purple'
                          : 'border-transparent text-white/60 hover:text-white hover:border-white/30'
                      }`}
                    >
                      <Icon size={16} />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {error && (
                    <motion.div 
                      className="bg-red-500/10 border border-red-500/20 rounded-lg p-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-red-400" size={20} />
                        <p className="text-red-400">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-token-purple"></div>
                      <span className="ml-3 text-white/60">Loading your tokens...</span>
                    </div>
                  ) : allTokens.length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                        <Coins className="text-white/40" size={32} />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2">No tokens found</h3>
                      <p className="text-white/60 mb-6">
                        Create your first token to get started with earning fees and royalties.
                      </p>
                      <Link to="/create">
                        <Button className="btn-gradient-primary">
                          <Plus className="mr-2" size={16} />
                          Create Your First Token
                        </Button>
                      </Link>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Your Tokens</h3>
                        <span className="text-white/60 text-sm">{allTokens.length} tokens</span>
                      </div>

                      <div className="grid gap-4">
                        {allTokens.map((token: any, index: number) => (
                          <motion.div
                            key={token.id}
                            className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <div className="flex items-center justify-between">                              <div className="flex items-center space-x-4">
                                <div className="relative">
                                  {token.image ? (
                                    <img
                                      src={token.image}
                                      alt={token.symbol}
                                      className="w-10 h-10 rounded-full mr-3 border-2 border-token-purple object-cover"                                      onError={(e) => {
                                        console.log('Failed to load image:', token.image);
                                        const imgElement = e.currentTarget as HTMLImageElement;
                                        imgElement.style.display = 'none';
                                        const fallbackElement = imgElement.parentElement?.querySelector('.fallback-gradient');
                                        if (fallbackElement instanceof HTMLElement) {
                                          fallbackElement.style.display = 'flex';
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="fallback-gradient w-10 h-10 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center mr-3"
                                    style={{ display: token.image ? 'none' : 'flex', position: token.image ? 'absolute' : 'relative', top: 0, left: 0 }}
                                  >
                                    <span className="text-white font-bold text-xl">
                                      {token.symbol.slice(0, 2).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium">{token.name}</h4>
                                  <p className="text-white/60 text-sm">${token.symbol}</p>
                                  {token.balance && (                                    <div className="space-y-1">
                                      <p className="text-white/80 text-xs">
                                        Balance: {token.balance ? (Number(token.balance) / Math.pow(10, token.decimals)).toLocaleString('en-US', { 
                                          maximumFractionDigits: token.decimals 
                                        }) : '0'}
                                      </p>
                                      {token.description && (
                                        <p className="text-white/60 text-xs italic truncate max-w-[200px]" title={token.description}>
                                          {token.description}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleTokenAction('liquidity', token)}
                                >
                                  <Droplets size={16} className="mr-1" />
                                  Add Liquidity
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openInExplorer(token.mint)}
                                >
                                  <ExternalLink size={16} />
                                </Button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Creator Royalties Tab */}
              {activeTab === 'creator-royalties' && (
                <RoyaltyClaimCard />
              )}

              {/* Trading Tab */}
              {activeTab === 'trading' && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gradient-purple-blue mb-2">
                      Token-2022 Trading Hub
                    </h3>
                    <p className="text-white/70">
                      Trade your tokens with transfer fees on Raydium pools
                    </p>
                  </div>
                  
                  <TradingInterface 
                    defaultTokenA={tokens.length > 0 ? {
                      mint: tokens[0].mint,
                      symbol: tokens[0].symbol,
                      name: tokens[0].name,
                      decimals: tokens[0].decimals,
                      balance: parseFloat(tokens[0].balance || '0'),
                      isToken2022: true,
                      transferFeeBps: tokens[0].plan === 'basic' ? 20 : 
                                    tokens[0].plan === 'enterprise' ? 500 : 0, // Example fee rates
                    } : undefined}
                  />
                  
                  {tokens.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-white/60 mb-4">
                        Create a token first to start trading
                      </p>
                      <Link to="/create">
                        <Button className="btn-gradient-primary">
                          <Plus className="mr-2" size={16} />
                          Create Token
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Gamification Tab */}
              {activeTab === 'gamification' && (
                <GamificationPanel />
              )}
            </div>
          </div>

          {/* Admin Alert */}
          {isAdmin && (
            <motion.div 
              className="glass-card p-4 rounded-xl bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-3">
                <Shield className="text-red-400" size={20} />
                <div>
                  <p className="text-red-400 font-medium">Admin Access Detected</p>
                  <p className="text-white/60 text-sm">
                    You have admin privileges. Access the{' '}
                    <Link to="/admin" className="text-red-400 hover:underline">
                      Admin Dashboard
                    </Link>
                    {' '}to manage treasury fees and platform operations.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LiquidityDialog 
        token={selectedToken!}
        isOpen={isLiquidityModalOpen}
        onClose={() => setIsLiquidityModalOpen(false)}
      />
      <Footer />
    </>
  );
};

export default Dashboard;