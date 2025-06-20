// components/HeroSection.tsx - Updated with viral elements

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ParticleBackground from '@/components/ParticleBackground';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, TrendingUp, Users } from 'lucide-react';

const HeroSection: React.FC = () => {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const [currentSuccess, setCurrentSuccess] = useState(0);
  
  // Rotating success stories
  const successStories = [
    { token: "$MOON", marketCap: "$2.1M", time: "in 3 days" },
    { token: "$ROCKET", marketCap: "$890K", time: "in 24 hours" },
    { token: "$DIAMOND", marketCap: "$1.5M", time: "in 5 days" },
    { token: "$PEPE2", marketCap: "$3.2M", time: "in 1 week" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuccess((prev) => (prev + 1) % successStories.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (!publicKey) {
      setVisible(true);
    }
  };

  return (
    <div className="relative min-h-[90vh] flex flex-col items-center justify-center py-20 overflow-hidden">
      <ParticleBackground />
      
      {/* Urgent Banner */}
      <motion.div 
        className="absolute top-0 left-0 right-0 bg-gradient-to-r from-token-purple to-token-pink py-3 text-center z-20"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <p className="text-white font-medium flex items-center justify-center gap-2">
          <Sparkles className="animate-pulse" size={20} />
          <span>🔥 LIMITED TIME: Token creation is FREE! Ends in 48 hours!</span>
          <Sparkles className="animate-pulse" size={20} />
        </p>
      </motion.div>
      
      <div className="container relative z-10 mx-auto text-center px-4 mt-12">
        {/* Success Story Ticker */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSuccess}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-token-green/20 rounded-full border border-token-green/30"
            >
              <TrendingUp className="text-token-green" size={16} />
              <span className="text-token-green font-medium">
                Latest: {successStories[currentSuccess].token} reached {successStories[currentSuccess].marketCap} {successStories[currentSuccess].time}
              </span>
            </motion.div>
          </AnimatePresence>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-gradient-purple-blue">Create Solana Tokens</span>
          <br />
          <span className="text-white">in</span>{" "}
          <span className="text-gradient-pink-purple">30 Seconds</span>
        </motion.h1>
        
        <motion.p 
          className="text-xl md:text-2xl max-w-3xl mx-auto mb-4 text-white/80"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          The only platform where <span className="text-token-green font-bold">you earn transfer fees every time your token moves</span>.<br />
          Build your own passive income stream. No coding required.
        </motion.p>
        
        {/* Live Stats */}
        <motion.div 
          className="flex flex-wrap justify-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Users className="text-token-purple" size={20} />
            <span className="text-white/80">
              <span className="font-bold text-white">12,847</span> Active Creators
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="text-token-yellow" size={20} />
            <span className="text-white/80">
              <span className="font-bold text-white">89,423</span> Tokens Created
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-token-green" size={20} />
            <span className="text-white/80">
              <span className="font-bold text-white">15,234 SOL</span> Earned by Creators
            </span>
          </div>
        </motion.div>
        
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {publicKey ? (
            <Link to="/create">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button className="btn-gradient-primary text-lg px-10 py-7 rounded-xl shadow-lg hover:shadow-glow-purple group">
                  <span>Create Your Token FREE</span>
                  <Zap className="ml-2 group-hover:animate-pulse" size={20} />
                </Button>
              </motion.div>
            </Link>
          ) : (
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleGetStarted}
                className="btn-gradient-primary text-lg px-10 py-7 rounded-xl shadow-lg hover:shadow-glow-purple group"
              >
                <span>Start Creating Now - It's FREE!</span>
                <Zap className="ml-2 group-hover:animate-pulse" size={20} />
              </Button>
            </motion.div>
          )}
          
          <Link to="/docs">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                variant="outline" 
                className="text-lg px-10 py-7 rounded-xl border-2 border-token-purple text-token-purple hover:bg-token-purple/10 backdrop-blur-md"
              >
                See How It Works
              </Button>
            </motion.div>
          </Link>
        </motion.div>
        
        {/* Social Proof */}
        <motion.div 
          className="mt-12 glass-card p-6 rounded-2xl max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-white/60 mb-3">TRUSTED BY THE BEST</p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            <motion.div 
              className="text-white/30 font-mono text-sm hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              SOLANA LABS
            </motion.div>
            <motion.div 
              className="text-white/30 font-mono text-sm hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              METAPLEX
            </motion.div>
            <motion.div 
              className="text-white/30 font-mono text-sm hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              MAGIC EDEN
            </motion.div>
            <motion.div 
              className="text-white/30 font-mono text-sm hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              PHANTOM
            </motion.div>
            <motion.div 
              className="text-white/30 font-mono text-sm hover:text-white/60 transition-colors"
              whileHover={{ scale: 1.1 }}
            >
              JUPITER
            </motion.div>
          </div>
        </motion.div>

        {/* Comparison Table Mini */}
        <motion.div 
          className="mt-8 inline-flex items-center gap-4 px-6 py-3 bg-destructive/10 rounded-lg border border-destructive/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <span className="text-white/80">Others charge <span className="line-through text-destructive">0.3-0.5 SOL</span></span>
          <span className="text-token-green font-bold">We charge: FREE!</span>
        </motion.div>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent"></div>
      
      {/* Floating Elements */}
      <motion.div
        className="absolute top-1/4 left-10 w-20 h-20 bg-token-purple/20 rounded-full blur-xl"
        animate={{ 
          y: [0, -20, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-10 w-32 h-32 bg-token-blue/20 rounded-full blur-xl"
        animate={{ 
          y: [0, 20, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </div>
  );
};

export default HeroSection;