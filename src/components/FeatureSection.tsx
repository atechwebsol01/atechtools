import React from 'react';
import { Check, Zap, Shield, ArrowRight } from 'lucide-react';
import FeatureCard from '@/components/FeatureCard';

const FeatureSection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden" id="features">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-purple-blue">
            Revolutionary Token Creation Features
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-white/80">
            ATECHTOOLS offers the most advanced features for Solana token creation and management,
            all with a stunning UI experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          <FeatureCard
            title="Custom Token Creation"
            description="Create SPL tokens with custom parameters including supply, decimals, and metadata."
            icon={<Zap size={24} />}
            className="animate-float"
          />
          <FeatureCard
            title="Royalty System"
            description="Implement automatic royalty collection on token transfers for sustainable revenue."
            icon={<ArrowRight size={24} />}
            className="animate-float [animation-delay:200ms]"
          />
          <FeatureCard
            title="Advanced Security"
            description="Robust authority management with optional multi-signature support."
            icon={<Shield size={24} />}
            className="animate-float [animation-delay:400ms]"
          />
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-gradient-purple-blue">
                Why Choose ATECHTOOLS?
              </h3>
              <p className="text-white/80 mb-6">
                Our platform offers features that other token creators lack, with a focus on
                usability, security, and beautiful design.
              </p>
              <ul className="space-y-3">
                {[
                  "Revolutionary royalty system for sustainable revenue",
                  "Simplest token authority management interface",
                  "Error prevention with built-in validation",
                  "Gas fee optimization with smart transaction batching",
                  "Clear transaction transparency and fee breakdown",
                  "Complete Solana wallet integration"
                ].map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="text-token-green mr-2 mt-1 flex-shrink-0" size={18} />
                    <span className="text-white/80">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="glass-card p-6 rounded-lg mt-6">
                <h3 className="text-lg font-bold text-white mb-2">
                  Automatic Revenue Generation
                </h3>
                <p className="text-white/80">
                  Every token comes with a built-in 0.1% transfer fee mechanism, automatically
                  collecting fees on all transfers to sustain your token ecosystem.
                </p>
              </div>
            </div>
            <div className="token-creation-animation rounded-xl overflow-hidden">
              <div className="glass-card h-full w-full p-6">
                <div className="border border-token-purple/30 rounded-lg p-4 bg-background/60">
                  <h4 className="text-xl font-medium mb-3 text-token-purple">Token Preview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-white/60">Name:</span>
                      <span className="text-white font-medium">ATECH Token</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Symbol:</span>
                      <span className="text-white font-medium">ATECH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Decimals:</span>
                      <span className="text-white font-medium">9</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Supply:</span>
                      <span className="text-white font-medium">100,000,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Royalty:</span>
                      <span className="text-white font-medium">1.5%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Features:</span>
                      <span className="text-white font-medium">Burnable, Mintable</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-token-purple/20 rounded-full blur-3xl"></div>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-token-blue/20 rounded-full blur-3xl"></div>
    </section>
  );
};

export default FeatureSection;