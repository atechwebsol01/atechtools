import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { 
  METADATA_FEE_BASIC,
  METADATA_FEE_ADVANCED,
  METADATA_FEE_ENTERPRISE
} from '@/config';

const PricingSection: React.FC = () => {
  return (
    <section className="py-20 relative" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gradient-purple-blue">
            Launch Your Token Today
          </h2>
          <p className="text-xl max-w-3xl mx-auto text-white/80">
            Create Your First Token FREE! Limited Time Offer
          </p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* BASIC (FREE!!!) Plan */}
          <div className="glass-card p-8 rounded-xl border border-white/10 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-token-green text-white px-4 py-1 rounded-full text-sm">
              LIMITED TIME
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">BASIC (FREE)</h3>
            <div className="text-3xl font-bold text-gradient-purple-blue mb-2">
              0 SOL
            </div>
            <p className="text-sm text-token-green mb-6">No cost for a limited time!</p>
            <div className="text-sm text-white/60 mb-2">+ {METADATA_FEE_BASIC} SOL metadata fee</div>
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Transfer Fee</h4>
                  <p className="text-white/60 text-sm">0.2% on transfers</p>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Basic Features</h4>
                  <p className="text-white/60 text-sm">Token image & metadata</p>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Viral Kit</h4>
                  <p className="text-white/60 text-sm">Basic viral features</p>
                </div>
              </div>
            </div>
            <Link to="/create" className="block">
              <Button className="w-full btn-gradient-primary">Start Free</Button>
            </Link>
          </div>
          {/* ADVANCED Plan */}
          <div className="glass-card p-8 rounded-xl border border-token-purple/30 transform scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-token-purple text-white px-4 py-1 rounded-full text-sm">
              MOST POPULAR
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">ADVANCED</h3>
            <div className="text-3xl font-bold text-gradient-purple-blue mb-2">
              0.01 SOL
            </div>
            <div className="text-sm text-white/60 mb-2">+ {METADATA_FEE_ADVANCED} SOL metadata fee</div>
            <h4 className="text-white font-medium">Transfer Fee</h4>
            <p className="text-white/60 text-sm">0% on transfers</p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Everything in BASIC (FREE!!!)</h4>
                  <p className="text-white/60 text-sm">Plus advanced features</p>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Mintable</h4>
                  <p className="text-white/60 text-sm">Mint & burn tokens</p>
                </div>
              </div>
            </div>
            <Link to="/create" className="block">
              <Button className="w-full" variant="outline">Choose Advanced</Button>
            </Link>
          </div>
          {/* ENTERPRISE Plan */}
          <div className="glass-card p-8 rounded-xl border border-white/10">
            <h3 className="text-2xl font-bold text-white mb-4">ENTERPRISE</h3>
            <div className="text-3xl font-bold text-gradient-purple-blue mb-2">
              0.015 SOL
            </div>
            <div className="text-sm text-white/60 mb-2">+ {METADATA_FEE_ENTERPRISE} SOL metadata fee</div>
            <h4 className="text-white font-medium">Transfer Fee</h4>
            <p className="text-white/60 text-sm">0% on transfers</p>
            <div className="space-y-4 mb-8">
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Everything in ADVANCED</h4>
                  <p className="text-white/60 text-sm">Plus pro features</p>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">Custom Royalties</h4>
                  <p className="text-white/60 text-sm">Up to 5%</p>
                </div>
              </div>
              <div className="flex items-start">
                <div>
                  <h4 className="text-white font-medium">AI Tools</h4>
                  <p className="text-white/60 text-sm">Meme generator & more</p>
                </div>
              </div>
            </div>
            <Link to="/create" className="block">
              <Button className="w-full" variant="outline">Choose Enterprise</Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingSection;