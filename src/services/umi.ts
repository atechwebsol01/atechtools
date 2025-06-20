import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
// Use signerIdentity from the correct package
// import { signerIdentity } from '@metaplex-foundation/umi';
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata';

export function getUmi(connection: any) {
  // Create a Umi instance and register the Token Metadata plugin
  // NOTE: To set the identity, use signerIdentity() from Umi, not a custom object.
  return createUmi(connection.rpcEndpoint)
    .use(mplTokenMetadata());
  // To set the identity: .use(signerIdentity(payer)) if payer is a Umi-compatible Signer
}

// Helper: create a Umi-compatible signer from a Solana wallet adapter
// Add type annotations for wallet and parameters
export function walletAdapterIdentity(
  wallet: {
    publicKey: any;
    signMessage?: (message: Uint8Array | Buffer) => Promise<Uint8Array>;
    signTransaction?: (transaction: any) => Promise<any>;
    signAllTransactions?: (transactions: any[]) => Promise<any[]>;
  }
) {
  return {
    publicKey: wallet.publicKey,
    async signMessage(message: Uint8Array | Buffer): Promise<Uint8Array> {
      if (!wallet.signMessage) throw new Error('Wallet does not support signMessage');
      return await wallet.signMessage(message);
    },
    async signTransaction(transaction: any): Promise<any> {
      if (!wallet.signTransaction) throw new Error('Wallet does not support signTransaction');
      return await wallet.signTransaction(transaction);
    },
    async signAllTransactions(transactions: any[]): Promise<any[]> {
      if (!wallet.signAllTransactions) throw new Error('Wallet does not support signAllTransactions');
      return await wallet.signAllTransactions(transactions);
    },
  };
}
