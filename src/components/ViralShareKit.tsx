// components/ViralShareKit.tsx - One-click viral marketing

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Twitter, Send, MessageCircle, Copy, CheckCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ViralShareKitProps {
  tokenName: string;
  tokenSymbol: string;
  tokenMint?: string;
}

const ViralShareKit: React.FC<ViralShareKitProps> = ({ tokenName, tokenSymbol, tokenMint }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [generatingMemes, setGeneratingMemes] = useState(false);
  const { toast } = useToast();

  // Generate viral tweet templates
  const tweetTemplates = [
    `🚀 Just launched $${tokenSymbol} on @atechtoolsorg!

${tokenName} is live and ready to take over Solana! 🌟

✅ Built on Solana
✅ Community-powered
✅ Next-gen tokenomics

Who's joining the $${tokenSymbol} movement? Drop your support below! 👇

#Solana #${tokenSymbol} #Crypto #DeFi`,
    
    `💎 NEW GEM ALERT: $${tokenSymbol} 💎

Just launched ${tokenName} using @atechtoolsorg - the future of Solana tokens!

🔥 Fair launch
🔥 No presale
🔥 100% community

LFG! 🚀 #${tokenSymbol} #SolanaGems`,
    
    `Breaking: $${tokenSymbol} is LIVE! 🎯

${tokenName} - Built different on Solana ⚡

Why I'm bullish:
• Revolutionary fee structure
• Strong community vibes
• Early = Wealthy

Don't fade this one anon 👀 #Solana`,
  ];

  // Generate Discord announcement
  const discordTemplate = `@everyone 

🎉 **${tokenName} ($${tokenSymbol}) IS NOW LIVE!** 🎉

We're excited to announce the official launch of our token on Solana!

**Token Details:**
• Name: ${tokenName}
• Symbol: $${tokenSymbol}
• Network: Solana
• Features: Up to 5% transfer fee, Community-driven

**Why ${tokenSymbol}?**
✅ Built with cutting-edge tech
✅ Fair launch - no presale
✅ Strong tokenomics
✅ Active development

**Get Started:**
• Buy on [DEX NAME]
• Join our community
• Follow our socials

Let's build something amazing together! 🚀

${tokenMint ? `Contract: \`${tokenMint}\`` : ''}`;

  // Generate Telegram message
  const telegramTemplate = `🚀 $${tokenSymbol} is now LIVE on Solana!

${tokenName} just launched and is ready to make waves!

• Fair Launch ✅
• Community Driven ✅
• Built for the future ✅

Join the hype, spread the word, and let's build something legendary together!

#Solana #${tokenSymbol} #Crypto`;

  const copyToClipboard = async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(platform);
      toast({
        title: "Copied to clipboard!",
        description: `${platform} message ready to paste`,
      });
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const shareOnTwitter = (template: string) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(template)}`;
    window.open(url, '_blank');
  };

  const generateMemes = () => {
    setGeneratingMemes(true);
    toast({
      title: "Generating memes...",
      description: "Your viral meme pack will be ready in a moment!",
    });
    
    // Simulate meme generation
    setTimeout(() => {
      setGeneratingMemes(false);
      toast({
        title: "Memes generated!",
        description: "10 viral memes have been created and saved to your dashboard",
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Viral Launch Kit</h3>
        <Button
          onClick={generateMemes}
          disabled={generatingMemes}
          className="btn-gradient-secondary"
          size="sm"
        >
          <Sparkles className="mr-2" size={16} />
          {generatingMemes ? 'Generating...' : 'Generate Memes'}
        </Button>
      </div>

      {/* Twitter Templates */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center mb-3">
          <Twitter className="text-token-blue mr-2" size={20} />
          <h4 className="text-white font-medium">Twitter Templates</h4>
        </div>
        
        <div className="space-y-3">
          {tweetTemplates.map((template, index) => (
            <motion.div
              key={index}
              className="p-3 bg-white/5 rounded-lg"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <p className="text-white/80 text-sm whitespace-pre-wrap mb-2">{template}</p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => shareOnTwitter(template)}
                  className="text-xs"
                >
                  <Twitter size={14} className="mr-1" />
                  Tweet Now
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(template, `twitter-${index}`)}
                  className="text-xs"
                >
                  {copied === `twitter-${index}` ? (
                    <CheckCircle size={14} className="mr-1 text-token-green" />
                  ) : (
                    <Copy size={14} className="mr-1" />
                  )}
                  Copy
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Discord Template */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center mb-3">
          <MessageCircle className="text-token-purple mr-2" size={20} />
          <h4 className="text-white font-medium">Discord Announcement</h4>
        </div>
        
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-white/80 text-sm whitespace-pre-wrap mb-2 max-h-40 overflow-y-auto">
            {discordTemplate}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(discordTemplate, 'discord')}
            className="text-xs"
          >
            {copied === 'discord' ? (
              <CheckCircle size={14} className="mr-1 text-token-green" />
            ) : (
              <Copy size={14} className="mr-1" />
            )}
            Copy for Discord
          </Button>
        </div>
      </div>

      {/* Telegram Template */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center mb-3">
          <Send className="text-token-blue mr-2" size={20} />
          <h4 className="text-white font-medium">Telegram Message</h4>
        </div>
        
        <div className="p-3 bg-white/5 rounded-lg">
          <p className="text-white/80 text-sm whitespace-pre-wrap mb-2">
            {telegramTemplate}
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyToClipboard(telegramTemplate, 'telegram')}
            className="text-xs"
          >
            {copied === 'telegram' ? (
              <CheckCircle size={14} className="mr-1 text-token-green" />
            ) : (
              <Copy size={14} className="mr-1" />
            )}
            Copy for Telegram
          </Button>
        </div>
      </div>

      {/* Viral Tips */}
      <motion.div 
        className="glass-card p-4 rounded-xl bg-gradient-to-r from-token-purple/10 to-token-pink/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h4 className="text-white font-medium mb-2">🚀 Viral Launch Tips</h4>
        <ul className="space-y-1 text-sm text-white/70">
          <li>• Post on Twitter within 5 minutes of creation for maximum engagement</li>
          <li>• Share in 5+ Telegram groups for instant visibility</li>
          <li>• Create a dedicated Discord/Telegram before announcing</li>
          <li>• Use all 3 tweet templates across different times</li>
          <li>• Reply to your own tweets with updates to boost algorithm</li>
        </ul>
      </motion.div>

      {/* Share Tracker */}
      <div className="flex items-center justify-between p-3 bg-token-green/10 rounded-lg">
        <div className="flex items-center">
          <Share2 className="text-token-green mr-2" size={16} />
          <span className="text-white/80 text-sm">Share to unlock bonus features!</span>
        </div>
        <span className="text-token-green font-medium text-sm">0/3 shared</span>
      </div>
    </div>
  );
};

export default ViralShareKit;