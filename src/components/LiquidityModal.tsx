import React from "react";
import { Button } from "@/components/ui/button";
import { Droplets, ExternalLink } from "lucide-react";
import { Token } from "@/context/TokenContext";

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
  return (
    <Dialog open={isOpen}>
      <DialogContent className="glass-card border-white/20 p-6">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Droplets className="text-token-blue" size={20} />
            Add Liquidity - {token?.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <p className="text-white/70">
              To create a liquidity pool for your token, you'll need to:
            </p>
            
            <ul className="list-disc pl-5 text-white/70 space-y-2">
              <li>Have sufficient SOL for transaction fees (minimum 0.1 SOL recommended)</li>
              <li>Prepare enough tokens for initial liquidity (20-50% of total supply recommended)</li>
              <li>Create the pool on Raydium's official interface for the best experience</li>
            </ul>
            
            <div className="bg-token-purple/10 p-4 rounded-lg">
              <p className="text-token-purple text-sm">
                💡 <strong>Important:</strong> Creating a liquidity pool is a critical step that requires careful consideration of initial token prices and liquidity amounts. We recommend using Raydium's official interface for the best experience and security.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={onClose}
              variant="outline" 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => window.open('https://raydium.io/liquidity/create-pool', '_blank')}
              className="btn-gradient-primary flex-1"
            >
              <ExternalLink className="mr-2" size={16} />
              Create on Raydium
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};