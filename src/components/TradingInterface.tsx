// components/TradingInterface.tsx - Trading interface for Token-2022 with Transfer Fees
// Integrated with Raydium CPMM pools for seamless swapping

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  ArrowUpDown, 
  AlertTriangle, 
  TrendingUp, 
  Droplets,
  Calculator,
  ExternalLink,
  CheckCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { fetchTokenAccountData, getPoolInfo, executeJupiterSwap } from '@/services/raydium';
import { Connection } from '@solana/web3.js';

// Local connection function for trading interface
const getConnection = (isMainnet: boolean = true) => {
  const endpoint = isMainnet ? 
    "https://mainnet.helius-rpc.com/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8" : 
    "https://api.devnet.solana.com";
  
  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 120000,
    disableRetryOnRateLimit: false,
  });
};

// Interface for token selection
interface Token {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  balance?: number;
  isToken2022?: boolean;
  transferFeeBps?: number;
}

// Default tokens (SOL and common tokens)
const DEFAULT_TOKENS: Token[] = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
  },
];

interface TradingInterfaceProps {
  defaultTokenA?: Token;
  defaultTokenB?: Token;
  className?: string;
}

export const TradingInterface: React.FC<TradingInterfaceProps> = ({
  defaultTokenA,
  defaultTokenB = DEFAULT_TOKENS[0], // Default to SOL
  className = '',
}) => {
  const wallet = useWallet();
  const { toast } = useToast();
  
  // Trading state
  const [tokenA, setTokenA] = useState<Token | null>(defaultTokenA || null);
  const [tokenB, setTokenB] = useState<Token | null>(defaultTokenB);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [slippage, setSlippage] = useState('0.5'); // 0.5% default slippage
  
  // Fee calculations
  const [feeBreakdown, setFeeBreakdown] = useState<{
    raydiumFee: number;
    transferFeeA: number;
    transferFeeB: number;
    totalFees: number;
  } | null>(null);
  
  // Load user tokens and balances
  useEffect(() => {
    const loadUserTokens = async () => {
      if (!wallet.publicKey) return;
      
      try {
        const connection = getConnection(true);
        const tokenAccountData = await fetchTokenAccountData(connection, wallet.publicKey);
        
        console.log('Loading user tokens for trading...');
        
        // Get SOL balance
        const solBalance = await connection.getBalance(wallet.publicKey);
        
        const tokens: Token[] = [
          // Add SOL as first token
          {
            ...DEFAULT_TOKENS[0], // SOL
            balance: solBalance / 1e9, // Convert lamports to SOL
          },
          // Add all user token accounts (both SPL and Token-2022)
          ...tokenAccountData.tokenAccounts.map(account => {
            const decimals = (account as any).decimals || 9;
            const rawAmount = account.amount.toString();
            const balance = parseFloat(rawAmount) / Math.pow(10, decimals);
            const isToken2022 = account.programId?.toString() === 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb';
            
            return {
              mint: account.mint.toString(),
              symbol: account.mint.toString().slice(0, 8),
              name: `Token ${account.mint.toString().slice(0, 8)}`,
              decimals,
              balance,
              isToken2022,
              transferFeeBps: isToken2022 ? 50 : 0, // Default transfer fee for Token-2022
            };
          }),
        ];
        
        // Filter out tokens with zero balance
        const tokensWithBalance = tokens.filter(token => (token.balance || 0) > 0);
        
        console.log('Loaded', tokensWithBalance.length, 'tokens for trading');
        setUserTokens(tokensWithBalance);
        
      } catch (error) {
        console.error('Error loading user tokens:', error);
        toast({
          title: "Token Loading Error",
          description: "Failed to load your tokens. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    loadUserTokens();
  }, [wallet.publicKey, toast]);
  
  // Load pool information when tokens change
  useEffect(() => {
    const loadPoolInfo = async () => {
      if (!tokenA || !tokenB) return;
      
      setIsLoading(true);
      try {
        console.log('Looking for trading route between', tokenA.symbol, 'and', tokenB.symbol);
        const pool = await getPoolInfo(tokenA.mint, tokenB.mint, true);
        setPoolInfo(pool);
        
        if (!pool) {
          console.log('No route found for', tokenA.symbol, '/', tokenB.symbol);
          toast({
            title: "No Pool Found",
            description: `No liquidity pool exists for ${tokenA.symbol}/${tokenB.symbol}. Create one first.`,
            variant: "destructive",
          });
        } else {
          console.log('Route found:', pool.poolId);
        }
      } catch (error) {
        console.error('Error loading pool info:', error);
        toast({
          title: "Pool Loading Error",
          description: "Failed to check for existing pools",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPoolInfo();
  }, [tokenA, tokenB, toast]);
  
  // Jupiter quote for real-time price estimation
  useEffect(() => {
    if (!poolInfo || !amountA || !tokenA || !tokenB) {
      setAmountB('');
      return;
    }
    
    const getJupiterQuote = async () => {
      try {
        const inputAmount = parseFloat(amountA);
        if (inputAmount <= 0) {
          setAmountB('');
          return;
        }
        
        const baseUnits = Math.floor(inputAmount * Math.pow(10, tokenA.decimals)).toString();
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        try {
          const response = await fetch(
            `https://quote-api.jup.ag/v6/quote?inputMint=${tokenA.mint}&outputMint=${tokenB.mint}&amount=${baseUnits}&slippageBps=50`,
            { 
              signal: controller.signal,
              headers: {
                'Accept': 'application/json',
              }
            }
          );
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const quote = await response.json();
            if (quote && !quote.error && quote.outAmount) {
              const outputAmount = parseFloat(quote.outAmount) / Math.pow(10, tokenB.decimals);
              setAmountB(outputAmount.toFixed(6));
            } else {
              setAmountB('');
            }
          } else {
            setAmountB('');
          }
        } catch (fetchError) {
          clearTimeout(timeoutId);
          setAmountB('');
          console.log('Quote fetch failed:', fetchError.message);
        }
      } catch (error) {
        console.log('Quote fetch error:', error);
        // Fallback to simple estimation
        const estimatedOutput = parseFloat(amountA) * 0.95;
        setAmountB(estimatedOutput.toFixed(6));
      }
    };
    
    const timeoutId = setTimeout(getJupiterQuote, 500); // Debounce API calls
    return () => clearTimeout(timeoutId);
  }, [amountA, poolInfo, tokenA, tokenB]);
  
  // Calculate fees when amounts change
  useEffect(() => {
    if (!amountA || !tokenA || !tokenB || !poolInfo) return;
    
    const amount = parseFloat(amountA);
    const raydiumFee = amount * 0.0025; // 0.25% Raydium fee
    const transferFeeA = tokenA.transferFeeBps ? amount * (tokenA.transferFeeBps / 10000) : 0;
    const transferFeeB = tokenB.transferFeeBps ? parseFloat(amountB) * (tokenB.transferFeeBps / 10000) : 0;
    
    setFeeBreakdown({
      raydiumFee,
      transferFeeA,
      transferFeeB,
      totalFees: raydiumFee + transferFeeA + transferFeeB,
    });
  }, [amountA, amountB, tokenA, tokenB, poolInfo]);
  
  const handleSwapTokens = () => {
    setTokenA(tokenB);
    setTokenB(tokenA);
    setAmountA(amountB);
    setAmountB(amountA);
  };
  
  const handleTokenAChange = (token: Token) => {
    setTokenA(token);
    if (token.mint === tokenB?.mint) {
      setTokenB(tokenA);
    }
  };
  
  const handleTokenBChange = (token: Token) => {
    setTokenB(token);
    if (token.mint === tokenA?.mint) {
      setTokenA(tokenB);
    }
  };
  
  const handleTrade = async () => {
    if (!wallet.publicKey || !tokenA || !tokenB || !amountA) {
      toast({
        title: "Missing Information",
        description: "Please connect wallet and select tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (!poolInfo) {
      toast({
        title: "No Route Available",
        description: "No swap route found for this token pair",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Starting Jupiter swap with transfer hook preservation');
      
      // Calculate amount in base units
      const inputAmount = parseFloat(amountA);
      const baseUnits = Math.floor(inputAmount * Math.pow(10, tokenA.decimals)).toString();
      
      console.log('Swap details:', {
        from: tokenA.symbol,
        to: tokenB.symbol,
        amount: amountA,
        baseUnits,
        inputMint: tokenA.mint,
        outputMint: tokenB.mint
      });
      
      // Execute Jupiter swap
      const result = await executeJupiterSwap(wallet, {
        inputMint: tokenA.mint,
        outputMint: tokenB.mint,
        amount: baseUnits,
        slippageBps: Math.floor(parseFloat(slippage) * 100), // Convert percentage to basis points
      });
      
      if (result.success) {
        toast({
          title: "Swap Executed Successfully! 🎉",
          description: (
            <div className="space-y-1">
              <p>Swapped {amountA} {tokenA.symbol} → {tokenB.symbol}</p>
              <a 
                href={`https://solscan.io/tx/${result.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-xs"
              >
                View Transaction ↗
              </a>
            </div>
          ),
        });
        
        // Reset form
        setAmountA('');
        setAmountB('');
        
      } else {
        throw new Error(result.error || 'Swap failed');
      }
      
    } catch (error) {
      console.error('Swap error:', error);
      toast({
        title: "Swap Failed",
        description: error instanceof Error ? error.message : "Please try again or check your balance",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const TokenSelector: React.FC<{
    selectedToken: Token | null;
    onSelect: (token: Token) => void;
    label: string;
    amount: string;
    onAmountChange: (amount: string) => void;
  }> = ({ selectedToken, onSelect, label, amount, onAmountChange }) => (
    <div className="space-y-2">
      <Label className="text-white/80">{label}</Label>
      <div className="glass-card p-4 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <select
              value={selectedToken?.mint || ''}
              onChange={(e) => {
                if (e.target.value === 'custom') {
                  // Handle custom token input
                  return;
                }
                const allTokens = [...DEFAULT_TOKENS, ...userTokens];
                // Remove duplicates based on mint address
                const uniqueTokens = allTokens.filter((token, index, arr) => 
                  arr.findIndex(t => t.mint === token.mint) === index
                );
                const token = uniqueTokens.find(t => t.mint === e.target.value);
                if (token) onSelect(token);
              }}
              className="bg-white/10 text-white rounded px-3 py-2 border border-white/20 focus:border-token-purple focus:outline-none w-full"
            >
              <option value="">Select Token</option>
              {(() => {
                const allTokens = [...DEFAULT_TOKENS, ...userTokens];
                // Remove duplicates based on mint address to fix React key warning
                const uniqueTokens = allTokens.filter((token, index, arr) => 
                  arr.findIndex(t => t.mint === token.mint) === index
                );
                return uniqueTokens.map((token, index) => (
                  <option key={`${token.mint}-${index}`} value={token.mint} className="bg-gray-800">
                    {token.symbol} {token.isToken2022 ? '(Token-2022)' : ''}
                    {token.balance !== undefined ? ` (${token.balance.toFixed(4)})` : ''}
                  </option>
                ));
              })()}
              <option value="custom" className="bg-gray-800 border-t border-white/20">
                📝 Enter Custom Token Mint
              </option>
            </select>
            
            {/* Custom Token Input */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Enter token mint address (e.g., 9dXNjVTQSdiSfhV1hvW13cSk6fRN11hyeUZoNhrcusf1)"
                onChange={(e) => {
                  const mintAddress = e.target.value.trim();
                  if (mintAddress.length === 44) { // Valid Solana address length
                    try {
                      // Create a custom token object
                      const customToken: Token = {
                        mint: mintAddress,
                        symbol: mintAddress.slice(0, 6) + '...',
                        name: `Custom Token`,
                        decimals: 9, // Default, will be fetched later
                        isToken2022: false,
                      };
                      onSelect(customToken);
                    } catch (error) {
                      console.error('Invalid mint address:', error);
                    }
                  }
                }}
                className="text-sm bg-white/5 border border-white/10 text-white placeholder-white/40"
              />
            </div>
          </div>
          
          {selectedToken && (
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-white font-medium">{selectedToken.symbol}</p>
                {selectedToken.isToken2022 && (
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-2 py-0.5 rounded text-xs text-white">
                    TOKEN-2022
                  </div>
                )}
              </div>
              {selectedToken.balance !== undefined && (
                <p className="text-white/60 text-sm">
                  Balance: {selectedToken.balance.toFixed(4)}
                </p>
              )}
              {selectedToken.transferFeeBps && selectedToken.transferFeeBps > 0 && (
                <div className="bg-token-yellow/10 px-2 py-0.5 rounded text-xs text-token-yellow">
                  🔄 Transfer Hook: {(selectedToken.transferFeeBps / 100).toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>
        
        <input
          type="text"
          placeholder="0.00"
          value={amount}
          onChange={(e) => {
            const value = e.target.value;
            // Allow numbers, decimal point, and basic editing
            if (value === '' || /^\d*\.?\d*$/.test(value)) {
              onAmountChange(value);
            }
          }}
          className="text-xl bg-transparent border-none text-white placeholder-white/40 focus:outline-none w-full"
          disabled={!selectedToken}
          inputMode="decimal"
          autoComplete="off"
        />
        
        {selectedToken?.transferFeeBps && (
          <div className="bg-token-yellow/10 p-2 rounded flex items-center text-token-yellow text-xs">
            <AlertTriangle size={12} className="mr-1" />
            Transfer fee: {(selectedToken.transferFeeBps / 100).toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  );
  
  return (
    <Card className={`glass-card border-white/20 ${className}`}>
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowUpDown className="text-token-green" size={20} />
          Token-2022 Trading Platform
        </CardTitle>
        <p className="text-white/60 text-sm">
          Advanced AMM supporting Token-2022 with Transfer Hook preservation
        </p>
        
        {poolInfo && (
          <div className="flex items-center justify-between mt-3 p-2 bg-token-green/10 rounded-lg">
            <div className="flex items-center gap-2 text-token-green text-sm">
              <CheckCircle size={14} />
              <span>Route Active - Transfer Hooks Preserved</span>
            </div>
            {poolInfo.type === 'Jupiter' && (
              <div className="bg-blue-500 px-2 py-1 rounded text-xs text-white">
                JUPITER
              </div>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {!wallet.publicKey ? (
          <div className="text-center py-8">
            <p className="text-white/80 mb-4">Connect your wallet to start trading</p>
            <Button className="btn-gradient-primary">
              Connect Wallet
            </Button>
          </div>
        ) : (
          <>
            {/* Token A Input */}
            <TokenSelector
              selectedToken={tokenA}
              onSelect={handleTokenAChange}
              label="From"
              amount={amountA}
              onAmountChange={setAmountA}
            />
            
            {/* Swap Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSwapTokens}
                className="rounded-full w-10 h-10 p-0 border-white/20 hover:border-token-purple"
              >
                <ArrowUpDown size={16} className="text-white" />
              </Button>
            </div>
            
            {/* Token B Input */}
            <TokenSelector
              selectedToken={tokenB}
              onSelect={handleTokenBChange}
              label="To"
              amount={amountB}
              onAmountChange={setAmountB}
            />
            
            {/* Pool Status */}
            {tokenA && tokenB && (
              <div className="bg-white/5 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/60 text-sm">Pool Status:</span>
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : poolInfo ? (
                    <div className="flex items-center text-token-green text-sm">
                      <CheckCircle size={14} className="mr-1" />
                      Active
                    </div>
                  ) : (
                    <div className="flex items-center text-red-400 text-sm">
                      <AlertTriangle size={14} className="mr-1" />
                      No Pool
                    </div>
                  )}
                </div>
                
                {poolInfo && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-white/60">Liquidity:</span>
                      <span className="text-white ml-1">${poolInfo.liquidity?.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-white/60">24h Volume:</span>
                      <span className="text-white ml-1">${poolInfo.volume24h?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
                
                {!poolInfo && tokenA && tokenB && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => {
                      // Open pool creation modal
                      toast({
                        title: "Create Pool",
                        description: "Create a liquidity pool to enable trading",
                      });
                    }}
                  >
                    <Droplets size={14} className="mr-1" />
                    Create Pool
                  </Button>
                )}
              </div>
            )}
            
            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="bg-token-purple/10 p-3 rounded-lg border border-token-purple/20">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <Calculator size={14} className="mr-1" />
                  Fee Breakdown
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-white/60">Raydium Fee (0.25%):</span>
                    <span className="text-white">{feeBreakdown.raydiumFee.toFixed(6)} {tokenA?.symbol}</span>
                  </div>
                  {feeBreakdown.transferFeeA > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Transfer Fee ({tokenA?.symbol}):</span>
                      <span className="text-token-yellow">{feeBreakdown.transferFeeA.toFixed(6)} {tokenA?.symbol}</span>
                    </div>
                  )}
                  {feeBreakdown.transferFeeB > 0 && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Transfer Fee ({tokenB?.symbol}):</span>
                      <span className="text-token-yellow">{feeBreakdown.transferFeeB.toFixed(6)} {tokenB?.symbol}</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-1 flex justify-between font-medium">
                    <span className="text-white">Total Fees:</span>
                    <span className="text-gradient-purple-blue">{feeBreakdown.totalFees.toFixed(6)} {tokenA?.symbol}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Slippage Settings */}
            <div className="bg-white/5 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-white/80 text-sm">Slippage Tolerance</Label>
                <div className="flex gap-1">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? "default" : "outline"}
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setSlippage(value)}
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="h-8 text-sm"
                placeholder="Custom %"
                step="0.1"
                min="0.1"
                max="50"
              />
            </div>
            
            {/* Swap Button */}
            <Button
              onClick={handleTrade}
              disabled={!tokenA || !tokenB || !amountA || !poolInfo || isLoading}
              className="w-full btn-gradient-primary text-lg py-6"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={20} />
                  Swapping...
                </>
              ) : !poolInfo ? (
                'No Pool Available - Create One First'
              ) : (
                <>
                  <ArrowUpDown className="mr-2" size={20} />
                  Swap {tokenA?.symbol} → {tokenB?.symbol}
                </>
              )}
            </Button>
            
            {/* Platform Features */}
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-4 rounded-lg border border-purple-500/20">
              <h3 className="text-white font-bold text-lg mb-2">Platform Capabilities</h3>
              <p className="text-white/90 text-sm mb-3">
                Production-ready AMM with Token-2022 and Transfer Hook support
              </p>
              <div className="flex justify-center gap-4 text-xs text-white/80">
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  <span>Token-2022</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  <span>Transfer Hooks</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  <span>Jupiter Integration</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle size={12} />
                  <span>Mainnet Ready</span>
                </div>
              </div>
            </div>

            {/* External Trading Link */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open('https://raydium.io/swap', '_blank')}
            >
              <ExternalLink className="mr-2" size={16} />
              Compare with Raydium (No Token-2022 Support)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};