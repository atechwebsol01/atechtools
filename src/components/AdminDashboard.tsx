// MAINNET-READY: This component is configured for Solana mainnet-beta. All endpoints and program IDs are set via config.
// components/AdminDashboard.tsx - Treasury Fee Management Dashboard (COMPLETE ENHANCED VERSION)

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  DollarSign, 
  TrendingUp, 
  Users, 
  RefreshCw, 
  Download,
  AlertCircle,
  Loader2,
  Crown,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  Clock,
  Coins
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  claimTreasuryFees
} from '@/services/solana';
import { 
  isAdminWallet, 
  TREASURY_WALLET
} from '@/config';
import { truncateAddress } from '@/lib/utils';
import axios from 'axios';
import { HELIUS_API_URL } from '@/config';

// Define TokenDBEntry and TreasuryFeeInfo interfaces
interface TokenDBEntry {
  id: number;
  mint_address: string;
  creator_wallet: string;
  plan: 'basic' | 'advanced' | 'enterprise';
  created_at: string;
}

interface TreasuryFeeInfo {
  mint: string;
  plan: 'basic' | 'advanced' | 'enterprise';
  creator: string;
  createdAt: string;
  totalFees: number;
  accountsWithFees: number;
  canClaim: boolean;
  tokenName: string;
  tokenSymbol: string;
  lastChecked?: Date;
  claimHistory?: Array<{
    date: Date;
    amount: number;
    signature: string;
  }>;
}

interface AdminStats {
  totalTokensCreated: number;
  totalFeesCollected: number;
  monthlyRevenue: number;
  activeTokens: number;
  totalUsers: number;
  basicTierCount: number;
  advancedTierCount: number;
  enterpriseTierCount: number;
}

const AdminDashboard: React.FC = () => {
  const wallet = useWallet();
  const { toast } = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [treasuryTokens, setTreasuryTokens] = useState<TreasuryFeeInfo[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalTokensCreated: 0,
    totalFeesCollected: 0,
    monthlyRevenue: 0,
    activeTokens: 0,
    totalUsers: 0,
    basicTierCount: 0,
    advancedTierCount: 0,
    enterpriseTierCount: 0,
  });
  const [claiming, setClaiming] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Check admin access
  const isAdmin = wallet.publicKey ? isAdminWallet(wallet.publicKey.toString()) : false;

  // Helper to fetch token metadata from Helius DAS API
  const fetchTokenMetadata = async (mint: string) => {
    try {
      const HELIUS_RPC_URL = HELIUS_API_URL;
      const response = await fetch(HELIUS_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'get-asset',
          method: 'getAsset',
          params: { id: mint }
        }),
      });
      
      if (response.ok) {
        const metadataData = await response.json();
        if (metadataData.result && !metadataData.error) {
          const asset = metadataData.result;
          return {
            name: asset.content?.metadata?.name || asset.token_info?.name || '',
            symbol: asset.content?.metadata?.symbol || asset.token_info?.symbol || '',
          };
        }
      }
    } catch (err) {
      console.log('Metadata fetch failed for mint:', mint, err);
    }
    return { name: '', symbol: '' };
  };

  // Fetch admin data
  const fetchAdminData = async () => {
    if (!isAdmin || !wallet.publicKey) return;

    setLoading(true);
    setFetchError(null);
    
    try {
      console.log('🔄 Fetching admin data...');
      const res = await axios.get('/tokens.php');
      const tokens: TokenDBEntry[] = res.data.tokens || [];
      
      if (!Array.isArray(tokens)) {
        throw new Error('Invalid response format from backend');
      }

      console.log(`📊 Found ${tokens.length} tokens in database`);
      
      // Fetch metadata for each mint in parallel with error handling
      const metadataResults = await Promise.allSettled(
        tokens.map(t => fetchTokenMetadata(t.mint_address))
      );

      // Calculate tier statistics
      const basicCount = tokens.filter(t => t.plan === 'basic').length;
      const advancedCount = tokens.filter(t => t.plan === 'advanced').length;
      const enterpriseCount = tokens.filter(t => t.plan === 'enterprise').length;

      // Map backend tokens to TreasuryFeeInfo with enhanced data
      const treasuryTokens: TreasuryFeeInfo[] = tokens.map((t, i) => {
        const metadataResult = metadataResults[i];
        const metadata = metadataResult.status === 'fulfilled' 
          ? metadataResult.value 
          : { name: '', symbol: '' };

        return {
          mint: t.mint_address,
          plan: t.plan,
          creator: t.creator_wallet,
          createdAt: t.created_at,
          totalFees: 0, // Will be updated when checking individual tokens
          accountsWithFees: 0, // Will be updated when checking individual tokens
          canClaim: t.plan === 'basic', // Only BASIC tokens have claimable treasury fees
          tokenName: metadata.name || `Token ${t.mint_address.slice(0, 8)}`,
          tokenSymbol: metadata.symbol || t.mint_address.slice(0, 6).toUpperCase(),
          lastChecked: undefined,
          claimHistory: []
        };
      });

      setTreasuryTokens(treasuryTokens);
      setAdminStats(prev => ({
        ...prev,
        totalTokensCreated: tokens.length,
        basicTierCount: basicCount,
        advancedTierCount: advancedCount,
        enterpriseTierCount: enterpriseCount,
        activeTokens: treasuryTokens.filter(t => t.canClaim).length
      }));

      setLastRefresh(new Date());
      console.log('✅ Admin data loaded successfully');

    } catch (error) {
      console.error('❌ Failed to fetch admin data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setFetchError(errorMessage);
      
      toast({
        title: 'Error Loading Data',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
  };

  // Claim fees for specific token
  const handleClaimFees = async (token: TreasuryFeeInfo) => {
    if (!wallet.publicKey || !isAdmin) {
      toast({
        title: 'Unauthorized',
        description: 'Admin access required',
        variant: 'destructive'
      });
      return;
    }

    if (!token.canClaim) {
      toast({
        title: 'Cannot Claim',
        description: 'This token type does not have treasury fees. Only BASIC tier tokens collect fees for the treasury.',
        variant: 'destructive'
      });
      return;
    }

    setClaiming(token.mint);
    
    try {
      console.log(`🏛️ Admin claiming treasury fees for ${token.tokenSymbol} (${token.mint})`);
      
      const result = await claimTreasuryFees(
        wallet,
        new PublicKey(token.mint),
        true // isMainnet
      );

      if (result.success) {
        const claimedAmount = (result.totalClaimed || 0);
        const claimedDisplay = claimedAmount > 0 
          ? `${claimedAmount} raw units` 
          : 'fees collected';

        toast({
          title: '🎉 Treasury Fees Claimed Successfully!',
          description: `Claimed ${claimedDisplay} from ${token.tokenSymbol}. Transaction: ${result.signature?.slice(0, 8)}...`,
          variant: 'default'
        });
        
        console.log(`✅ Treasury claim successful! Transaction: ${result.signature}`);
        console.log(`💰 Amount claimed: ${claimedAmount} raw units`);
        
        // Update the token's last checked time and claim history
        setTreasuryTokens(prev => prev.map(t => 
          t.mint === token.mint 
            ? {
                ...t,
                lastChecked: new Date(),
                claimHistory: [
                  ...(t.claimHistory || []),
                  {
                    date: new Date(),
                    amount: claimedAmount,
                    signature: result.signature || ''
                  }
                ].slice(-5) // Keep only last 5 claims
              }
            : t
        ));
        
        // Refresh data to get updated fee amounts
        setTimeout(() => {
          fetchAdminData();
        }, 2000);
        
      } else {
        console.error('❌ Treasury claim failed:', result.error);
        toast({
          title: 'Treasury Claim Failed',
          description: result.error || 'Failed to claim treasury fees. This may be because no fees have accumulated yet.',
          variant: 'destructive'
        });
      }
    } catch (error: any) {
      console.error('💥 Error claiming treasury fees:', error);
      
      let errorMessage = 'An unexpected error occurred';
      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient SOL for transaction fees';
      } else if (error.message?.includes('not have treasury as withdraw authority')) {
        errorMessage = 'This token does not collect fees for the treasury';
      } else if (error.message?.includes('No accounts with withheld fees')) {
        errorMessage = 'No fees available to claim for this token yet';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: 'Treasury Claim Failed',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setClaiming(null);
    }
  };

  // Claim all selected fees
  const handleClaimAllSelected = async () => {
    if (selectedTokens.size === 0) {
      toast({
        title: 'No Tokens Selected',
        description: 'Please select tokens to claim fees from',
        variant: 'destructive'
      });
      return;
    }

    const tokensToProcess = treasuryTokens.filter(token => 
      selectedTokens.has(token.mint) && token.canClaim
    );

    if (tokensToProcess.length === 0) {
      toast({
        title: 'No Claimable Tokens',
        description: 'Selected tokens do not have claimable treasury fees',
        variant: 'destructive'
      });
      return;
    }

    console.log(`🔄 Processing ${tokensToProcess.length} treasury fee claims...`);

    toast({
      title: 'Batch Claiming Started',
      description: `Processing ${tokensToProcess.length} tokens. This may take a few minutes.`,
    });

    let successCount = 0;
    let failCount = 0;

    for (const token of tokensToProcess) {
      try {
        await handleClaimFees(token);
        successCount++;
        // Add delay between claims to avoid overwhelming the network
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        failCount++;
        console.error(`Failed to claim fees for ${token.tokenSymbol}:`, error);
      }
    }

    setSelectedTokens(new Set());

    toast({
      title: 'Batch Claiming Complete',
      description: `Successfully claimed from ${successCount} tokens. ${failCount} failed.`,
      variant: successCount > 0 ? 'default' : 'destructive'
    });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Address copied successfully',
      });
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  // Toggle token selection
  const toggleTokenSelection = (mint: string) => {
    const newSelection = new Set(selectedTokens);
    if (newSelection.has(mint)) {
      newSelection.delete(mint);
    } else {
      newSelection.add(mint);
    }
    setSelectedTokens(newSelection);
  };

  // Select all claimable tokens
  const selectAllClaimable = () => {
    const claimableTokens = treasuryTokens.filter(t => t.canClaim);
    setSelectedTokens(new Set(claimableTokens.map(t => t.mint)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedTokens(new Set());
  };

  // Load data on mount
  useEffect(() => {
    if (isAdmin && wallet.publicKey) {
      fetchAdminData();
    }
  }, [isAdmin, wallet.publicKey]);

  // Access control
  if (!wallet.publicKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-token-purple/5">
        <div className="glass-card p-8 rounded-xl text-center max-w-md">
          <Shield className="text-token-purple mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Admin Access Required</h2>
          <p className="text-white/60 mb-4">Please connect your admin wallet to access the treasury dashboard</p>
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Crown size={16} />
            <span>Administrative privileges required</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-token-purple/5">
        <div className="glass-card p-8 rounded-xl text-center max-w-md">
          <AlertCircle className="text-red-400 mx-auto mb-4" size={48} />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-white/60 mb-4">Your wallet is not authorized for admin access</p>
          <div className="bg-white/5 rounded-lg p-3 mb-4">
            <p className="text-white/40 text-sm">Connected wallet:</p>
            <p className="text-white/80 font-mono text-sm">{truncateAddress(wallet.publicKey.toString())}</p>
          </div>
          <p className="text-white/40 text-xs">Contact system administrator if you believe this is an error</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-token-purple/5">
        <div className="glass-card p-8 rounded-xl text-center max-w-md">
          <Loader2 className="text-token-purple mx-auto mb-4 animate-spin" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Loading Admin Dashboard</h2>
          <p className="text-white/60 mb-4">Fetching treasury data and token information...</p>
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm">
            <Clock size={16} />
            <span>This may take a moment</span>
          </div>
        </div>
      </div>
    );
  }

  // Calculate derived stats
  const claimableTokensCount = treasuryTokens.filter(token => token.canClaim).length;
  const selectedClaimableCount = treasuryTokens.filter(token => 
    selectedTokens.has(token.mint) && token.canClaim
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-token-purple/5">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <Crown className="text-token-purple mr-3" size={32} />
            <div>
              <h1 className="text-3xl font-bold text-gradient-purple-blue">Admin Dashboard</h1>
              <p className="text-white/60">Treasury & Fee Management System</p>
              {lastRefresh && (
                <p className="text-white/40 text-xs mt-1">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              variant="outline"
              size="sm"
            >
              {showSensitiveData ? <EyeOff size={16} /> : <Eye size={16} />}
              {showSensitiveData ? 'Hide' : 'Show'} Details
            </Button>
            
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {fetchError && (
          <motion.div 
            className="glass-card p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="text-red-400" size={20} />
              <div>
                <p className="text-red-400 font-medium">Data Loading Error</p>
                <p className="text-white/60 text-sm">{fetchError}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <motion.div 
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Tokens</p>
                <p className="text-2xl font-bold text-white">
                  {showSensitiveData ? adminStats.totalTokensCreated.toLocaleString() : '•••••'}
                </p>
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
                <p className="text-white/60 text-sm">BASIC Tier</p>
                <p className="text-2xl font-bold text-token-green">
                  {adminStats.basicTierCount}
                </p>
                <p className="text-xs text-white/60">Treasury fees</p>
              </div>
              <DollarSign className="text-token-green" size={24} />
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
                <p className="text-white/60 text-sm">ADVANCED</p>
                <p className="text-2xl font-bold text-token-purple">
                  {adminStats.advancedTierCount}
                </p>
                <p className="text-xs text-white/60">No fees</p>
              </div>
              <TrendingUp className="text-token-purple" size={24} />
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
                <p className="text-white/60 text-sm">ENTERPRISE</p>
                <p className="text-2xl font-bold text-token-yellow">
                  {adminStats.enterpriseTierCount}
                </p>
                <p className="text-xs text-white/60">Creator royalties</p>
              </div>
              <Crown className="text-token-yellow" size={24} />
            </div>
          </motion.div>

          <motion.div 
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Claimable</p>
                <p className="text-2xl font-bold text-token-green">
                  {claimableTokensCount}
                </p>
                <p className="text-xs text-white/60">Can collect fees</p>
              </div>
              <Download className="text-token-green" size={24} />
            </div>
          </motion.div>

          <motion.div 
            className="glass-card p-6 rounded-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active Users</p>
                <p className="text-2xl font-bold text-white">
                  {showSensitiveData ? adminStats.totalUsers.toLocaleString() : '••••'}
                </p>
              </div>
              <Users className="text-token-blue" size={24} />
            </div>
          </motion.div>
        </div>

        {/* Treasury Info */}
        <motion.div 
          className="glass-card p-6 rounded-xl mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Shield className="mr-2" size={20} />
            Treasury Configuration
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/80">Treasury Wallet:</span>
              <div className="flex items-center">
                <span className="text-white font-mono text-sm mr-2">
                  {showSensitiveData ? truncateAddress(TREASURY_WALLET) : '••••••••'}
                </span>
                {showSensitiveData && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(TREASURY_WALLET)}
                  >
                    <Copy size={14} />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/80">Connected Admin:</span>
              <span className="text-token-green font-mono text-sm">
                {truncateAddress(wallet.publicKey!.toString())}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-white/80">System Status:</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="text-token-green" size={16} />
                <span className="text-token-green text-sm">Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fee Collection Interface */}
        <motion.div 
          className="glass-card p-6 rounded-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white mb-4 md:mb-0">Treasury Fee Collection</h3>
            
            <div className="flex flex-wrap items-center gap-3">
              {claimableTokensCount > 0 && (
                <>
                  <Button
                    onClick={selectAllClaimable}
                    variant="outline"
                    size="sm"
                  >
                    Select All ({claimableTokensCount})
                  </Button>
                  
                  {selectedTokens.size > 0 && (
                    <Button
                      onClick={clearSelection}
                      variant="outline"
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                  )}
                </>
              )}
              
              {selectedTokens.size > 0 && (
                <div className="flex items-center gap-3">
                  <span className="text-white/60 text-sm">
                    {selectedClaimableCount} selected
                  </span>
                  <Button
                    onClick={handleClaimAllSelected}
                    disabled={claiming !== null || selectedClaimableCount === 0}
                    className="bg-token-green hover:bg-token-green/80"
                    size="sm"
                  >
                    {claiming ? 'Processing...' : `Claim Selected (${selectedClaimableCount})`}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {treasuryTokens.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="text-white/40 mx-auto mb-4" size={48} />
              <h4 className="text-white/60 font-medium mb-2">No Tokens Found</h4>
              <p className="text-white/40 text-sm">
                Basic tier tokens will appear here when they are created
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {treasuryTokens.map((token) => (
                <motion.div
                  key={token.mint}
                  className={`rounded-lg p-4 transition-colors ${
                    token.canClaim 
                      ? 'bg-white/5 hover:bg-white/10 border border-token-green/20' 
                      : 'bg-white/2 opacity-60 border border-white/10'
                  }`}
                  whileHover={token.canClaim ? { scale: 1.01 } : {}}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {token.canClaim && (
                        <input
                          type="checkbox"
                          checked={selectedTokens.has(token.mint)}
                          onChange={() => toggleTokenSelection(token.mint)}
                          className="mr-3 w-4 h-4 text-token-purple"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-white font-medium flex items-center flex-wrap gap-2 mb-1">
                          <span>{token.tokenName}</span>
                          <span className="text-white/60">({token.tokenSymbol})</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            token.plan === 'basic' 
                              ? 'bg-token-green/20 text-token-green' 
                              : token.plan === 'advanced'
                                ? 'bg-token-purple/20 text-token-purple'
                                : 'bg-token-yellow/20 text-token-yellow'
                          }`}>
                            {token.plan.toUpperCase()}
                          </span>
                          {!token.canClaim && (
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-400">
                              No Treasury Fees
                            </span>
                          )}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-white/60">
                            Creator: {showSensitiveData ? truncateAddress(token.creator) : '••••••••'}
                          </p>
                          <p className="text-white/40">
                            Created: {new Date(token.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <p className="text-xs text-white/40 font-mono">
                            {showSensitiveData ? truncateAddress(token.mint) : '••••••••'}
                          </p>
                          {token.lastChecked && (
                            <span className="text-xs text-white/40">
                              Last checked: {token.lastChecked.toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        
                        {token.claimHistory && token.claimHistory.length > 0 && (
                          <div className="mt-2 text-xs text-white/40">
                            Last claim: {token.claimHistory[token.claimHistory.length - 1].amount} units
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right ml-4">
                      <p className="text-sm text-white/60 mb-2">
                        {token.canClaim ? 'Treasury fees available' : 'Creator royalties only'}
                      </p>
                      <Button
                        onClick={() => handleClaimFees(token)}
                        disabled={!token.canClaim || claiming === token.mint}
                        size="sm"
                        className={token.canClaim ? 'bg-token-purple hover:bg-token-purple/80' : ''}
                        variant={token.canClaim ? 'default' : 'outline'}
                      >
                        {claiming === token.mint ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-1" />
                            Claiming...
                          </>
                        ) : token.canClaim ? (
                          'Check & Claim'
                        ) : (
                          'Not Available'
                        )}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Help Text */}
          <div className="mt-6 p-4 bg-token-blue/10 rounded-lg border border-token-blue/20">
            <div className="flex items-start gap-2">
              <AlertCircle className="text-token-blue mt-0.5 flex-shrink-0" size={16} />
              <div className="text-sm text-white/70">
                <p className="font-medium text-white/90 mb-2">Treasury Fee Collection System:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-1 text-xs">
                    <li>• <strong>BASIC tier</strong>: 0.2% fees → treasury wallet</li>
                    <li>• <strong>ADVANCED tier</strong>: No fees (free tier)</li>
                    <li>• <strong>ENTERPRISE tier</strong>: Custom royalties → creator</li>
                  </ul>
                  <ul className="space-y-1 text-xs">
                    <li>• Fees accumulate in token accounts from transfers</li>
                    <li>• Two-step process: harvest → withdraw to treasury</li>
                    <li>• Click "Check & Claim" to collect available fees</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;