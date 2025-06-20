import { PublicKey } from '@solana/web3.js';

// PDA derivation for SPL Token-2022 metadata (see SPL docs)
export function getToken2022MetadataPDA(mint: PublicKey, programId: PublicKey): PublicKey {
  // Token-2022 metadata PDA seeds: ["metadata", programId, mint]
  // This is the same as used in the spl-token-metadata program
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      programId.toBuffer(),
      mint.toBuffer(),
    ],
    programId
  );
  return pda;
}
