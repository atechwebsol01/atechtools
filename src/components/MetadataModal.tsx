import React, { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileImage, Loader2, TagIcon, Upload, X } from "lucide-react";
import { uploadToIPFS } from "@/services/metadata";
import { useToast } from "@/components/ui/use-toast";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { Token } from "@/context/TokenContext";
import { 
  updateV1,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { publicKey } from "@metaplex-foundation/umi";
import { Connection, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { SOLANA_RPC_ENDPOINT } from '@/config';
import { signerIdentity } from '@metaplex-foundation/umi';
import { walletAdapterIdentity } from '@/services/umi';

const TREASURY_WALLET = "4yQYkmfmE7hiwauaTHNgHmS8arN1BU6xm4xPoNjcbv75"; // Updated to new treasury wallet
const UPDATE_FEE = 0.2 * LAMPORTS_PER_SOL; // 0.2 SOL in lamports

interface DialogProps {
  open: boolean;
  children: React.ReactNode;
  onOpenChange?: () => void;
}

const Dialog: React.FC<DialogProps> = ({ open, children }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

const DialogContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={className}>{children}</div>
);

const DialogHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-6 border-b border-white/10">{children}</div>
);

const DialogTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <h2 className={className}>{children}</h2>
);

interface SocialLinks {
  twitter: string;
  discord: string;
  telegram: string;
  website: string;
}

interface MetadataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  token: Token | null;
}

export const MetadataDialog: React.FC<MetadataDialogProps> = ({ isOpen, onClose, token }) => {
  const { publicKey: walletPublicKey, signTransaction, signMessage } = useWallet();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    twitter: "",
    discord: "",
    telegram: "",
    website: "",
  });

  // Initialize form with token data
  React.useEffect(() => {
    if (token) {
      setName(token.name || "");
      setSymbol(token.symbol || "");
      setDescription("");  // Description might come from metadata fetch
    }
  }, [token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setName("");
    setSymbol("");
    setDescription("");
    setImageFile(null);
    setImagePreview("");
  };

  const isSolToken = token?.mint === 'So11111111111111111111111111111111111111112';
  const canUpdateName = token && token.mint && token.mint !== 'So11111111111111111111111111111111111111112' && token.mint.length === 44; // Only for non-SOL tokens

  const handleUpdateMetadata = async () => {
    if (!walletPublicKey || !signTransaction || !token) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to update token metadata",
        variant: "destructive",
      });
      return;
    }

    if (!name || !symbol) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // 1. First handle the fee payment
      const connection = new Connection(SOLANA_RPC_ENDPOINT);
      
      // Check if user has enough SOL
      const balance = await connection.getBalance(walletPublicKey);
      if (balance < UPDATE_FEE) {
        throw new Error("Insufficient SOL balance. You need 0.2 SOL to update metadata.");
      }

      // Create and send fee payment transaction
      const feeTransaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletPublicKey,
          toPubkey: new PublicKey(TREASURY_WALLET),
          lamports: UPDATE_FEE,
        })
      );

      const { blockhash } = await connection.getLatestBlockhash();
      feeTransaction.recentBlockhash = blockhash;
      feeTransaction.feePayer = walletPublicKey;

      const signedTx = await signTransaction(feeTransaction);
      const txId = await connection.sendRawTransaction(signedTx.serialize());
      await connection.confirmTransaction(txId);

      // 2. Then handle the metadata update
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadToIPFS(imageFile);
      }

      // Create metadata JSON and upload to IPFS
      const metadata = {
        name,
        symbol,
        description,
        image: imageUrl || undefined,
        social: Object.fromEntries(
          Object.entries(socialLinks).filter(([_, value]) => value !== "")
        ),
      };

      const metadataUri = await uploadToIPFS(
        new File([JSON.stringify(metadata)], 'metadata.json', { type: 'application/json' })
      );

      // Initialize UMI with wallet signer
      const umi = createUmi(SOLANA_RPC_ENDPOINT)
        .use(mplTokenMetadata())
        .use(signerIdentity(walletAdapterIdentity({
          publicKey: walletPublicKey,
          signMessage,
          signTransaction,
          signAllTransactions: undefined // add if available from wallet
        })));

      // Update metadata
      const mint = publicKey(token.mint);
      await updateV1(umi, {
        mint,
        authority: umi.identity,
        data: {
          name,
          symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          creators: null,
        },
      }).sendAndConfirm(umi);

      toast({
        title: "Success!",
        description: "Token metadata has been updated successfully",
      });

      resetForm();
      onClose();
    } catch (error: any) {
      console.error("Error updating metadata:", error);
      toast({
        title: "Error updating metadata",
        description: error.message || "An error occurred while updating the metadata",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card border-white/20 p-6">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <TagIcon className="text-token-blue" size={20} />
            Update Token Metadata
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {isSolToken ? (
              <div className="text-red-500 text-center font-bold py-4">
                You cannot update the metadata of the native SOL token.
              </div>
            ) : (
              <>
                {/* Only allow updating fields that are updatable */}
                {canUpdateName && (
                  <div>
                    <Label className="text-white">Token Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter token name"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-white">Token Symbol *</Label>
                  <Input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    placeholder="Enter token symbol"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter token description"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label className="text-white">Token Image</Label>
                  <div className="mt-2">
                    {imagePreview ? (
                      <div className="relative w-32 h-32">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview("");
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                        >
                          <X size={16} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="image-upload"
                        />
                        <Label
                          htmlFor="image-upload"
                          className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors"
                        >
                          <FileImage size={20} className="text-white" />
                          <span className="text-white">Choose Image</span>
                        </Label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-white font-medium">Social Links (Optional)</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Twitter</Label>
                      <Input
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks(prev => ({ ...prev, twitter: e.target.value }))}
                        placeholder="https://twitter.com/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Discord</Label>
                      <Input
                        value={socialLinks.discord}
                        onChange={(e) => setSocialLinks(prev => ({ ...prev, discord: e.target.value }))}
                        placeholder="https://discord.gg/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Telegram</Label>
                      <Input
                        value={socialLinks.telegram}
                        onChange={(e) => setSocialLinks(prev => ({ ...prev, telegram: e.target.value }))}
                        placeholder="https://t.me/..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label className="text-white">Website</Label>
                      <Input
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://..."
                        className="bg-white/10 border-white/20 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-token-purple/10 p-4 rounded-lg">
                  <p className="text-token-purple text-sm">
                    💡 <strong>Note:</strong> Updating metadata requires a fee of 0.2 SOL. This helps maintain the service and prevent spam.
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onClose}
              variant="outline" 
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateMetadata}
              className="btn-gradient-primary flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Upload className="mr-2" size={16} />
                  Update Metadata (0.2 SOL)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export {};
