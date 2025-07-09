// components/ViralStats.tsx - Live counters and FOMO mechanics

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Zap } from 'lucide-react';

const API_BASE = '/api';

const ViralStats: React.FC = () => {
  const [tokensCreatedToday, setTokensCreatedToday] = useState(0);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [lastCreatedTime, setLastCreatedTime] = useState(2);
  const [activeCreators, setActiveCreators] = useState(0);
  const [successStories, setSuccessStories] = useState<any[]>([]);

  // Fetch tokens created today and success stories
  useEffect(() => {
    fetch(`${API_BASE}/tokens.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Count tokens created today
          const today = new Date().toISOString().slice(0, 10);
          const tokensToday = data.tokens.filter((t: any) => t.created_at.startsWith(today));
          setTokensCreatedToday(tokensToday.length);
          // Use real tokens as success stories (latest 5)
          setSuccessStories(tokensToday.slice(0, 5).map((t: any) => ({
            token: t.name ? `${t.name}${t.symbol ? ` ($${t.symbol})` : ''}` : t.mint_address.slice(0, 8) + '...',
            marketCap: '—',
            time: t.created_at.slice(11, 16)
          })));
        }
      });
  }, []);

  // Fetch active creators (online)
  useEffect(() => {
    fetch(`${API_BASE}/online.php`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setActiveCreators(data.online);
      });
    const interval = setInterval(() => {
      fetch(`${API_BASE}/online.php`).then(res => res.json()).then(data => {
        if (data.success) setActiveCreators(data.online);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update last created time
  useEffect(() => {
    const interval = setInterval(() => {
      setLastCreatedTime(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate success stories
  useEffect(() => {
    if (successStories.length === 0) return;
    const interval = setInterval(() => {
      setCurrentStoryIndex((prev) => (prev + 1) % successStories.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [successStories]);

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
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center mb-2">
            <Zap className="text-token-yellow mr-2" size={20} />
            <span className="text-white/60 text-sm">Tokens Created Today</span>
          </div>
          <motion.div key={tokensCreatedToday} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-3xl font-bold text-gradient-purple-blue">
            {tokensCreatedToday.toLocaleString()}
          </motion.div>
          <p className="text-white/40 text-xs mt-1">
            Last created: {getLastCreatedText()}
          </p>
        </motion.div>

        {/* Success Story Ticker */}
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-center mb-2">
            <TrendingUp className="text-token-green mr-2" size={20} />
            <span className="text-white/60 text-sm">Latest Success</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={currentStoryIndex} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {successStories.length > 0 ? (
                <>
                  <div className="text-xl font-bold text-white">{successStories[currentStoryIndex].token}</div>
                  <p className="text-token-green text-sm">{successStories[currentStoryIndex].marketCap}</p>
                  <p className="text-white/40 text-xs">{successStories[currentStoryIndex].time}</p>
                </>
              ) : (
                <div className="text-white/40 text-sm">No tokens created yet today.</div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Active Users */}
        <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-center mb-2">
            <Users className="text-token-purple mr-2" size={20} />
            <span className="text-white/60 text-sm">Active Creators</span>
          </div>
          <div className="text-3xl font-bold text-white">{activeCreators.toLocaleString()}</div>
          <p className="text-white/40 text-xs mt-1">Online now</p>
        </motion.div>
      </div>
      {/* FOMO Banner */}
      <motion.div className="mt-4 p-3 bg-gradient-to-r from-token-purple/20 to-token-blue/20 rounded-lg border border-token-purple/30" animate={{ borderColor: ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.6)', 'rgba(139, 92, 246, 0.3)'] }} transition={{ duration: 2, repeat: Infinity }}>
        <p className="text-center text-white/80 text-sm font-medium">
          🔥 <span className="text-token-yellow">Limited Time:</span> FREE token creation ends in 48 hours!
        </p>
      </motion.div>
    </div>
  );
};

export default ViralStats;