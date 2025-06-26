// components/TestimonialsSection.tsx - Social proof for virality

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Trophy, TrendingUp } from 'lucide-react';

interface Testimonial {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  content: string;
  tokens: number;
  earnings: string;
  verified: boolean;
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Alex Chen',
    handle: '@alexcrypto',
    avatar: '🦊',
    content: "Created 5 tokens with atechtools and already earning 50+ SOL/month from transfer fees! The viral marketing tools are insane 🚀",
    tokens: 5,
    earnings: '52.3 SOL',
    verified: true,
  },
  {
    id: '2',
    name: 'Sarah Moon',
    handle: '@moontokens',
    avatar: '🌙',
    content: "Best decision ever! My $MOON token hit $1M market cap in 3 days. The free tier is actually FREE - unbelievable!",
    tokens: 3,
    earnings: '28.7 SOL',
    verified: true,
  },
  {
    id: '3',
    name: 'DeFi King',
    handle: '@defiking',
    avatar: '👑',
    content: "The 0.1% transfer fee is genius. I'm earning passive income 24/7. Already made back my investment 100x over!",
    tokens: 12,
    earnings: '183.5 SOL',
    verified: true,
  },
  {
    id: '4',
    name: 'Crypto Maya',
    handle: '@mayacrypto',
    avatar: '💎',
    content: "The AI meme generator alone is worth it! My tokens go viral every time. Best platform on Solana, period.",
    tokens: 8,
    earnings: '94.2 SOL',
    verified: true,
  },
  {
    id: '5',
    name: 'Token Master',
    handle: '@tokenmaster',
    avatar: '🎯',
    content: "Switched from my old token creation platform and never looked back. The gamification keeps me creating more tokens. Level 42 creator! 💪",
    tokens: 15,
    earnings: '267.8 SOL',
    verified: true,
  },
  {
    id: '6',
    name: 'Solana Bull',
    handle: '@solbull',
    avatar: '🐂',
    content: "Made my first million with tokens created here. The revenue analytics helped me optimize everything. Life changing!",
    tokens: 7,
    earnings: '412.6 SOL',
    verified: true,
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden" id="testimonials">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold mb-4 text-gradient-purple-blue"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Join Thousands of Successful Creators
          </motion.h2>
          <motion.p 
            className="text-xl max-w-3xl mx-auto text-white/80"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Real creators, real earnings, real success stories. See what our users are saying.
          </motion.p>
        </div>

        {/* Stats Bar */}
        <motion.div 
          className="glass-card p-6 rounded-xl mb-12 max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-gradient-purple-blue">12,847</p>
              <p className="text-white/60 text-sm">Active Creators</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-token-green">89,423</p>
              <p className="text-white/60 text-sm">Tokens Created</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-token-purple">15,234 SOL</p>
              <p className="text-white/60 text-sm">Total Earnings</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-token-yellow">4.9/5</p>
              <p className="text-white/60 text-sm">User Rating</p>
            </div>
          </div>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              className="glass-card p-6 rounded-xl hover:scale-[1.02] transition-transform"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center text-2xl mr-3">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <h4 className="text-white font-medium">{testimonial.name}</h4>
                      {testimonial.verified && (
                        <svg className="w-4 h-4 ml-1 text-token-blue" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">{testimonial.handle}</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-token-yellow fill-current" />
                  ))}
                </div>
              </div>

              {/* Content */}
              <p className="text-white/80 mb-4">"{testimonial.content}"</p>

              {/* Stats */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="flex items-center">
                  <Trophy className="w-4 h-4 text-token-purple mr-1" />
                  <span className="text-white/60 text-sm">{testimonial.tokens} tokens</span>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 text-token-green mr-1" />
                  <span className="text-token-green font-medium text-sm">{testimonial.earnings}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-white/60 mb-4">Join the revolution and start earning today!</p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <a href="/create" className="inline-block">
              <div className="btn-gradient-primary px-8 py-4 rounded-xl text-lg font-medium">
                Start Creating Tokens for FREE
              </div>
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* Background Elements */}
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-token-purple/10 rounded-full blur-3xl"></div>
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-token-blue/10 rounded-full blur-3xl"></div>
    </section>
  );
};

export default TestimonialsSection;