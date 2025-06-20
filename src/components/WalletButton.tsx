import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { truncateAddress } from '@/lib/utils';

const WalletButton: React.FC = () => {
  const { publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleClick = () => {
    if (publicKey) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <Button
      onClick={handleClick}
      className="bg-gradient-to-r from-token-purple to-token-blue hover:from-token-purple/90 hover:to-token-blue/90 text-white rounded-lg px-4 py-2 font-medium transition-all duration-300 shadow-md hover:shadow-lg"
    >
      {publicKey
        ? truncateAddress(publicKey.toString())
        : 'Connect Wallet'}
    </Button>
  );
};

export default WalletButton;