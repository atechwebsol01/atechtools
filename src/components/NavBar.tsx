import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import WalletButton from '@/components/WalletButton';

const NavBar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 glass-card backdrop-blur-lg bg-background/60 border-b border-white/10 px-4 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center animate-pulse-gentle">
            <span className="text-white font-bold text-xl">AT</span>
          </div>
          <span className="text-xl font-bold text-gradient-purple-blue">ATECHTOOLS</span>
        </div>
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-white hover:text-token-purple transition-colors">Home</Link>
          <Link to="/create" className="text-white hover:text-token-purple transition-colors">Create Token</Link>
          <Link to="/dashboard" className="text-white hover:text-token-purple transition-colors">Dashboard</Link>
          <Link to="/docs" className="text-white hover:text-token-purple transition-colors">Documentation</Link>
        </div>
        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Open menu"
            className="text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={mobileMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        <div>
          <WalletButton />
        </div>
      </div>
      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background/95 border-t border-white/10 px-4 py-4 absolute left-0 right-0 top-full shadow-lg animate-fade-in z-40">
          <div className="flex flex-col space-y-4">
            <Link to="/" className="text-white hover:text-token-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/create" className="text-white hover:text-token-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>Create Token</Link>
            <Link to="/dashboard" className="text-white hover:text-token-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
            <Link to="/docs" className="text-white hover:text-token-purple transition-colors" onClick={() => setMobileMenuOpen(false)}>Documentation</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;