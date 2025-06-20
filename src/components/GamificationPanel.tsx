// components/GamificationPanel.tsx - Achievements, levels, and rewards

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Target, Zap, TrendingUp } from 'lucide-react';
import { getCreatorLevel } from '@/config';
import { useTokenContext } from '@/context/TokenContext';
import confetti from 'canvas-confetti';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

const GamificationPanel: React.FC = () => {
  const { tokens } = useTokenContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(0);
  
  const creatorLevel = getCreatorLevel(tokens.length);

  // Initialize achievements
  useEffect(() => {
    const userAchievements: Achievement[] = [
      {
        id: 'first_token',
        name: 'First Steps',
        description: 'Create your first token',
        icon: '🎯',
        unlocked: tokens.length >= 1,
        progress: Math.min(tokens.length, 1),
        target: 1,
      },
      {
        id: 'serial_creator',
        name: 'Serial Creator',
        description: 'Create 5 tokens',
        icon: '🏭',
        unlocked: tokens.length >= 5,
        progress: Math.min(tokens.length, 5),
        target: 5,
      },
      {
        id: 'variety_pack',
        name: 'Variety Pack',
        description: 'Create tokens with different features',
        icon: '🎨',
        unlocked: false, // Would check token varieties
        progress: 0,
        target: 3,
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Create a token within 24h of signup',
        icon: '🌅',
        unlocked: tokens.length > 0, // Simplified
        progress: tokens.length > 0 ? 1 : 0,
        target: 1,
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: '7-day creation streak',
        icon: '🔥',
        unlocked: dailyStreak >= 7,
        progress: dailyStreak,
        target: 7,
      },
    ];
    
    setAchievements(userAchievements);
  }, [tokens, dailyStreak]);

  // Check for level up
  useEffect(() => {
    const lastLevel = localStorage.getItem('lastCreatorLevel');
    if (lastLevel && lastLevel !== creatorLevel.level && tokens.length > 0) {
      setShowLevelUp(true);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setTimeout(() => setShowLevelUp(false), 5000);
    }
    localStorage.setItem('lastCreatorLevel', creatorLevel.level);
  }, [creatorLevel.level, tokens.length]);

  // Load streak from localStorage
  useEffect(() => {
    const streak = parseInt(localStorage.getItem('creationStreak') || '0');
    setDailyStreak(streak);
  }, []);
  const totalAchievements = achievements.length;
  const unlockedAchievements = achievements.filter(a => a.unlocked).length;

  return (
    <div className="space-y-4">
      {/* Level Progress */}
      <motion.div 
        className="glass-card p-6 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xl font-bold ${creatorLevel.color}`}>
              {creatorLevel.level}
            </h3>
            <p className="text-white/60 text-sm">
              {tokens.length}/{creatorLevel.next} tokens to next level
            </p>
          </div>
          <div className="text-4xl">
            {tokens.length < 3 ? '🥉' : tokens.length < 10 ? '🥈' : tokens.length < 25 ? '🥇' : '💎'}
          </div>
        </div>
        
        <div className="w-full bg-white/10 rounded-full h-3 mb-2">
          <motion.div 
            className="h-full bg-gradient-to-r from-token-purple to-token-blue rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(tokens.length / creatorLevel.next) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Daily Streak */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl mr-2">🔥</span>
            <div>
              <p className="text-white font-medium">{dailyStreak} Day Streak</p>
              <p className="text-white/60 text-xs">Create tokens daily to maintain</p>
            </div>
          </div>
          <motion.div 
            className="text-token-orange font-bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }}
          >
            +{dailyStreak * 10}% XP
          </motion.div>
        </div>
      </motion.div>

      {/* Achievements Grid */}
      <motion.div 
        className="glass-card p-6 rounded-xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Achievements</h3>
          <span className="text-white/60 text-sm">
            {unlockedAchievements}/{totalAchievements} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {achievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              className={`p-3 rounded-lg border ${
                achievement.unlocked 
                  ? 'bg-token-purple/20 border-token-purple/40' 
                  : 'bg-white/5 border-white/10'
              } relative overflow-hidden`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {achievement.unlocked && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-token-purple/20 to-token-blue/20"
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
              )}
              
              <div className="relative z-10">
                <div className="text-2xl mb-2">{achievement.icon}</div>
                <h4 className={`font-medium ${achievement.unlocked ? 'text-white' : 'text-white/50'}`}>
                  {achievement.name}
                </h4>
                <p className="text-xs text-white/40 mt-1">
                  {achievement.description}
                </p>
                
                {!achievement.unlocked && (
                  <div className="mt-2">
                    <div className="w-full bg-white/10 rounded-full h-1">
                      <div 
                        className="h-full bg-gradient-to-r from-token-purple to-token-blue rounded-full"
                        style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-white/40 mt-1">
                      {achievement.progress}/{achievement.target}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Level Up Notification */}
      {showLevelUp && (
        <motion.div
          className="fixed top-20 right-4 glass-card p-6 rounded-xl z-50 max-w-sm"
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
        >
          <div className="flex items-center">
            <Trophy className="text-token-yellow mr-3" size={32} />
            <div>
              <h3 className="text-xl font-bold text-gradient-purple-blue">Level Up!</h3>
              <p className="text-white/80">You are now a {creatorLevel.level}</p>
              <p className="text-token-green text-sm mt-1">+50 XP earned</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Rewards Preview */}
      <motion.div 
        className="glass-card p-4 rounded-xl bg-gradient-to-r from-token-purple/10 to-token-blue/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h4 className="text-white font-medium mb-2">🎁 Next Rewards</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Star className="text-token-yellow mr-2" size={16} />
            <span className="text-white/70">5 tokens: Unlock custom branding</span>
          </div>
          <div className="flex items-center">
            <Zap className="text-token-purple mr-2" size={16} />
            <span className="text-white/70">10 tokens: Priority processing</span>
          </div>
          <div className="flex items-center">
            <Target className="text-token-blue mr-2" size={16} />
            <span className="text-white/70">25 tokens: AI meme generator</span>
          </div>
          <div className="flex items-center">
            <TrendingUp className="text-token-green mr-2" size={16} />
            <span className="text-white/70">50 tokens: Revenue analytics</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default GamificationPanel;