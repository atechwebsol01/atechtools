import React from 'react';
import { Link } from 'react-router-dom';
import WalletButton from '@/components/WalletButton';

const NavBar: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 glass-card backdrop-blur-lg bg-background/60 border-b border-white/10 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center animate-pulse-gentle">
            <span className="text-white font-bold text-xl">AT</span>
          </div>
          <span className="text-xl font-bold text-gradient-purple-blue">ATECHTOOLS</span>
        </div>
        
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-token-purple transition-colors">Home</Link>
          <Link to="/create" className="text-white hover:text-token-purple transition-colors">Create Token</Link>
          <Link to="/dashboard" className="text-white hover:text-token-purple transition-colors">Dashboard</Link>
          <Link to="/docs" className="text-white hover:text-token-purple transition-colors">Documentation</Link>
        </div>
        
        <div>
          <WalletButton />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;