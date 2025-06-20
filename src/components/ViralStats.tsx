// components/ViralStats.tsx - Live counters and FOMO mechanics

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Zap } from 'lucide-react';
import { VIRAL_CONFIG } from '@/config';

const ViralStats: React.FC = () => {
  const [tokensCreatedToday, setTokensCreatedToday] = useState(VIRAL_CONFIG.tokensCreatedToday);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [lastCreatedTime, setLastCreatedTime] = useState(2);
  
  // Simulate live token creation
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly increment tokens created
      if (Math.random() > 0.7) {
        setTokensCreatedToday(prev => prev + 1);
        setLastCreatedTime(0); // Reset to "just now"
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Update last created time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastCreatedTime(prev => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Rotate success stories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % VIRAL_CONFIG.successStories.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  const getLastCreatedText = () => {
    if (lastCreatedTime === 0) return 'just now';
    if (lastCreatedTime === 1) return '1 minute ago';
    if (lastCreatedTime < 60) return `${lastCreatedTime} minutes ago`;
    return 'over an hour ago';
  };

  return (
    <div className="glass-card p-4 rounded-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Live Token Counter */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Zap className="text-token-yellow mr-2" size={20} />
            <span className="text-white/60 text-sm">Tokens Created Today</span>
          </div>
          <motion.div
            key={tokensCreatedToday}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-gradient-purple-blue"
          >
            {tokensCreatedToday.toLocaleString()}
          </motion.div>
          <p className="text-white/40 text-xs mt-1">
            Last created: {getLastCreatedText()}
          </p>
        </motion.div>

        {/* Success Story Ticker */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-token-green mr-2" size={20} />
            <span className="text-white/60 text-sm">Latest Success</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStoryIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-xl font-bold text-white">
                {VIRAL_CONFIG.successStories[currentStoryIndex].token}
              </div>
              <p className="text-token-green text-sm">
                {VIRAL_CONFIG.successStories[currentStoryIndex].marketCap}
              </p>
              <p className="text-white/40 text-xs">
                {VIRAL_CONFIG.successStories[currentStoryIndex].time}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Active Users */}
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-2">
            <Users className="text-token-purple mr-2" size={20} />
            <span className="text-white/60 text-sm">Active Creators</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {Math.floor(tokensCreatedToday * 0.3).toLocaleString()}
          </div>
          <p className="text-white/40 text-xs mt-1">
            Online now
          </p>
        </motion.div>
      </div>

      {/* FOMO Banner */}
      <motion.div 
        className="mt-4 p-3 bg-gradient-to-r from-token-purple/20 to-token-blue/20 rounded-lg border border-token-purple/30"
        animate={{ 
          borderColor: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.6)', 'rgba(139, 92, 246, 0.3)']
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <p className="text-center text-white/80 text-sm font-medium">
          🔥 <span className="text-token-yellow">Limited Time:</span> FREE token creation ends in 48 hours!
        </p>
      </motion.div>
    </div>
  );
};

export default ViralStats;