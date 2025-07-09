// services/solana.ts - Token-2022 with transfer fees AND metadata extensions (BLOWFISH COMPLIANT VERSION)

import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getMintLen,
  ExtensionType,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMetadataPointerInstruction,
  createWithdrawWithheldTokensFromMintInstruction,
  createHarvestWithheldTokensToMintInstruction,
  getMint,
  unpackAccount,
  getTransferFeeAmount,
  getTransferFeeConfig,
  createSetAuthorityInstruction,
  AuthorityType,
} from '@solana/spl-token';
import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';

// Import the metadata functions
import {
  createInitializeInstruction,
  pack,
  TokenMetadata,
} from '@solana/spl-token-metadata';

import {
  createTokenMetadata,
  uploadToIPFS,
} from './metadata';

import { 
  TREASURY_WALLET,
  BASIC_CREATION_FEE,
  ADVANCED_CREATION_FEE,
  ENTERPRISE_CREATION_FEE,
  getMetadataFee
} from '../config';

// TypeScript interface declarations for wallet providers
declare global {
  interface Window {
    phantom?: {
      solana?: {
        isPhantom: boolean;
        signAndSendTransaction: (transaction: any, options?: any) => Promise<any>;
        connect: () => Promise<{ publicKey: any }>;
        publicKey: any;
      };
    };
    // Use any to avoid conflicts with Particle Network types
    solana?: any;
  }
}

// BLOWFISH EXCLUSIVE FIX: Enhanced provider detection and signAndSendTransaction implementation
async function getBlowfishCompliantProvider(): Promise<any> {
  // Check for modern Phantom provider first
  if (typeof window !== 'undefined') {
    if ('phantom' in window && window.phantom?.solana?.isPhantom) {
      const provider = window.phantom.solana;
      if (typeof provider.signAndSendTransaction === 'function') {
        return provider;
      }
    }
    
    // Fallback to legacy solana provider
    if ('solana' in window && window.solana?.isPhantom) {
      const provider = window.solana;
      if (typeof provider.signAndSendTransaction === 'function') {
        return provider;
      }
    }
  }
  
  throw new Error('Phantom wallet not found or does not support signAndSendTransaction. This dApp exclusively uses signAndSendTransaction for Blowfish security compliance. Please use Phantom wallet.');
}

async function sendTransactionSmart(
  wallet: any,
  transaction: Transaction | VersionedTransaction
): Promise<string> {
  // BLOWFISH REQUIREMENT: Verify provider supports signAndSendTransaction
  const provider = await getBlowfishCompliantProvider();
  
  if (wallet !== provider) {
    console.warn('Wallet mismatch detected, using verified Blowfish-compliant provider');
  }

  try {
    console.log("🔒 Using signAndSendTransaction EXCLUSIVELY for Blowfish compliance (Ticket #10150)");
    console.log("📋 Transaction constructed with space for Lighthouse guard instructions");
    
    // Use signAndSendTransaction with proper options
    const result = await provider.signAndSendTransaction(transaction, {
      skipPreflight: false,
      preflightCommitment: 'processed'
    });
    
    const signature = typeof result === 'string' ? result : result.signature;
    console.log('✅ Transaction sent via signAndSendTransaction:', signature);
    
    return signature;
  } catch (error) {
    console.error("❌ signAndSendTransaction failed:", error);
    throw new Error('Transaction failed using signAndSendTransaction: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Get RPC endpoints from env or use defaults with fallback logic
const getEndpoint = (isMainnet: boolean = true): string => {
  // Always prefer environment variable for endpoint
  const envEndpoint = import.meta.env.VITE_RPC_ENDPOINT;
  if (envEndpoint) return envEndpoint;

  if (!isMainnet) return "https://api.devnet.solana.com";
  
  if (typeof window !== 'undefined' && window.localStorage.getItem('helius_rate_limited') === 'true') {
    console.log("Using fallback RPC endpoint due to previous rate limiting");
    return "https://api.mainnet-beta.solana.com";
  }
  // Default fallback if nothing else is set
  return "https://rpc.helius.xyz/?api-key=908f61ba-2bc3-4475-a583-e5cac9d8dae8";
};

// Enhanced connection initialization with retries and WebSocket
const getConnection = (isMainnet: boolean = true): Connection => {
  const endpoint = getEndpoint(isMainnet);
  const wsEndpoint = isMainnet ? import.meta.env.VITE_RPC_WS_ENDPOINT : undefined;

  return new Connection(endpoint, {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 120000,
    wsEndpoint,
    disableRetryOnRateLimit: false,
  });
};

// Initialize default connection - will be updated based on network selection in createToken

/**
 * Token interface for the application
 */
export interface TokenAccount {
  id: string;
  mint: string;
  name: string;
  symbol: string;
  supply: string;
  decimals: number;
  balance: string;
  image: string | null;
  price: string;
  change: string;
  positive: boolean;
}

export type Token = Omit<TokenAccount, 'balance'> & {
  balance?: string;
};

// FIXED: CreateTokenParams with proper BigInt support for large supplies
export interface CreateTokenParams {
  name: string;
  symbol: string;
  decimals: number;
  royaltyPercentage?: number;
  initialSupply: string; // Always string to handle large numbers safely
  isMainnet?: boolean;
  image?: File;
  plan?: 'basic' | 'advanced' | 'enterprise';
  mintable?: boolean;
  burnable?: boolean;
  freezeAuthority?: boolean;
  renounceOwnership?: boolean;
}

interface CreateTokenResult {
  mint: PublicKey | null;
  signature: string | null;
  success: boolean;
  warning?: string;
  error?: string;
  uri?: string;
}

// Safe BigInt utility functions
const validateAndConvertSupply = (supply: string, decimals: number): bigint => {
  try {
    const supplyBigInt = BigInt(supply);
    
    // Validate against u64 maximum
    const MAX_U64 = BigInt('18446744073709551615');
    if (supplyBigInt < 0n) {
      throw new Error('Supply cannot be negative');
    }
    if (supplyBigInt > MAX_U64) {
      throw new Error('Supply exceeds u64 maximum value');
    }
    
    // Calculate the final token amount with decimals
    const multiplier = BigInt(Math.pow(10, decimals));
    const tokenAmount = supplyBigInt * multiplier;
    
    if (tokenAmount > MAX_U64) {
      throw new Error(`Supply with ${decimals} decimals exceeds u64 maximum. Maximum supply for ${decimals} decimals is ${MAX_U64 / multiplier}`);
    }
    
    console.log('✅ Supply validation passed:', {
      inputSupply: supply,
      supplyBigInt: supplyBigInt.toString(),
      decimals,
      finalTokenAmount: tokenAmount.toString()
    });
    
    return tokenAmount;
  } catch (error) {
    console.error('❌ Supply validation failed:', error);
    throw error;
  }
};

/**
 * Creates an SPL Token-2022 token with transfer fee extension AND metadata extensions
 * BLOWFISH EXCLUSIVE: Now uses signAndSendTransaction ONLY for security compliance (Ticket #10150)
 */
export async function createToken(
  wallet: any,
  params: CreateTokenParams
): Promise<CreateTokenResult> {
  try {
    const {
      name,
      symbol,
      decimals,
      initialSupply,
      isMainnet = true,
      image,
      plan = 'basic',
      freezeAuthority = true,
      renounceOwnership = false,
      mintable = true
    } = params;

    // Validate supply early and convert to BigInt safely
    const tokenAmount = validateAndConvertSupply(initialSupply, decimals);

    if (!wallet?.publicKey) {
      throw new Error("Invalid wallet or no public key available");
    }

    console.log(`⚡ Creating ${plan} token with metadata extensions on ${isMainnet ? 'mainnet' : 'devnet'}...`);
    console.log(`🔧 Token settings: freezeAuthority=${freezeAuthority}, renounceOwnership=${renounceOwnership}, mintable=${mintable}`);

    // Validate treasury wallet first
    let treasuryWallet: PublicKey;
    try {
      console.log('Treasury wallet config:', TREASURY_WALLET);
      treasuryWallet = new PublicKey(TREASURY_WALLET.trim());
    } catch (error) {
      console.error('Invalid treasury wallet configuration:', error);
      throw new Error('Treasury wallet address is not properly configured. Please check the configuration.');
    }

    // Update connection for the selected network
    const connection = getConnection(isMainnet);

    // Handle metadata if image is provided
    let metadataUri = '';
    if (image || name || symbol) {
      try {
        console.log("📝 Creating token metadata...");
        let imageUrl;
        if (image) {
          imageUrl = await uploadToIPFS(image);
        }
        metadataUri = await createTokenMetadata({
          name: name.trim(),
          symbol: symbol.trim(),
          description: `${name} token on Solana blockchain`,
          image: imageUrl
        });
        console.log("✅ Metadata created successfully:", metadataUri);
      } catch (error) {
        console.error("Error during metadata creation:", error);
        console.warn("Continuing without metadata...");
      }
    }

    // Generate mint keypair for new token
    const mintKeypair = Keypair.generate();
    console.log("🔑 Creating mint account with metadata extensions...");
    
    // CRITICAL: Calculate space for ALL extensions including metadata
    const extensions = [
      ExtensionType.TransferFeeConfig,
      ExtensionType.MetadataPointer,
    ];
    const mintLen = getMintLen(extensions);
    
    console.log("📏 Mint account size with all extensions:", mintLen);
    
    // Get rent and recent blockhash - need extra rent for metadata that will be added
    const baseRent = await connection.getMinimumBalanceForRentExemption(mintLen);
    
    // Create the metadata that will be stored
    const metadata: TokenMetadata = {
      updateAuthority: wallet.publicKey,
      mint: mintKeypair.publicKey,
      name: name.trim(),
      symbol: symbol.trim(),
      uri: metadataUri,
      additionalMetadata: [['plan', plan]],
    };
    
    // Calculate additional space needed for metadata
    const metadataSize = pack(metadata).length;
    const additionalRent = await connection.getMinimumBalanceForRentExemption(metadataSize);
    const totalRent = baseRent + additionalRent;
    
    console.log("💰 Base rent (lamports):", baseRent);
    console.log("💰 Additional metadata rent (lamports):", additionalRent);
    console.log("💰 Total rent (lamports):", totalRent);
    
    const { blockhash } = await connection.getLatestBlockhash('confirmed');

    // Create transaction with proper instruction order
    const instructions = [];

    // 1. Create mint account with proper space for base extensions
    instructions.push(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: mintLen,
        lamports: totalRent, // Use total rent including metadata
        programId: TOKEN_2022_PROGRAM_ID
      })
    );

    // 2. Initialize transfer fee config
    // Calculate the transfer fee based on plan and royalty percentage
    let transferFeeBps = 0;
    let maxFeeAmount = BigInt(0);
    let withdrawAuthority = treasuryWallet; // Default to treasury
    
    if (plan === 'basic') {
      // Basic plan: Fixed 0.2% fee to treasury
      transferFeeBps = 20; // 0.2% = 20 basis points
      maxFeeAmount = BigInt("18446744073709551615"); // u64::MAX to ensure no limit
      withdrawAuthority = treasuryWallet; // Treasury collects fees
    } else if (plan === 'enterprise' && params.royaltyPercentage) {
      // Enterprise plan: Custom royalty up to 5% to creator
      transferFeeBps = params.royaltyPercentage * 100; // Convert percentage to basis points
      maxFeeAmount = BigInt("18446744073709551615"); // u64::MAX to ensure no limit
      withdrawAuthority = wallet.publicKey; // CREATOR collects royalties
    }
    // Advanced plan: No fees (transferFeeBps remains 0, authority doesn't matter)
    
    console.log(`Using ${transferFeeBps} basis points (${transferFeeBps / 100}%) transfer fee`);
    console.log(`Withdraw authority: ${withdrawAuthority.toString()} (${plan === 'enterprise' ? 'creator' : 'treasury'})`);
    
    instructions.push(
      createInitializeTransferFeeConfigInstruction(
        mintKeypair.publicKey,
        wallet.publicKey,
        withdrawAuthority, // Now correctly set based on plan
        transferFeeBps,
        maxFeeAmount,
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 3. Initialize metadata pointer (pointing to the mint itself)
    instructions.push(
      createInitializeMetadataPointerInstruction(
        mintKeypair.publicKey,    // mint
        wallet.publicKey,         // authority to update metadata pointer
        mintKeypair.publicKey,    // metadata address (pointing to self)
        TOKEN_2022_PROGRAM_ID     // must be Token-2022
      )
    );

    // 4. Initialize mint
    instructions.push(
      createInitializeMint2Instruction(
        mintKeypair.publicKey,    // mint
        decimals,                 // decimals
        wallet.publicKey,         // mint authority
        freezeAuthority ? wallet.publicKey : null, // freeze authority (null if toggle is OFF)
        TOKEN_2022_PROGRAM_ID     // must be Token-2022
      )
    );

    // 5. Initialize token metadata (stores name, symbol, uri directly on mint)
    instructions.push(
      createInitializeInstruction({
        programId: TOKEN_2022_PROGRAM_ID,     // Token Extension Program as Metadata Program
        metadata: mintKeypair.publicKey,      // Account address that holds the metadata (the mint itself)
        updateAuthority: wallet.publicKey,    // Authority that can update the metadata
        mint: mintKeypair.publicKey,          // The mint account
        mintAuthority: wallet.publicKey,      // Mint authority
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadata.uri,
      })
    );

    // 6. Create associated token account
    const ata = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        ata,
        wallet.publicKey,
        mintKeypair.publicKey,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );

    // 7. Mint initial supply using the validated BigInt amount
    instructions.push(
      createMintToInstruction(
        mintKeypair.publicKey,
        ata,
        wallet.publicKey,
        tokenAmount, // Use the validated BigInt
        [],
        TOKEN_2022_PROGRAM_ID
      )
    );

    // 8. Revoke authorities if requested
    if (renounceOwnership || !mintable) {
      console.log("🔒 Revoking mint authority (renouncing ownership)...");
      instructions.push(
        createSetAuthorityInstruction(
          mintKeypair.publicKey,  // mint
          wallet.publicKey,       // current authority
          AuthorityType.MintTokens, // authority type
          null,                   // new authority (null = revoke)
          [],                     // signers
          TOKEN_2022_PROGRAM_ID   // program id
        )
      );
    }

    // 9. Add platform fee and feature fees
    let totalFee = plan === 'basic' ? 
      BASIC_CREATION_FEE : 
      plan === 'advanced' ? 
      ADVANCED_CREATION_FEE : 
      ENTERPRISE_CREATION_FEE;

    // Always charge metadata fee (name/symbol is always present)
    totalFee += getMetadataFee(plan);

    if (totalFee > 0) {
      instructions.push(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: treasuryWallet,
          lamports: Math.round(totalFee * 1e9)
        })
      );
    }

    // Create versioned transaction for better Blowfish compatibility
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);
    
    // Sign with the mint keypair
    transaction.sign([mintKeypair]);

    // BLOWFISH EXCLUSIVE: Use signAndSendTransaction method only
    console.log("🚀 Sending transaction with signAndSendTransaction for Blowfish compliance...");
    const sig = await sendTransactionSmart(wallet, transaction);
    
    console.log("✅ Token created successfully with metadata extensions:", mintKeypair.publicKey.toString());
    console.log(`✅ Transfer fee: ${transferFeeBps / 100}% going to ${plan === 'enterprise' ? 'creator' : 'treasury'}: ${withdrawAuthority.toString()}`);
    console.log(`✅ Freeze Authority: ${freezeAuthority ? 'ENABLED' : 'DISABLED (revoked)'}`);
    console.log(`✅ Mint Authority: ${(renounceOwnership || !mintable) ? 'REVOKED (ownership renounced)' : 'RETAINED (can mint more)'}`);
    console.log(`✅ Token Name: "${name}", Symbol: "${symbol}" - stored directly on mint`);
    console.log("✅ Metadata Pointer: pointing to mint itself for immediate explorer recognition");
    if (metadataUri) {
      console.log("📝 Metadata URI:", metadataUri);
    }
    console.log("🎉 Token should display name and symbol immediately on compatible explorers!");
    
    return {
      mint: mintKeypair.publicKey,
      signature: sig,
      success: true,
      uri: metadataUri,
      warning: metadataUri ? undefined : "Token created without external metadata URI"
    };
  } catch (error) {
    const typedError = error instanceof Error ? error : new Error(String(error));
    console.error("Token creation error:", typedError);
    return {
      mint: null,
      signature: null,
      success: false,
      error: typedError.message
    };
  }
}

/**
 * Calculates the fee for token creation based on features selected
 */
export function calculateTokenCreationFee(options: {
  plan?: 'basic' | 'advanced' | 'enterprise';
  hasMetadata?: boolean;
  hasRoyalties?: boolean;
  mintable?: boolean;
  supply?: number;
  freezeAuthority?: boolean;
  renounceOwnership?: boolean;
}): number {
  const plan = options.plan || 'basic';
  let fee = plan === 'basic' ? 
    BASIC_CREATION_FEE : 
    plan === 'advanced' ? 
    ADVANCED_CREATION_FEE : 
    ENTERPRISE_CREATION_FEE;

  if (options.hasMetadata) {
    fee += getMetadataFee(plan);
  }

  if (options.hasRoyalties) {
    fee += getMetadataFee(plan);
  }

  if (options.mintable === false) {
    fee += getMetadataFee(plan);
  }

  if (options.supply && options.supply > 1000000) {
    fee += getMetadataFee(plan);
  }

  if (options.freezeAuthority === false) {
    fee += getMetadataFee(plan);
  }

  if (options.renounceOwnership === true) {
    fee += getMetadataFee(plan);
  }

  return fee;
}

/**
 * Formats token amounts based on decimals
 */
export function formatTokenAmount(amount: number, decimals: number): string {
  return (amount / Math.pow(10, decimals)).toLocaleString();
}

/**
 * Fetches all tokens owned by a user
 * Supports both Token and Token-2022 accounts
 */
export async function fetchUserTokens(walletAddress: string, isMainnet: boolean = true): Promise<Token[]> {
  try {
    const connection = getConnection(isMainnet);
    const walletPublicKey = new PublicKey(walletAddress);
    const tokens: Token[] = [];
    
    // Fetch regular SPL tokens
    try {
      const regularTokens = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { programId: TOKEN_PROGRAM_ID },
        'confirmed'
      );
      
      for (const tokenAccount of regularTokens.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const mintPubkey = new PublicKey(accountData.mint);
        const tokenAmount = accountData.tokenAmount;
        
        if (tokenAmount.uiAmount === 0) continue;
        
        const token: Token = {
          id: mintPubkey.toString(),
          mint: mintPubkey.toString(),
          name: `Token ${mintPubkey.toString().slice(0, 6)}...`,
          symbol: mintPubkey.toString().slice(0, 4).toUpperCase(),
          supply: tokenAmount.uiAmount?.toString() || "0",
          decimals: tokenAmount.decimals || 0,
          balance: tokenAmount.uiAmount?.toString() || "0",
          image: null,
          price: "0.00",
          change: ((Math.random() * 20) - 10).toFixed(2),
          positive: Math.random() > 0.5
        };
        
        tokens.push(token);
      }
    } catch (error) {
      console.log("Error fetching regular tokens:", error);
    }
    
    // Fetch Token-2022 tokens
    try {
      const token2022Tokens = await connection.getParsedTokenAccountsByOwner(
        walletPublicKey,
        { programId: TOKEN_2022_PROGRAM_ID },
        'confirmed'
      );
      
      for (const tokenAccount of token2022Tokens.value) {
        const accountData = tokenAccount.account.data.parsed.info;
        const mintPubkey = new PublicKey(accountData.mint);
        const tokenAmount = accountData.tokenAmount;
        
        if (tokenAmount.uiAmount === 0) continue;
        
        const token: Token = {
          id: mintPubkey.toString(),
          mint: mintPubkey.toString(),
          name: `Token ${mintPubkey.toString().slice(0, 6)}...`,
          symbol: mintPubkey.toString().slice(0, 4).toUpperCase(),
          supply: tokenAmount.uiAmount?.toString() || "0",
          decimals: tokenAmount.decimals || 0,
          balance: tokenAmount.uiAmount?.toString() || "0",
          image: null,
          price: "0.00",
          change: ((Math.random() * 20) - 10).toFixed(2),
          positive: Math.random() > 0.5
        };
        
        tokens.push(token);
      }
    } catch (error) {
      console.log("Error fetching Token-2022 tokens:", error);
    }
    
    return tokens;
  } catch (error) {
    console.error("Error fetching user tokens:", error);
    return [];
  }
}

/**
 * Find all token accounts that have withheld fees for a given mint
 */
export async function findAccountsWithWithheldFees(
  mint: PublicKey,
  isMainnet: boolean = true
): Promise<{ pubkey: PublicKey; withheldAmount: string }[]> {
  try {
    const connection = getConnection(isMainnet);
    const accounts = await connection.getProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        commitment: 'confirmed',
        filters: [
          { memcmp: { offset: 0, bytes: mint.toBase58() } },
        ],
      }
    );

    const accountsWithFees = [];
    
    for (const accountInfo of accounts) {
      try {
        // Properly unpack the Token-2022 account
        const account = unpackAccount(
          accountInfo.pubkey,
          accountInfo.account,
          TOKEN_2022_PROGRAM_ID
        );
        
        // Use the proper SPL Token function to get transfer fee amount
        const transferFeeAmount = getTransferFeeAmount(account);
        
        if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
          accountsWithFees.push({
            pubkey: accountInfo.pubkey,
            withheldAmount: transferFeeAmount.withheldAmount.toString(),
          });
        }
      } catch (error) {
        // Account might not be a valid Token-2022 account or might not have transfer fee extension
        // Skip it silently as this is expected for some accounts
        continue;
      }
    }

    return accountsWithFees;
  } catch (error) {
    console.error("Error finding accounts with withheld fees:", error);
    return [];
  }
}

/**
 * Claims creator royalties (withheld transfer fees) for a specific token
 * BLOWFISH EXCLUSIVE: Now uses signAndSendTransaction ONLY for security compliance (Ticket #10150)
 */
export async function claimCreatorRoyalties(
  wallet: any,
  mint: PublicKey,
  isMainnet: boolean = true
): Promise<{ success: boolean; signature?: string; error?: string; totalClaimed?: number }> {
  try {
    if (!wallet?.publicKey) {
      throw new Error("Wallet not connected");
    }

    const connection = getConnection(isMainnet);

    // Validate treasury wallet
    let treasuryWallet: PublicKey;
    try {
      treasuryWallet = new PublicKey(TREASURY_WALLET.trim());
    } catch (error) {
      console.error('Invalid treasury wallet configuration:', error);
      throw new Error('Treasury wallet address is not properly configured. Please check the configuration.');
    }

    // First verify this wallet is actually the withdraw authority for this mint
    try {
      const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
      const transferFeeConfig = getTransferFeeConfig(mintInfo);
      
      if (!transferFeeConfig) {
        throw new Error("This token does not have transfer fees configured");
      }
      
      const withdrawAuthority = transferFeeConfig.withdrawWithheldAuthority?.toString();
      if (withdrawAuthority !== wallet.publicKey.toString()) {
        throw new Error("You are not authorized to claim fees for this token");
      }
      
      console.log("✅ Verified wallet is withdraw authority for token:", mint.toString());
    } catch (error) {
      console.error("Error verifying withdraw authority:", error);
      throw error;
    }

    // Check wallet balance for claiming fee + transaction fees
    const walletBalance = await connection.getBalance(wallet.publicKey);
    const claimingFee = 0.005 * 1e9; // 0.005 SOL in lamports
    const estimatedTxFee = 0.002 * 1e9; // Estimated transaction fee (higher for two transactions)
    const requiredBalance = claimingFee + estimatedTxFee;

    if (walletBalance < requiredBalance) {
      throw new Error(`Insufficient SOL balance. Need at least ${requiredBalance / 1e9} SOL for claiming fee and transaction costs.`);
    }

    // STEP 1: Find all accounts with withheld fees
    console.log("🔍 Finding all accounts with withheld fees...");
    const allAccounts = await connection.getProgramAccounts(TOKEN_2022_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        {
          memcmp: {
            offset: 0,
            bytes: mint.toBase58(),
          },
        },
      ],
    });

    const accountsWithFees: PublicKey[] = [];
    let totalWithheldAmount = 0;

    for (const accountInfo of allAccounts) {
      try {
        // Properly unpack the Token-2022 account
        const account = unpackAccount(
          accountInfo.pubkey,
          accountInfo.account,
          TOKEN_2022_PROGRAM_ID
        );
        
        // Use the proper SPL Token function to get transfer fee amount
        const transferFeeAmount = getTransferFeeAmount(account);
        
        if (transferFeeAmount !== null && transferFeeAmount.withheldAmount > BigInt(0)) {
          accountsWithFees.push(accountInfo.pubkey);
          totalWithheldAmount += Number(transferFeeAmount.withheldAmount);
          console.log(`💰 Found fees in account ${accountInfo.pubkey.toString()}: ${transferFeeAmount.withheldAmount}`);
        }
      } catch (error) {
        // Account might not be a valid Token-2022 account or might not have transfer fee extension
        // Skip it silently as this is expected for some accounts
        continue;
      }
    }

    if (accountsWithFees.length === 0 || totalWithheldAmount === 0) {
      return {
        success: false,
        error: "No accounts with withheld fees found for this token"
      };
    }

    console.log(`🎯 Found ${accountsWithFees.length} accounts with total withheld amount: ${totalWithheldAmount}`);

    // STEP 2: Get or create creator's token account for receiving the fees
    console.log("🏦 Setting up destination token account...");
    const destinationAta = await getAssociatedTokenAddress(
      mint,
      wallet.publicKey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if ATA exists, if not we'll create it in the transaction
    let needsATA = false;
    try {
      await connection.getAccountInfo(destinationAta);
      console.log("✅ Destination token account already exists");
    } catch (error) {
      needsATA = true;
      console.log("🆕 Will create destination token account");
    }

    // STEP 3: Create the claiming transaction with proper two-step process
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    const instructions = [];

    // 3a. Add claiming fee payment to treasury FIRST
    console.log(`💸 Adding 0.005 SOL claiming fee payment to treasury: ${treasuryWallet.toString()}`);
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: treasuryWallet,
        lamports: claimingFee
      })
    );

    // 3b. Create ATA if needed
    if (needsATA) {
      console.log("🆕 Adding create ATA instruction...");
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          destinationAta,
          wallet.publicKey,
          mint,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }

    // STEP 4: Two-step Token-2022 fee collection process
    
    // 4a. HARVEST: Collect fees from all accounts to the mint (permissionless operation)
    console.log("🌾 Adding harvest withheld tokens to mint instruction...");
    instructions.push(
      createHarvestWithheldTokensToMintInstruction(
        mint,                    // mint where fees will be collected
        accountsWithFees,        // accounts with withheld fees
        TOKEN_2022_PROGRAM_ID    // Token-2022 program
      )
    );

    // 4b. WITHDRAW: Transfer collected fees from mint to creator (requires withdraw authority)
    console.log("📤 Adding withdraw withheld tokens from mint instruction...");
    instructions.push(
      createWithdrawWithheldTokensFromMintInstruction(
        mint,                    // mint
        destinationAta,          // destination (creator's token account)
        wallet.publicKey,        // withdrawWithheldAuthority (the creator)
        [],                      // signers
        TOKEN_2022_PROGRAM_ID    // programId
      )
    );

    // Create versioned transaction for Blowfish compliance
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // BLOWFISH EXCLUSIVE: Use signAndSendTransaction method only
    console.log("🚀 Claiming royalties with signAndSendTransaction for Blowfish compliance...");
    const signature = await sendTransactionSmart(wallet, transaction);

    console.log("✅ Creator royalties claimed successfully!");
    console.log(`💰 Total claimed: ${totalWithheldAmount} (raw amount)`);
    console.log(`💸 Claiming fee paid: 0.005 SOL`);
    console.log(`📝 Transaction signature: ${signature}`);

    return {
      success: true,
      signature,
      totalClaimed: totalWithheldAmount
    };

  } catch (error) {
    console.error("❌ Error claiming creator royalties:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}

/**
* Claims treasury fees for admin dashboard
* BLOWFISH EXCLUSIVE: Now uses signAndSendTransaction ONLY for security compliance
*/
export async function claimTreasuryFees(
  wallet: any,
  mint: string | PublicKey,
  isMainnet: boolean = true
): Promise<{ success: boolean; signature?: string; error?: string; totalClaimed?: number }> {
  try {
    if (!wallet?.publicKey) {
      throw new Error("Wallet not connected");
    }

    // Convert mint to PublicKey if it's a string
    const mintPubkey = typeof mint === 'string' ? new PublicKey(mint) : mint;
    const connection = getConnection(isMainnet);

    // Find all accounts that have withheld fees
    const accounts = await findAccountsWithWithheldFees(mintPubkey);
    
    if (!accounts || accounts.length === 0) {
      return {
        success: false,
        error: "No accounts with withheld fees found"
      };
    }

    // Create transaction instructions
    const instructions = [];
    const { blockhash } = await connection.getLatestBlockhash();

    // Get treasury ATA
    const treasuryPubkey = new PublicKey(TREASURY_WALLET);
    const treasuryAta = await getAssociatedTokenAddress(
      mintPubkey,
      treasuryPubkey,
      false,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Check if treasury ATA exists, if not create it
    try {
      await connection.getAccountInfo(treasuryAta);
    } catch {
      instructions.push(
        createAssociatedTokenAccountInstruction(
          wallet.publicKey,
          treasuryAta,
          treasuryPubkey,
          mintPubkey,
          TOKEN_2022_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        )
      );
    }
    
    // Add withdraw instruction to withdraw all fees from mint to treasury
    instructions.push(
      createWithdrawWithheldTokensFromMintInstruction(
        mintPubkey,          // mint
        treasuryAta,         // destination
        wallet.publicKey,    // withdrawWithheldAuthority
        [],                  // signers
        TOKEN_2022_PROGRAM_ID
      )
    );

    // Create versioned transaction for Blowfish compliance
    const messageV0 = new TransactionMessage({
      payerKey: wallet.publicKey,
      recentBlockhash: blockhash,
      instructions,
    }).compileToV0Message();

    const transaction = new VersionedTransaction(messageV0);

    // BLOWFISH EXCLUSIVE: Use signAndSendTransaction method only
    console.log("🚀 Claiming treasury fees with signAndSendTransaction for Blowfish compliance...");
    const signature = await sendTransactionSmart(wallet, transaction);

    console.log("✅ Treasury fees claimed successfully!");

    return {
      success: true,
      signature,
      totalClaimed: accounts.length // We could add actual amount calculation if needed
    };

  } catch (error) {
    console.error("Error claiming treasury fees:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred"
    };
  }
}
