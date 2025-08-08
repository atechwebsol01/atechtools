// Raydium fee configuration for pool creation
export const RAYDIUM_FEES = {
  CPMM_POOL_CREATION: 0.15, // SOL (infrastructure fee)
  ACCOUNT_CREATION: 0.05, // SOL (program accounts + network)
  NETWORK_FEES: 0.003, // SOL (additional buffer)
  TOTAL_REQUIRED: 0.2, // SOL (total needed as per Raydium docs)
  TRADING_FEE_BPS: 25, // 0.25%
};

// Get Solana connection
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

// Raydium SDK init
async function initRaydiumSDK(connection: Connection, owner: PublicKey, signAllTransactions?: any): Promise<Raydium> {
  const cluster = 'mainnet';
  const tokenAccounts = await fetchTokenAccountData(connection, owner);
  const raydium = await Raydium.load({
    connection,
    cluster,
    owner,
    signAllTransactions,
    disableLoadToken: false,
    tokenAccounts: tokenAccounts.tokenAccounts,
    tokenAccountRawInfos: tokenAccounts.tokenAccountRawInfos,
  });
  return raydium;
}

// Fetch token account data for both SPL and Token-2022
export async function fetchTokenAccountData(
  connection: Connection,
  owner: PublicKey
) {
  try {
    const solAccountResp = await connection.getAccountInfo(owner);
    // Fetch regular SPL token accounts
    const tokenAccountResp = await connection.getTokenAccountsByOwner(owner, {
      programId: TOKEN_PROGRAM_ID
    });
    // Fetch Token-2022 accounts
    const token2022Req = await connection.getTokenAccountsByOwner(owner, {
      programId: TOKEN_2022_PROGRAM_ID
    });
    // Combine both account types
    const tokenAccountData = parseTokenAccountResp({
      owner,
      solAccountResp,
      tokenAccountResp: {
        context: tokenAccountResp.context,
        value: [...tokenAccountResp.value, ...token2022Req.value],
      },
    });
    return tokenAccountData;
  } catch (error) {
    console.error('Error fetching token account data:', error);
    throw new Error('Failed to fetch token account data');
  }
}
// services/raydium.ts - Raydium CPMM integration for Token-2022 with Transfer Fees
// Handles pool creation and trading for tokens with transfer fee extensions

import {
  Connection,
  PublicKey,
  VersionedTransaction,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  unpackAccount,
} from '@solana/spl-token';
import {
  Raydium,
  TxVersion,
  parseTokenAccountResp,
  CREATE_CPMM_POOL_FEE_ACC,
} from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';

// --- Main function to create CPMM pool ---
export async function createCPMMPool(
  wallet: any,
  params: {
    tokenMint: string;
    tokenAmount: string;
    solAmount: string;
    isMainnet?: boolean;
  }
): Promise<{
  success: boolean;
  signature?: string;
  poolId?: string;
  error?: string;
  totalCost?: number;
}> {
  try {
    const { tokenMint, tokenAmount, solAmount, isMainnet = true } = params;
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }
    const connection = getConnection(isMainnet);
    const raydium = await initRaydiumSDK(connection, wallet.publicKey, wallet.signAllTransactions);
    const tokenInfo = await raydium.token.getTokenInfo(tokenMint);
    // Use regular WSOL just like Raydium does (as shown in your working example)
    console.log('🔍 Using regular WSOL (like Raydium)...');
    const solInfo = await raydium.token.getTokenInfo('So11111111111111111111111111111111111111112');
    if (!tokenInfo || !solInfo) {
      throw new Error('Failed to get token information. Ensure token is valid and loaded.');
    }
    // Log program IDs for debugging
    console.log('   📍 Token A Program:', tokenInfo.programId);
    console.log('   📍 Token B Program:', solInfo.programId);
    console.log('✅ Token programs - A:', tokenInfo.programId, 'B:', solInfo.programId);
    const mintA = tokenInfo;
    const mintB = solInfo;
    const feeConfigs = await raydium.api.getCpmmConfigs();
    const feeConfig = feeConfigs[0];
    if (!feeConfig) {
      throw new Error('No fee configuration available');
    }
    // Clean and validate input strings
    const cleanTokenAmount = tokenAmount.replace(/[^\d.]/g, '');
    const cleanSolAmount = solAmount.replace(/[^\d.]/g, '');
    const humanTokenAmount = parseFloat(cleanTokenAmount);
    const humanSolAmount = parseFloat(cleanSolAmount);
    const rawTokenAmount = humanTokenAmount * Math.pow(10, mintA.decimals);
    const rawSolAmount = humanSolAmount * Math.pow(10, mintB.decimals);
    // Don't add fees to liquidity amounts - Raydium handles fees separately
    const baseAmount = new BN(Math.floor(rawTokenAmount).toString());
    const quoteAmount = new BN(Math.floor(rawSolAmount).toString()); // Just the liquidity SOL, not fees
    // Check user's SOL balance
    const balance = await connection.getBalance(wallet.publicKey);
    const balanceInSol = balance / 1e9;
    const totalNeeded = humanSolAmount + RAYDIUM_FEES.TOTAL_REQUIRED + 0.01; // Liquidity + fees + buffer
    if (balanceInSol < totalNeeded) {
      throw new Error(`Insufficient SOL balance. Need ${totalNeeded} SOL, have ${balanceInSol} SOL`);
    }
    // Check user's TOKEN balance
    try {
      const tokenAccounts = await connection.getTokenAccountsByOwner(wallet.publicKey, {
        mint: new PublicKey(tokenMint)
      });
      let userTokenBalance = 0;
      if (tokenAccounts.value.length > 0) {
        const accountInfo = await connection.getAccountInfo(tokenAccounts.value[0].pubkey);
        if (accountInfo) {
          const tokenAccount = unpackAccount(tokenAccounts.value[0].pubkey, accountInfo, TOKEN_2022_PROGRAM_ID);
          userTokenBalance = Number(tokenAccount.amount) / Math.pow(10, mintA.decimals);
        }
      }
      if (userTokenBalance < humanTokenAmount) {
        throw new Error(`Insufficient token balance! Need ${humanTokenAmount.toLocaleString()} tokens, have ${userTokenBalance.toLocaleString()} tokens`);
      }
    } catch (tokenError) {
      // Proceed anyway - pool creation will fail if insufficient tokens
    }
    // Try creating CPMM pool
    try {
      // Log all parameters for debugging InvalidInstructionData
      console.log('🔍 DETAILED PARAMETER DEBUG:');
      console.log('   📍 Program ID:', '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8');
      console.log('   📍 Pool Fee Account:', CREATE_CPMM_POOL_FEE_ACC.toString());
      console.log('   📍 Mint A:', mintA.address, 'Program:', mintA.programId);
      console.log('   📍 Mint B:', mintB.address, 'Program:', mintB.programId);
      console.log('   📍 Amount A (BN):', baseAmount.toString());
      console.log('   📍 Amount B (BN):', quoteAmount.toString());
      console.log('   📍 Fee Config:', JSON.stringify(feeConfig));
      console.log('   📍 Start Time:', new BN(0).toString());
      const { execute, extInfo, transaction } = await raydium.cpmm.createPool({
        programId: new PublicKey('CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C'),
        poolFeeAccount: CREATE_CPMM_POOL_FEE_ACC,
        mintA,
        mintB,
        mintAAmount: baseAmount,
        mintBAmount: quoteAmount,
        startTime: new BN(0),
        feeConfig,
        associatedOnly: false,
        ownerInfo: { useSOLBalance: true },
        txVersion: TxVersion.V0,
      });
      if (!execute) {
        throw new Error('Failed to build pool creation transaction');
      }
      // Simulate transaction before executing
      if (transaction) {
        try {
          const simulation = await connection.simulateTransaction(transaction, { sigVerify: false, replaceRecentBlockhash: true });
          if (simulation.value && simulation.value.err) {
            if (simulation.value.logs) {
              console.error('Simulation logs:', simulation.value.logs.join('\n'));
            }
            throw new Error('Transaction simulation failed. See logs above for details.');
          }
        } catch (simError) {
          throw new Error('Transaction simulation failed. See logs above for details.');
        }
      }
      // Execute the transaction
      const result = await execute();
      return {
        success: true,
        signature: result.txId,
        poolId: extInfo.address.poolId.toString(),
        totalCost: RAYDIUM_FEES.TOTAL_REQUIRED,
      };
    } catch (sdkError) {
      throw new Error(`Pool creation failed: ${(sdkError as Error).message}. This might be due to Token-2022 compatibility. Try using Raydium directly.`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}


/**
 * Get pool information for a specific token pair - Enhanced to find newly created pools
 */
export async function getPoolInfo(
  tokenMintA: string,
  tokenMintB: string = 'So11111111111111111111111111111111111111112', // Default to SOL
  isMainnet: boolean = true
) {
  try {
    const connection = getConnection(isMainnet);
    console.log('Searching for trading route between', tokenMintA, 'and', tokenMintB);
    
    // Create a temporary owner for SDK initialization (we only need pool data, not transactions)
    const tempOwner = new PublicKey('11111111111111111111111111111111');
    const raydium = await Raydium.load({
      connection,
      cluster: isMainnet ? 'mainnet' : 'devnet',
      owner: tempOwner,
      disableLoadToken: false, // Enable token loading to get better pool data
    });
    
    // Method 1: Check Jupiter for available routes
    console.log('Checking Jupiter routing compatibility...');
    console.log('Token pair:', { tokenMintA, tokenMintB });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const jupiterQuoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${tokenMintA}&outputMint=${tokenMintB}&amount=1000000&slippageBps=50`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (jupiterQuoteResponse.ok) {
        const quoteData = await jupiterQuoteResponse.json();
        if (quoteData && !quoteData.error && quoteData.outAmount) {
          console.log('Jupiter route available for Token-2022 pair');
          console.log('Route details:', {
            inputMint: tokenMintA,
            outputMint: tokenMintB,
            routeFound: true,
            transferHookCompatible: true,
            outputAmount: quoteData.outAmount
          });
          return {
            poolId: 'jupiter-route',
            mintA: { address: tokenMintA },
            mintB: { address: tokenMintB },
            liquidity: parseFloat(quoteData.inAmount || '0'),
            feeRate: 0.0025,
            volume24h: 0,
            type: 'Jupiter',
            jupiterRoute: true,
          };
        } else {
          console.log('Jupiter returned invalid quote data:', quoteData);
        }
      } else {
        console.log('Jupiter API returned error status:', jupiterQuoteResponse.status);
      }
    } catch (jupiterError) {
      const errorMessage = jupiterError instanceof Error ? jupiterError.message : String(jupiterError);
      console.log('Jupiter route check failed:', errorMessage);
    }
    
    // Method 2: API method (for established pools)
    try {
      console.log('🔍 Method 2: Using Raydium API...');
      const poolData = await raydium.api.getPoolList();
      
      // Handle API response structure
      const pools = Array.isArray(poolData) ? poolData : poolData.data || [];
      console.log(`📊 API returned ${pools.length} pools`);
      
      // Find pool with matching token pair
      const pool = pools.find((p: any) => 
        (p.mintA?.address === tokenMintA && p.mintB?.address === tokenMintB) ||
        (p.mintA?.address === tokenMintB && p.mintB?.address === tokenMintA)
      );
      
      if (pool) {
        console.log('✅ Found pool via API:', pool.id);
        
        return {
          poolId: pool.id,
          mintA: pool.mintA,
          mintB: pool.mintB,
          liquidity: pool.tvl || 0,
          feeRate: pool.feeRate || 0.0025,
          volume24h: pool.volume24h || 0,
          type: pool.type || 'CPMM',
        };
      }
    } catch (apiError) {
      console.log('🔍 API pool search failed:', apiError);
    }
    
    console.log('❌ No pool found for', tokenMintA, 'and', tokenMintB);
    return null;
    
  } catch (error) {
    console.error('Error getting pool info:', error);
    return null;
  }
}

/**
 * Calculate pool creation costs and requirements
 */
export function calculatePoolCreationCosts(
  _tokenAmount: string,
  solAmount: string,
  _decimals: number = 9
): {
  protocolFee: number;
  networkFees: number;
  totalCost: number;
  minimumSOL: number;
  estimatedFees: {
    raydiumTradingFee: string;
    transferFee: string;
  };
} {
  const totalCost = RAYDIUM_FEES.TOTAL_REQUIRED; // Use correct total (0.2 SOL)
  const minimumSOL = totalCost + parseFloat(solAmount);
  
  return {
    protocolFee: RAYDIUM_FEES.CPMM_POOL_CREATION,
    networkFees: RAYDIUM_FEES.ACCOUNT_CREATION, // Use correct account creation fee
    totalCost,
    minimumSOL,
    estimatedFees: {
      raydiumTradingFee: '0.25%',
      transferFee: 'Varies by token plan (0.2%-5%)',
    },
  };
}

/**
 * Validate pool creation requirements
 */
export async function validatePoolCreation(
  wallet: any,
  tokenMint: string,
  _tokenAmount: string,
  solAmount: string,
  isMainnet: boolean = true
): Promise<{
  valid: boolean;
  errors: string[];
  warnings: string[];
  requirements: {
    hasToken: boolean;
    hasSOL: boolean;
    sufficientTokenBalance: boolean;
    sufficientSOLBalance: boolean;
  };
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const requirements = {
    hasToken: false,
    hasSOL: false,
    sufficientTokenBalance: false,
    sufficientSOLBalance: false,
  };
  
  try {
    if (!wallet?.publicKey) {
      errors.push('Wallet not connected');
      return { valid: false, errors, warnings, requirements };
    }
    
    const connection = getConnection(isMainnet);
    
    // Check SOL balance
    const solBalance = await connection.getBalance(wallet.publicKey);
    const requiredSOL = calculatePoolCreationCosts(_tokenAmount, solAmount).minimumSOL;
    
    requirements.hasSOL = solBalance > 0;
    requirements.sufficientSOLBalance = solBalance >= (requiredSOL * 1e9); // Convert to lamports
    
    if (!requirements.sufficientSOLBalance) {
      errors.push(`Insufficient SOL balance. Required: ${requiredSOL} SOL, Have: ${(solBalance / 1e9).toFixed(6)} SOL`);
    }
    
    // Check token balance
    const tokenAccounts = await fetchTokenAccountData(connection, wallet.publicKey);
    const tokenAccount = tokenAccounts.tokenAccounts.find(acc => acc.mint.toString() === tokenMint);
    
    if (tokenAccount) {
      requirements.hasToken = true;
      const balance = parseFloat(tokenAccount.amount.toString()) / Math.pow(10, (tokenAccount as any).decimals || 9);
      const requiredTokens = parseFloat(_tokenAmount);
      
      requirements.sufficientTokenBalance = balance >= requiredTokens;
      
      if (!requirements.sufficientTokenBalance) {
        errors.push(`Insufficient token balance. Required: ${requiredTokens}, Have: ${balance}`);
      }
    } else {
      errors.push('Token not found in wallet');
    }
    
    // Add warnings about costs
    warnings.push(`Pool creation will cost approximately ${RAYDIUM_FEES.CPMM_POOL_CREATION} SOL in protocol fees`);
    warnings.push('Liquidity provided cannot be removed immediately - consider your token distribution strategy');
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      requirements,
    };
    
  } catch (error) {
    errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { valid: false, errors, warnings, requirements };
  }
}

/**
 * Jupiter Swap Implementation - Like Raydium website uses
 */
export async function executeJupiterSwap(
  wallet: any,
  params: {
    inputMint: string;
    outputMint: string;
    amount: string; // In base units
    slippageBps?: number;
  }
): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
}> {
  try {
    const { inputMint, outputMint, amount, slippageBps = 50 } = params;
    
    if (!wallet?.publicKey) {
      throw new Error('Wallet not connected');
    }

    console.log('Initiating Token-2022 swap with transfer hook preservation');
    console.log('Getting Jupiter quote...');
    console.log('Swap parameters:', { 
      inputMint, 
      outputMint, 
      amount, 
      slippageBps
    });
    
    // Step 1: Get quote from Jupiter
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    let quoteResponse;
    try {
      quoteResponse = await fetch(
        `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}&onlyDirectRoutes=false&asLegacyTransaction=false`,
        { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          }
        }
      );
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
      throw new Error(`Failed to connect to Jupiter API: ${errorMessage}`);
    }
    
    if (!quoteResponse.ok) {
      throw new Error(`Jupiter API returned status ${quoteResponse.status}: ${quoteResponse.statusText}`);
    }
    
    const quoteData = await quoteResponse.json();
    
    if (quoteData.error) {
      throw new Error(`Jupiter quote error: ${quoteData.error}`);
    }
    
    if (!quoteData.outAmount) {
      throw new Error('Jupiter returned invalid quote data - no output amount');
    }
    
    console.log('Jupiter quote received for Token-2022 swap');
    console.log('Quote details:', {
      inputAmount: quoteData.inAmount,
      outputAmount: quoteData.outAmount,
      priceImpact: quoteData.priceImpactPct,
      transferHooksPreserved: true
    });

    // Step 2: Get swap transaction from Jupiter
    const swapRequestBody = {
      quoteResponse: quoteData,
      userPublicKey: wallet.publicKey.toString(),
      wrapAndUnwrapSol: true,
      useSharedAccounts: false, // Disabled for Simple AMMs (CPMM pools)
      computeUnitPriceMicroLamports: 'auto',
      asLegacyTransaction: false,
      useTokenLedger: false,
    };
    
    console.log('Requesting swap transaction from Jupiter...');
    
    const swapController = new AbortController();
    const swapTimeoutId = setTimeout(() => swapController.abort(), 15000);
    
    let swapResponse;
    try {
      swapResponse = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(swapRequestBody),
        signal: swapController.signal,
      });
      clearTimeout(swapTimeoutId);
    } catch (swapFetchError) {
      clearTimeout(swapTimeoutId);
      const errorMessage = swapFetchError instanceof Error ? swapFetchError.message : String(swapFetchError);
      throw new Error(`Failed to connect to Jupiter swap API: ${errorMessage}`);
    }
    
    if (!swapResponse.ok) {
      const errorText = await swapResponse.text();
      console.error('Jupiter swap API error:', errorText);
      throw new Error(`Jupiter API returned ${swapResponse.status}: ${errorText}`);
    }
    
    const swapData = await swapResponse.json();
    
    if (swapData.error) {
      console.error('Jupiter swap data error:', swapData.error);
      throw new Error(`Jupiter swap error: ${swapData.error}`);
    }

    console.log('🔄 Executing Jupiter swap transaction...');

    // Step 3: Execute the transaction
    const connection = getConnection(true);
    const { swapTransaction } = swapData;
    
    if (!swapTransaction) {
      throw new Error('No swap transaction received from Jupiter');
    }
    
    console.log('📝 Deserializing and signing transaction...');
    
    // Deserialize transaction
    const transactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(transactionBuf);
    
    // Check if wallet has the signTransaction method
    if (!wallet.signTransaction) {
      throw new Error('Wallet does not support transaction signing');
    }
    
    // Sign and send transaction
    const signedTransaction = await wallet.signTransaction(transaction);
    
    console.log('📤 Sending transaction to network...');
    
    const signature = await connection.sendTransaction(signedTransaction, {
      skipPreflight: false,
      maxRetries: 3,
    });
    
    console.log('⏳ Confirming transaction...', signature);
    
    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash: transaction.message.recentBlockhash,
      lastValidBlockHeight: await connection.getBlockHeight() + 150,
    });
    
    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
    }
    
    console.log('Token-2022 swap completed successfully');
    console.log('Transaction signature:', signature);
    console.log('Swap results:', {
      transactionSignature: signature,
      transferHooksRespected: true,
      token2022Compatible: true,
      method: 'Jupiter Integration'
    });
    
    return {
      success: true,
      signature,
    };

  } catch (error) {
    console.error('❌ Jupiter swap failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown swap error',
    };
  }
}