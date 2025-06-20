// components/RoyaltyClaimCard.tsx - Enhanced creator royalty claiming (FIXED)

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Coins, AlertCircle, Loader2, RefreshCw, Crown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  claimCreatorRoyalties,
  findAccountsWithWithheldFees 
} from '@/services/solana';
import { 
  TOKEN_2022_PROGRAM_ID,
  getMint,
  getTransferFeeConfig,
} from '@solana/spl-token';
import { RPC_ENDPOINT } from '@/config';

interface CreatorRoyaltyInfo {
  mint: string;
  tokenName: string;
  tokenSymbol: string;
  accumulatedFees: number;
  decimals: number;
  canClaim: boolean;
  feeBasisPoints: number;
  withdrawAuthority: string | null;
  accountsWithFees: number;
  rawWithheldAmount: string;
  isVerifiedCreator: boolean;
}

const DEFAULT_RPC_ENDPOINT = RPC_ENDPOINT;

const RoyaltyClaimCard: React.FC = () => {
  const wallet = useWallet();
  const { toast } = useToast();
  const [royaltyTokens, setRoyaltyTokens] = useState<CreatorRoyaltyInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [totalClaimable, setTotalClaimable] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch tokens where user is the fee recipient (creator royalties)
  const fetchRoyaltyTokens = async (): Promise<void> => {
    if (!wallet.publicKey) return;
    setLoading(true);
    setFetchError(null);
    try {
      const connection = new Connection(DEFAULT_RPC_ENDPOINT, 'confirmed');
      const royaltyTokensList: CreatorRoyaltyInfo[] = [];
      console.log('🔍 Fetching Token-2022 creator royalty tokens for wallet:', wallet.publicKey.toString());
      
      // Get all Token-2022 accounts for this wallet
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet.publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );
      console.log(`📦 Found ${tokenAccounts.value.length} Token-2022 accounts`);
      
      const uniqueMints = new Set<string>();
      tokenAccounts.value.forEach(acc => {
        uniqueMints.add(acc.account.data.parsed.info.mint);
      });

      // Also search for mints where this wallet might be the withdraw authority
      // by checking all Token-2022 mints on chain (this is expensive but thorough)
      console.log('🔍 Also searching for mints where wallet is withdraw authority...');
      
      for (const mintAddress of uniqueMints) {
        try {
          const mint = new PublicKey(mintAddress);
          const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
          
          let feeBasisPoints = 0;
          let withdrawAuthority: string | null = null;
          
          // Use proper SPL Token library function to get transfer fee config
          try {
            const transferFeeConfig = getTransferFeeConfig(mintInfo);
            
            if (transferFeeConfig) {
              withdrawAuthority = transferFeeConfig.withdrawWithheldAuthority?.toString() || null;
              feeBasisPoints = transferFeeConfig.newerTransferFee.transferFeeBasisPoints;
              console.log(`Token ${mintAddress}: withdrawAuth=${withdrawAuthority}, feeBps=${feeBasisPoints}`);
            }
          } catch (extensionError) {
            // Mint doesn't have transfer fee config extension - skip it
            continue;
          }

          // Check if this wallet is the withdraw authority (creator)
          if (withdrawAuthority === wallet.publicKey.toString()) {
            console.log(`✅ Found token where wallet is withdraw authority: ${mintAddress}`);
            
            // Get accounts with withheld fees for this mint
            const accountsWithFees = await findAccountsWithWithheldFees(mint);
            
            // Calculate total withheld amount
            const totalWithheld = accountsWithFees.reduce(
              (sum, acc) => sum + Number(acc.withheldAmount),
              0
            );
            
            // Get token metadata
            let tokenName = `Token ${mintAddress.slice(0, 8)}`;
            let tokenSymbol = mintAddress.slice(0, 6);
            let plan: string | undefined = undefined;
            
            try {
              // Try to get metadata from on-chain first (Token-2022 metadata extension)
              // This should work for tokens created with your app
              
              // Try to get metadata from Helius as fallback
              const metadataResponse = await fetch(DEFAULT_RPC_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 'get-asset',
                  method: 'getAsset',
                  params: { id: mintAddress }
                }),
              });

              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                if (metadataData.result && !metadataData.error) {
                  const asset = metadataData.result;
                  tokenName = asset.content?.metadata?.name || asset.token_info?.name || tokenName;
                  tokenSymbol = asset.content?.metadata?.symbol || asset.token_info?.symbol || tokenSymbol;
                  // Try to get plan from asset.content.metadata or asset.content.json
                  plan = asset.content?.metadata?.plan || asset.content?.json?.plan;
                  // Some tokens may store plan in additionalMetadata as array
                  if (!plan && Array.isArray(asset.content?.metadata?.additionalMetadata)) {
                    const planEntry = asset.content.metadata.additionalMetadata.find((item: any) => item[0] === 'plan');
                    if (planEntry) plan = planEntry[1];
                  }
                  console.log(`Metadata for ${mintAddress}: name=${tokenName}, symbol=${tokenSymbol}, plan=${plan}`);
                }
              }
            } catch (metadataError) {
              console.log('Could not fetch metadata, using defaults');
            }

            // Show all tokens where this wallet is withdraw authority, regardless of plan
            // This is more permissive and will show enterprise tokens + any other tokens
            // where the wallet happens to be the withdraw authority
            const decimals = mintInfo.decimals;
            const tokenInfo: CreatorRoyaltyInfo = {
              mint: mintAddress,
              tokenName,
              tokenSymbol,
              accumulatedFees: totalWithheld / Math.pow(10, decimals),
              decimals,
              canClaim: totalWithheld > 0,
              feeBasisPoints,
              withdrawAuthority,
              accountsWithFees: accountsWithFees.length,
              rawWithheldAmount: totalWithheld.toString(),
              isVerifiedCreator: plan === 'enterprise' // Mark as verified only if enterprise
            };
            
            royaltyTokensList.push(tokenInfo);
            console.log(`💰 Creator token ${tokenSymbol}: ${totalWithheld / Math.pow(10, decimals)} fees accumulated across ${accountsWithFees.length} accounts (plan: ${plan || 'unknown'})`);
          }
        } catch (error) {
          console.error('Error checking mint', mintAddress, error);
        }
      }
      
      setRoyaltyTokens(royaltyTokensList);
      
      // Log out all found royalty tokens for debugging
      console.log('📊 Found royalty tokens:', royaltyTokensList.map((t: CreatorRoyaltyInfo) => ({
        name: t.tokenName,
        symbol: t.tokenSymbol,
        withdrawAuth: t.withdrawAuthority,
        feeBps: t.feeBasisPoints,
        fees: t.accumulatedFees,
        accounts: t.accountsWithFees,
        isVerified: t.isVerifiedCreator
      })));
      
      // Calculate total claimable amount
      const total = royaltyTokensList.reduce((sum: number, token: CreatorRoyaltyInfo) => sum + token.accumulatedFees, 0);
      setTotalClaimable(total);
      console.log(`🎉 Found ${royaltyTokensList.length} creator tokens with royalties totaling ${total}`);
      
    } catch (error) {
      let message = 'Could not fetch your creator royalty information';
      if ((error as any)?.message?.includes('403')) {
        message = 'Access forbidden (403): Your RPC endpoint or API key may be invalid or rate-limited.';
      } else if ((error as any)?.message?.includes('429')) {
        message = 'Rate limited: Please try again in a moment.';
      }
      setFetchError(message);
      setRoyaltyTokens([]);
      setTotalClaimable(0);
      console.error('Error fetching creator royalty tokens:', error);
      toast({
        title: 'Error loading creator royalties',
        description: message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // FIXED: Remove the invalid fetchCreatorTokens call and use fetchRoyaltyTokens
  useEffect(() => {
    if (wallet.publicKey) {
      fetchRoyaltyTokens();
    } else {
      // Reset state when wallet disconnects
      setRoyaltyTokens([]);
      setTotalClaimable(0);
      setLoading(false);
    }
  }, [wallet.publicKey]);

  const handleRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await fetchRoyaltyTokens();
  };

  const claimRoyalties = async (tokenInfo: CreatorRoyaltyInfo): Promise<void> => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      toast({
        title: 'Wallet not connected',
        description: 'Please connect a wallet to claim royalties',
        variant: 'destructive'
      });
      return;
    }
    if (!tokenInfo || !tokenInfo.mint) {
      toast({
        title: 'Invalid token',
        description: 'Token information is missing or invalid',
        variant: 'destructive'
      });
      return;
    }
    
    // Check if user has enough SOL for the claiming fee (0.005 SOL + transaction fees)
    const connection = new Connection(DEFAULT_RPC_ENDPOINT, 'confirmed');
    const balance = await connection.getBalance(wallet.publicKey);
    const requiredBalance = 0.005 * 1e9 + 0.001 * 1e9; // 0.005 SOL fee + ~0.001 SOL for transaction fees
    
    if (balance < requiredBalance) {
      toast({
        title: 'Insufficient SOL Balance',
        description: 'You need at least 0.006 SOL to claim royalties (0.005 SOL claiming fee + transaction fees)',
        variant: 'destructive'
      });
      return;
    }

    setClaiming(tokenInfo.mint);
    try {
      console.log(`🎯 Starting claim process for ${tokenInfo.tokenSymbol} (${tokenInfo.mint})`);
      console.log(`💰 Expected to claim: ${tokenInfo.accumulatedFees} ${tokenInfo.tokenSymbol}`);
      console.log(`🏦 Claiming fee: 0.005 SOL will be charged`);

      const result = await claimCreatorRoyalties(
        wallet,
        new PublicKey(tokenInfo.mint),
        true // isMainnet
      );
      
      if (result.success) {
        const claimedAmount = (result.totalClaimed || 0) / Math.pow(10, tokenInfo.decimals);
        toast({
          title: '🎉 Creator Royalties Claimed!',
          description: `Successfully claimed ${claimedAmount.toFixed(6)} ${tokenInfo.tokenSymbol} royalties. Claiming fee: 0.005 SOL`,
          variant: 'default'
        });
        
        console.log(`✅ Claim successful! Transaction: ${result.signature}`);
        console.log(`📊 Amount claimed: ${claimedAmount} ${tokenInfo.tokenSymbol}`);
        
        // Refresh the data after claiming
        await fetchRoyaltyTokens();
      } else {
        console.error('❌ Claim failed:', result.error);
        toast({
          title: 'Claim Failed',
          description: result.error || 'Could not claim royalties. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('💥 Error claiming creator royalties:', error);
      toast({
        title: 'Claim Failed',
        description: (error as any).message || 'Could not claim royalties. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setClaiming(null);
    }
  };

  const claimAllRoyalties = async (): Promise<void> => {
    const claimableTokens = royaltyTokens.filter((t: CreatorRoyaltyInfo) => t.canClaim);
    for (const token of claimableTokens) {
      await claimRoyalties(token);
      // Add delay between claims to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  };

  if (!wallet.publicKey) {
    return <></>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Crown className="text-token-purple" size={24} />
            Your Creator Royalties
          </h3>
          <p className="text-white/60 text-sm mt-1">
            Token-2022 creator royalties from your tokens
          </p>
          <p className="text-white/40 text-xs mt-1">
            ⚡ Claiming fee: 0.005 SOL per transaction
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
          {totalClaimable > 0 && (
            <Button
              onClick={claimAllRoyalties}
              disabled={claiming !== null}
              className="bg-token-purple hover:bg-token-purple/80"
              size="sm"
            >
              Claim All
            </Button>
          )}
        </div>
      </div>

      {fetchError ? (
        <div className="text-center py-8">
          <AlertCircle className="text-red-400 mx-auto mb-2" size={32} />
          <p className="text-red-400 mb-2">{fetchError}</p>
          <p className="text-white/40 text-sm">Please check your connection and try again.</p>
          <Button onClick={handleRefresh} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-token-purple mx-auto mb-2" />
          <p className="text-white/60">Loading your creator royalties...</p>
        </div>
      ) : royaltyTokens.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
            <Crown className="text-white/40" size={32} />
          </div>
          <h4 className="text-white font-medium mb-2">No creator tokens found</h4>
          <p className="text-white/60 text-sm">
            Create enterprise tokens with custom royalties to earn creator fees
          </p>
          <p className="text-white/40 text-xs mt-2">
            Or your tokens may not have any transfer fees accumulated yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-r from-token-purple/20 to-token-blue/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white/80 text-sm">Total Claimable</span>
                  <p className="text-2xl font-bold text-gradient-purple-blue">
                    {totalClaimable.toFixed(6)}
                  </p>
                  <p className="text-xs text-white/60">Tokens</p>
                </div>
                <Coins className="text-token-purple" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-token-green/20 to-token-blue/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white/80 text-sm">Creator Tokens</span>
                  <p className="text-2xl font-bold text-token-green">
                    {royaltyTokens.length}
                  </p>
                  <p className="text-xs text-white/60">Active</p>
                </div>
                <TrendingUp className="text-token-green" size={24} />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white/80 text-sm">Verified</span>
                  <p className="text-2xl font-bold text-orange-400">
                    {royaltyTokens.filter(t => t.isVerifiedCreator).length}
                  </p>
                  <p className="text-xs text-white/60">Enterprise</p>
                </div>
                <Crown className="text-orange-400" size={24} />
              </div>
            </div>
          </div>

          {/* Token List */}
          {royaltyTokens.map((token: CreatorRoyaltyInfo) => (
            <motion.div
              key={token.mint}
              className={`bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors border ${
                token.isVerifiedCreator ? 'border-token-purple/30' : 'border-white/10'
              }`}
              whileHover={{ scale: 1.01 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-white font-medium">{token.tokenName}</h4>
                    <span className="text-white/60 text-sm">{token.tokenSymbol}</span>
                    {token.isVerifiedCreator && (
                      <div className="flex items-center gap-1">
                        <Crown className="text-token-purple" size={16} />
                        <span className="text-xs text-token-purple">Enterprise</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Royalty Rate:</span>
                      <p className="text-token-purple font-medium">
                        {(token.feeBasisPoints / 100).toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Fee Accounts:</span>
                      <p className="text-white">{token.accountsWithFees}</p>
                    </div>
                    <div>
                      <span className="text-white/60">Available:</span>
                      <p className="text-white font-medium">
                        {token.accumulatedFees.toFixed(6)} {token.tokenSymbol}
                      </p>
                    </div>
                    <div>
                      <span className="text-white/60">Status:</span>
                      <p className={token.canClaim ? "text-token-green" : "text-white/60"}>
                        {token.canClaim ? "Ready to claim" : "No fees"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  {token.canClaim ? (
                    <div className="space-y-2">
                      <p className="text-xs text-white/60">Fee: 0.005 SOL</p>
                      <Button
                        onClick={() => claimRoyalties(token)}
                        disabled={claiming === token.mint}
                        className="bg-token-purple hover:bg-token-purple/80 w-full"
                      >
                        {claiming === token.mint ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : null}
                        Claim
                      </Button>
                    </div>
                  ) : (
                    <Button disabled variant="outline" size="sm">
                      No Fees
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RoyaltyClaimCard;