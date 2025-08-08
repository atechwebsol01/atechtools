import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Droplets, ExternalLink, AlertTriangle, CheckCircle, Loader2, Calculator } from "lucide-react";
import { Token } from "@/context/TokenContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { useToast } from "@/components/ui/use-toast";
import { 
  createCPMMPool, 
  validatePoolCreation, 
  calculatePoolCreationCosts,
  RAYDIUM_FEES 
} from "@/services/raydium";

interface DialogProps {
  open: boolean;
  children: React.ReactNode;
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

interface LiquidityDialogProps {
  token: Token;
  isOpen: boolean;
  onClose: () => void;
}

export const LiquidityDialog: React.FC<LiquidityDialogProps> = ({ token, isOpen, onClose }) => {
  const wallet = useWallet();
  const { toast } = useToast();
  
  // State management
  const [step, setStep] = useState<'info' | 'configure' | 'confirm' | 'creating'>('info');
  const [tokenAmount, setTokenAmount] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setTokenAmount('');
      setSolAmount('');
      setValidation(null);
    }
  }, [isOpen]);
  
  // Calculate costs whenever amounts change
  const costs = tokenAmount && solAmount ? 
    calculatePoolCreationCosts(tokenAmount, solAmount, token?.decimals || 9) : null;
  
  // Validate inputs when amounts change
  useEffect(() => {
    const validateInputs = async () => {
      if (!tokenAmount || !solAmount || !wallet.publicKey) return;
      
      setIsValidating(true);
      try {
        const result = await validatePoolCreation(
          wallet,
          token?.mint || '',
          tokenAmount,
          solAmount,
          true // mainnet
        );
        setValidation(result);
      } catch (error) {
        console.error('Validation error:', error);
      } finally {
        setIsValidating(false);
      }
    };
    
    const timeoutId = setTimeout(validateInputs, 500);
    return () => clearTimeout(timeoutId);
  }, [tokenAmount, solAmount, wallet.publicKey, token?.mint]);
  
  const handleCreatePool = async () => {
    if (!wallet.publicKey || !validation?.valid || !token?.mint) return;
    
    setIsCreating(true);
    try {
      const result = await createCPMMPool(wallet, {
        tokenMint: token.mint,
        tokenAmount,
        solAmount,
        isMainnet: true,
      });
      
      if (result.success) {
        toast({
          title: "🎉 Pool Created Successfully!",
          description: `Liquidity pool for ${token.symbol} is now live on Raydium!`,
        });
        
        // Show success and provide pool details
        setStep('creating');
        
        // Close after showing success
        setTimeout(() => {
          onClose();
          setStep('info');
        }, 3000);
      } else {
        toast({
          title: "Pool Creation Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        setStep('configure');
      }
    } catch (error) {
      console.error('Pool creation error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setStep('configure');
    } finally {
      setIsCreating(false);
    }
  };
  
  const renderContent = () => {
    switch (step) {
      case 'info':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-white/80 text-center">
                Create a liquidity pool for <strong>{token?.symbol}</strong> on Raydium!
              </p>
              
              <div className="bg-token-blue/10 p-4 rounded-lg border border-token-blue/20">
                <h4 className="text-token-blue font-medium mb-2 flex items-center">
                  <CheckCircle size={16} className="mr-2" />
                  Token-2022 + Transfer Fees Supported!
                </h4>
                <p className="text-white/70 text-sm">
                  Your token with transfer fees is fully compatible with Raydium's new CPMM pools.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/60">Protocol Fee</p>
                  <p className="text-white font-medium">{RAYDIUM_FEES.CPMM_POOL_CREATION} SOL</p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <p className="text-white/60">Trading Fee</p>
                  <p className="text-white font-medium">{RAYDIUM_FEES.TRADING_FEE_BPS / 100}%</p>
                </div>
              </div>
              
              <div className="bg-token-yellow/10 p-4 rounded-lg border border-token-yellow/20">
                <p className="text-token-yellow text-sm">
                  <AlertTriangle size={14} className="inline mr-1" />
                  <strong>Important:</strong> Pool creation is permanent. Choose your initial price carefully as it sets the market rate.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={onClose}
                variant="outline" 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => setStep('configure')}
                className="btn-gradient-primary flex-1"
              >
                <Calculator className="mr-2" size={16} />
                Create Pool
              </Button>
              <Button 
                onClick={() => window.open('https://raydium.io/liquidity/create-pool', '_blank')}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="mr-2" size={16} />
                Use Raydium
              </Button>
            </div>
          </div>
        );
        
      case 'configure':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="tokenAmount">
                  {token.symbol} Amount
                </Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  placeholder="e.g., 100000"
                  value={tokenAmount}
                  onChange={(e) => setTokenAmount(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-white/60 mt-1">
                  Recommended: 20-50% of total supply
                </p>
              </div>
              
              <div>
                <Label htmlFor="solAmount">
                  SOL Amount
                </Label>
                <Input
                  id="solAmount"
                  type="number"
                  placeholder="e.g., 10"
                  value={solAmount}
                  onChange={(e) => setSolAmount(e.target.value)}
                  className="mt-1"
                  step="0.001"
                />
                <p className="text-xs text-white/60 mt-1">
                  Sets initial token price
                </p>
              </div>
            </div>
            
            {/* Cost Breakdown */}
            {costs && (
              <div className="bg-white/5 p-4 rounded-lg space-y-2">
                <h4 className="text-white font-medium">Cost Breakdown</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Protocol Fee:</span>
                    <span className="text-white">{costs.protocolFee} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Network Fees:</span>
                    <span className="text-white">{costs.networkFees} SOL</span>
                  </div>
                </div>
                <div className="border-t border-white/10 pt-2 flex justify-between font-medium">
                  <span className="text-white">Total Required:</span>
                  <span className="text-gradient-purple-blue">{costs.minimumSOL.toFixed(3)} SOL</span>
                </div>
              </div>
            )}
            
            {/* Validation Results */}
            {isValidating && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="animate-spin mr-2" size={20} />
                <span className="text-white/60">Validating...</span>
              </div>
            )}
            
            {validation && !isValidating && (
              <div className="space-y-2">
                {validation.errors.map((error: string, i: number) => (
                  <div key={i} className="flex items-center text-red-400 text-sm">
                    <AlertTriangle size={14} className="mr-2 flex-shrink-0" />
                    {error}
                  </div>
                ))}
                
                {validation.warnings.map((warning: string, i: number) => (
                  <div key={i} className="flex items-center text-yellow-400 text-sm">
                    <AlertTriangle size={14} className="mr-2 flex-shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('info')}
                variant="outline" 
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={() => setStep('confirm')}
                className="btn-gradient-primary flex-1"
                disabled={!validation?.valid || isValidating}
              >
                Review & Create
              </Button>
            </div>
          </div>
        );
        
      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-2">Confirm Pool Creation</h3>
              <p className="text-white/70">Review your liquidity pool details</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Token:</span>
                <span className="text-white font-medium">{tokenAmount} {token.symbol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">SOL:</span>
                <span className="text-white font-medium">{solAmount} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Initial Price:</span>
                <span className="text-white font-medium">
                  {(parseFloat(solAmount) / parseFloat(tokenAmount)).toFixed(6)} SOL per {token.symbol}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between font-medium">
                <span className="text-white">Total Cost:</span>
                <span className="text-gradient-purple-blue">{costs?.totalCost.toFixed(3)} SOL</span>
              </div>
            </div>
            
            <div className="bg-token-purple/10 p-4 rounded-lg border border-token-purple/20">
              <p className="text-token-purple text-sm">
                <CheckCircle size={14} className="inline mr-1" />
                This will create a permanent liquidity pool on Raydium with Token-2022 + Transfer Fee support.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button 
                onClick={() => setStep('configure')}
                variant="outline" 
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleCreatePool}
                className="btn-gradient-primary flex-1"
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />
                    Creating...
                  </>
                ) : (
                  <>
                    <Droplets className="mr-2" size={16} />
                    Create Pool
                  </>
                )}
              </Button>
            </div>
          </div>
        );
        
      case 'creating':
        return (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-token-green/20 flex items-center justify-center mx-auto">
              <CheckCircle size={32} className="text-token-green" />
            </div>
            <h3 className="text-xl font-bold text-gradient-purple-blue">
              Pool Created Successfully! 🎉
            </h3>
            <p className="text-white/80">
              Your {token.symbol} liquidity pool is now live on Raydium!
            </p>
            <div className="bg-token-green/10 p-4 rounded-lg">
              <p className="text-token-green text-sm">
                Users can now trade your Token-2022 with transfer fees on Raydium!
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Dialog open={isOpen}>
      <DialogContent className="glass-card border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-white flex items-center gap-2">
              <Droplets className="text-token-blue" size={20} />
              {step === 'creating' ? 'Success!' : `Create Pool - ${token?.symbol}`}
            </DialogTitle>
            {step !== 'creating' && (
              <Button 
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white"
              >
                ×
              </Button>
            )}
          </div>
        </DialogHeader>
        
        <div className="p-6">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
};