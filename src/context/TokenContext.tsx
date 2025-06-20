import React, { createContext, useContext, useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useToast } from '@/components/ui/use-toast';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, getMint } from '@solana/spl-token';
import { RPC_ENDPOINT, HELIUS_API_URL } from '@/config';
import { getToken2022MetadataPDA } from '@/services/splTokenMetadataUtils';

// Token type definition
export interface Token {
  id: string;
  name: string;
  symbol: string;
  supply: string;
  price?: string;
  change?: string;
  positive?: boolean;
  image?: string | null;
  mint: string;
  decimals: number;
  balance?: string;
  description?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  creators?: Array<{ address: string; verified: boolean; share: number }>;
  plan?: 'basic' | 'advanced' | 'enterprise';
  metadataUri?: string;
}

// Token context state
interface TokenContextState {
  tokens: Token[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  error: string | null;
  createTokenInProgress: boolean;
  setCreateTokenInProgress: (value: boolean) => void;
  createdTokenMint: string | null;
  setCreatedTokenMint: (value: string | null) => void;
  isMetadataModalOpen: boolean;
  setIsMetadataModalOpen: (open: boolean) => void;
  isLiquidityModalOpen: boolean;
  setIsLiquidityModalOpen: (open: boolean) => void;
  selectedToken: Token | null;
  setSelectedToken: (token: Token | null) => void;
  solBalance: string; // Add SOL balance to context
}

// Create the context
const TokenContext = createContext<TokenContextState | undefined>(undefined);

// Provider component
export const TokenProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {  const [tokens, setTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced metadata fetching function
  const fetchMetadata = async (mintAddress: string) => {
    try {
      const metadataResponse = await fetch(HELIUS_API_URL, {
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
        const data = await metadataResponse.json();
        if (data.result) {
          const asset = data.result;
          const metadata = asset.content?.metadata;
          const tokenInfo = asset.token_info;
          
          return {
            name: metadata?.name || tokenInfo?.name,
            symbol: metadata?.symbol || tokenInfo?.symbol,
            image: asset.content?.files?.[0]?.cdn_uri || asset.content?.files?.[0]?.uri || metadata?.image,
            description: metadata?.description,
            attributes: metadata?.attributes,
            creators: metadata?.properties?.creators,
            plan: metadata?.plan || metadata?.additionalMetadata?.find((item: any) => item[0] === 'plan')?.[1]
          };
        }
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
    return null;
  };
  const [createTokenInProgress, setCreateTokenInProgress] = useState<boolean>(false);
  const [createdTokenMint, setCreatedTokenMint] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState<boolean>(false);
  const [isLiquidityModalOpen, setIsLiquidityModalOpen] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [solBalance, setSolBalance] = useState<string>('0');
  const MAX_RETRIES = 3;
  
  const { publicKey } = useWallet();
  const { toast } = useToast();

  // Fetch tokens owned by the connected wallet
  const loadTokens = async () => {
    if (!publicKey) {
      setTokens([]);
      setIsLoading(false);
      return;
    }

    if (retryCount >= MAX_RETRIES) {
      setError("Maximum retry attempts reached. Please try again later.");
      setIsLoading(false);
      toast({
        title: "Error loading tokens",
        description: "Maximum retry attempts reached. Displaying available tokens only.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const connection = new Connection(RPC_ENDPOINT, 'confirmed');
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_2022_PROGRAM_ID }
      );

      // Create a map of mint to total balance
      const balanceMap = new Map<string, bigint>();
      tokenAccounts.value.forEach(acc => {
        try {
          const mint = acc.account.data.parsed.info.mint;
          const amount = BigInt(acc.account.data.parsed.info.tokenAmount.amount || '0');
          if (mint) {
            balanceMap.set(mint, (balanceMap.get(mint) || BigInt(0)) + amount);
          }
        } catch (err) {
          console.error('Error processing token account:', err);
        }
      });

      const tokens: Token[] = [];
      for (const [mintAddress, totalAmount] of balanceMap.entries()) {
        try {
          const mint = new PublicKey(mintAddress);
          const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);

          // Default values (use let for mutability)
          let name: string = mintAddress;
          let symbol: string = mintAddress.slice(0, 8);
          let image: string | null = null;
          let description: string | undefined;
          let attributes: Array<{ trait_type: string; value: string | number }> | undefined;
          let creators: Array<{ address: string; verified: boolean; share: number }> | undefined;
          let plan: 'basic' | 'advanced' | 'enterprise' | undefined;

          // Try to get metadata from Helius first
          const metadata = await fetchMetadata(mintAddress);
          if (metadata) {
            if (metadata.name) name = metadata.name;
            if (metadata.symbol) symbol = metadata.symbol;
            if (metadata.image) image = metadata.image;
            if (metadata.description) description = metadata.description;
            if (metadata.attributes) attributes = metadata.attributes;
            if (metadata.creators) creators = metadata.creators;
            if (metadata.plan) plan = metadata.plan as 'basic' | 'advanced' | 'enterprise';
          } else {
            // Fallback to on-chain metadata
            try {
              const splTokenMetadata = await import('@solana/spl-token-metadata');
              const metadataPDA = getToken2022MetadataPDA(mint, TOKEN_2022_PROGRAM_ID);
              const accountInfo = await connection.getAccountInfo(metadataPDA);
              if (accountInfo && accountInfo.data) {
                const decoded = splTokenMetadata.unpack(accountInfo.data);
                if (decoded && decoded.name) name = decoded.name;
                if (decoded && decoded.symbol) symbol = decoded.symbol;
                if (decoded && decoded.uri) {
                  try {
                    const uriResp = await fetch(decoded.uri);
                    if (uriResp.ok) {
                      const uriJson = await uriResp.json();
                      if (uriJson.image) image = uriJson.image;
                      if (uriJson.description) description = uriJson.description;
                      if (uriJson.attributes) attributes = uriJson.attributes;
                      if (uriJson.properties?.creators) creators = uriJson.properties.creators;
                    }
                  } catch (e) {
                    console.error('Error fetching metadata URI:', e);
                  }
                }
              }
            } catch (err) {
              console.error('Error fetching on-chain metadata:', err);
            }
          }

          // If we still don't have metadata, use fallback values
          if (!name || name === mintAddress) {
            name = 'Unknown Token';
            symbol = '???';
          }

          tokens.push({
            id: mintAddress,
            mint: mintAddress,
            name,
            symbol,
            decimals: mintInfo.decimals,
            balance: totalAmount.toString(),
            image,
            supply: mintInfo.supply?.toString() || '',
            description,
            attributes,
            creators,
            plan
          });
        } catch (err) {
          console.error('Error processing token:', err);
          continue;
        }
      }
      setTokens(tokens);
      setRetryCount(0);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tokens';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      setIsLoading(false);
      toast({
        title: "Error fetching tokens",
        description: "Could not fetch all token information. Displaying available tokens only.",
        variant: "destructive",
      });
    }
  };

  // Load tokens when wallet changes
  useEffect(() => {
    setRetryCount(0); // Reset retry count when wallet changes
    if (publicKey) {
      // Set a timeout to prevent infinite loading
      const loadingTimeout = setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
          toast({
            title: "Loading timeout",
            description: "Token loading is taking longer than expected. Showing available tokens.",
            variant: "destructive",
          });
        }
      }, 15000); // 15 second timeout
      
      loadTokens();
      
      return () => clearTimeout(loadingTimeout);
    } else {
      setTokens([]);
      setIsLoading(false);
    }
  }, [publicKey]);

  // Fetch SOL balance
  useEffect(() => {
    const fetchSolBalance = async () => {
      if (!publicKey) {
        setSolBalance('0');
        return;
      }
      try {
        const connection = new Connection(RPC_ENDPOINT, 'confirmed');
        const balance = await connection.getBalance(publicKey);
        setSolBalance((balance / LAMPORTS_PER_SOL).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      } catch {
        setSolBalance('0');
      }
    };
    fetchSolBalance();
  }, [publicKey]);

  // Refresh function with error handling
  const refresh = async () => {
    if (!isLoading) { // Prevent multiple concurrent refreshes
      try {
        await loadTokens();
      } catch (error) {
        console.error("Error refreshing tokens:", error);
        setIsLoading(false);
        
        toast({
          title: "Error refreshing tokens",
          description: "Could not refresh token data. Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  // Context value
  const value = {
    tokens,
    isLoading,
    refresh,
    error,
    createTokenInProgress,
    setCreateTokenInProgress,
    createdTokenMint,
    setCreatedTokenMint,
    isMetadataModalOpen,
    setIsMetadataModalOpen,
    isLiquidityModalOpen,
    setIsLiquidityModalOpen,
    selectedToken,
    setSelectedToken,
    solBalance, // add solBalance to context
  };

  return <TokenContext.Provider value={value}>{children}</TokenContext.Provider>;
};

// Hook to use the token context
export const useTokenContext = () => {
  const context = useContext(TokenContext);
  if (context === undefined) {
    throw new Error('useTokenContext must be used within a TokenProvider');
  }
  return context;
};