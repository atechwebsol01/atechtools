// pages/CreateToken.tsx - Enhanced with enterprise tier royalty support

import React, { useState, useEffect } from "react";
import { createToken } from '@/services/solana';
import { useTokenContext } from '@/context/TokenContext';
import { getPlanFeatures, getPlanFee, getMetadataFee, ROYALTY } from '@/config';
import confetti from 'canvas-confetti';
import { useNavigate } from "react-router-dom";
import { API_BASE } from '../config';
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { useDropzone } from "react-dropzone";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import ViralStats from "@/components/ViralStats";
import ViralShareKit from "@/components/ViralShareKit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Upload, ArrowRight, Sparkles, Zap, Crown, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { isValidTokenSymbol, isValidTokenName, isValidImageFile } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CreateToken: React.FC = () => {
  const wallet = useWallet();
  const { publicKey } = wallet;
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setCreateTokenInProgress, setCreatedTokenMint } = useTokenContext();

  const [step, setStep] = useState(1);
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
  const [tokenSupply, setTokenSupply] = useState("1000000");
  const [tokenDecimals, setTokenDecimals] = useState(9);
  const [isMintable, setIsMintable] = useState(false);
  const [isBurnable, setIsBurnable] = useState(false);
  const [freezeAuthority, setFreezeAuthority] = useState(false);
  const [renounceOwnership, setRenounceOwnership] = useState(false);
  
  // Enhanced royalty settings for enterprise tier
  const [enableRoyalties, setEnableRoyalties] = useState(false);
  const [royaltyPercentage, setRoyaltyPercentage] = useState([1.5]);
  const [noFeesSelected, setNoFeesSelected] = useState(false); // For enterprise: no fees at all
  
  const [tokenImage, setTokenImage] = useState<File | null>(null);
  const [tokenImagePreview, setTokenImagePreview] = useState<string | null>(null);
  // Fix type error: always allow all plan types for selectedPlan
  const planOptions = ['basic', 'advanced', 'enterprise'] as const;
  type PlanType = typeof planOptions[number];
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('basic');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [feesAccepted, setFeesAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showViralKit, setShowViralKit] = useState(false);
  const [createdTokenData, setCreatedTokenData] = useState<{mint: string; name: string; symbol: string; twitter?: string} | null>(null);
  const [description, setDescription] = useState(""); // Added missing description state

  // Live preview state
  const [showLivePreview, setShowLivePreview] = useState(false);

  const [socialLinks, setSocialLinks] = useState({
    twitter: "",
    discord: "",
    telegram: "",
    website: "",
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif"],
    },
    maxSize: 5242880, // 5MB
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (isValidImageFile(file)) {
        setTokenImage(file);
        setTokenImagePreview(URL.createObjectURL(file));
      } else {
        toast({
          title: "Invalid image",
          description: "Please upload a JPG, PNG, or GIF image under 5MB.",
          variant: "destructive",
        });
      }
    },
  });

  // Show live preview when user starts typing
  useEffect(() => {
    if (tokenName || tokenSymbol) {
      setShowLivePreview(true);
    }
  }, [tokenName, tokenSymbol]);

  // Remove the cast, and instead ensure selectedPlan is always PlanType everywhere
  // Fix: update handlePlanChange to use PlanType
  const handlePlanChange = (plan: PlanType) => {
    setSelectedPlan(plan);
    const features = getPlanFeatures(plan);
    setIsMintable(features.mintable);
    setIsBurnable(features.burnable);
    setEnableRoyalties(features.royalties);
    if (plan !== 'enterprise') {
      setNoFeesSelected(false);
      setRoyaltyPercentage([1.5]);
    }
  };

  // Get current fee configuration based on selections
  const getCurrentFeeConfig = () => {
    if (selectedPlan === 'enterprise') {
      if (noFeesSelected) {
        return { type: 'none', rate: '0%', destination: 'None' };
      } else if (enableRoyalties) {
        return { 
          type: 'creator-royalty', 
          rate: `${royaltyPercentage[0]}%`, 
          destination: 'Your Wallet' 
        };
      } else {
        return { type: 'none', rate: '0%', destination: 'None' };
      }
    } else {
      const features = getPlanFeatures(selectedPlan);
      const rate = (features.transferFeeBps / 100).toFixed(1);
      return { 
        type: 'platform', 
        rate: `${rate}%`, 
        destination: 'Treasury' 
      };
    }
  };

  const handleCreateToken = async () => {
    if (!publicKey) {
      setVisible(true);
      return;
    }

    // Validate inputs
    if (!tokenName || !tokenSymbol || !tokenSupply) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setStep(4);
      setCreateTokenInProgress(true);
      
      // Filter out empty social links
      const filteredSocialLinks = Object.fromEntries(
        Object.entries(socialLinks).filter(([_, value]) => value !== "")
      );

      // Determine royalty percentage for enterprise tier
      let finalRoyaltyPercentage = 0;
      if (selectedPlan === 'enterprise' && enableRoyalties && !noFeesSelected) {
        finalRoyaltyPercentage = royaltyPercentage[0];
      }

      // Include plan and royalty info in metadata
      const metadata = {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: tokenDecimals,
        royaltyPercentage: finalRoyaltyPercentage,
        initialSupply: tokenSupply, // Keep as string
        image: tokenImage || undefined,
        social: Object.keys(filteredSocialLinks).length > 0 ? filteredSocialLinks : undefined,
        plan: selectedPlan, // Include plan info
        description: description || undefined,
        mintable: isMintable,
        burnable: isBurnable,
        freezeAuthority: freezeAuthority,
        renounceOwnership: renounceOwnership,
        isMainnet: true, // Always mainnet
      };

      console.log('Creating token with metadata:', metadata);

      const result = await createToken(wallet, metadata);
      
      // After successful token creation, set twitter in ViralShareKit and social links
      if (result.success && result.mint) {
        // Success! Trigger confetti
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 }
        });

        setCreatedTokenMint(result.mint.toString());
        setCreatedTokenData({
          mint: result.mint.toString(),
          name: tokenName,
          symbol: tokenSymbol,
          // Add default twitter username for viral kit
          twitter: '@atechtoolsorg',
        });

        // Store token info in backend database
        try {
          await fetch(`${API_BASE}/tokens.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mint_address: result.mint.toString(),
              creator_wallet: publicKey?.toString() || '',
              plan: selectedPlan,
              name: tokenName, // Add token name for home/latest success
              symbol: tokenSymbol // Add symbol for completeness
            })
          });
        } catch (err) {
          console.warn('Failed to store token info in backend:', err);
        }

        // Show success message with fee info
        const feeConfig = getCurrentFeeConfig();
        const feeMessage = feeConfig.type === 'none' 
          ? 'No transfer fees configured'
          : `${feeConfig.rate} transfer fees → ${feeConfig.destination}`;
        toast({
          title: "🎉 Token created successfully!",
          description: `${tokenName} (${tokenSymbol}) is live! ${feeMessage}`,
        });
        // Show viral share kit
        setShowViralKit(true);
      } else {
        toast({
          title: "Token Creation Failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        setStep(3);
      }
    } catch (error) {
      console.error("Token creation error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
      setStep(3);
    } finally {
      setIsSubmitting(false);
      setCreateTokenInProgress(false);
    }
  };

  const handleNext = () => {
    // Scroll to top on step change
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      // Validation
      const nameValidation = isValidTokenName(tokenName);
      if (!nameValidation.valid) {
        toast({
          title: "Invalid token name",
          description: nameValidation.message,
          variant: "destructive",
        });
        return;
      }
      
      if (!isValidTokenSymbol(tokenSymbol)) {
        toast({
          title: "Invalid token symbol",
          description: "Symbol must be 2-10 characters, uppercase letters and numbers only.",
          variant: "destructive",
        });
        return;
      }
      
      setStep(3);
    } else if (step === 3) {
      if (!termsAccepted || !feesAccepted) {
        toast({
          title: "Please accept terms",
          description: "You must accept both acknowledgments to continue.",
          variant: "destructive",
        });
        return;
      }
      
      handleCreateToken();
    }
  };

  // Also scroll to top when step is set programmatically (e.g., after token creation or error)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Plan display logic
  const getPlanDisplayName = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'BASIC (FREE)';
      case 'advanced':
        return 'ADVANCED (0.01 SOL)';
      case 'enterprise':
        return 'ENTERPRISE (0.015 SOL)';
      default:
        return plan;
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gradient-purple-blue mb-4">Choose Your Plan</h2>
            
            {/* Add viral stats here */}
            <ViralStats />
            
            <Tabs
              defaultValue={selectedPlan}
              onValueChange={(value) => handlePlanChange(value as PlanType)}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="basic">
                  <Sparkles size={16} className="mr-1" />
                  Basic
                </TabsTrigger>
                <TabsTrigger value="advanced">
                  <Zap size={16} className="mr-1" />
                  Advanced
                </TabsTrigger>
                <TabsTrigger value="enterprise">
                  <Crown size={16} className="mr-1" />
                  Enterprise
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="mt-4">
                <motion.div 
                  className="glass-card p-6 rounded-lg relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute top-2 right-2 px-3 py-1 bg-token-green/20 rounded-full">
                    <span className="text-token-green text-xs font-bold">POPULAR</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">Basic Token</h3>
                  <p className="text-white/70 mb-4">Perfect for getting started quickly</p>
                  
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-gradient-purple-blue">FREE</span>
                    <span className="text-white/60 ml-2">for limited time!</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {[
                      "Standard SPL token creation",
                      "Custom name & symbol",
                      "Token image upload",
                      "0.2% transfer fee → Treasury",
                      "Basic viral launch kit",
                      "Community support"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <Check size={16} className="text-token-green flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-4">
                <motion.div 
                  className="glass-card p-6 rounded-lg border-2 border-token-purple/40 relative overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute top-2 right-2 px-3 py-1 bg-token-purple/20 rounded-full">
                    <span className="text-token-purple text-xs font-bold">BEST VALUE</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">Advanced Token</h3>
                  <p className="text-white/70 mb-4">Everything you need to succeed</p>
                  
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-gradient-purple-blue">0.01</span>
                    <span className="text-2xl font-bold text-white ml-1">SOL</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {[ 
                      "Everything in Basic",
                      "Absolutely 0% transfer fees – you keep 100% of your tokens!",
                      "Mintable & Burnable options",
                      "AI meme generator",
                      "Advanced analytics",
                      "Priority processing",
                      "No hidden costs, no platform fees – truly free!"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <Check size={16} className="text-token-green flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </TabsContent>
              
              <TabsContent value="enterprise" className="mt-4">
                <motion.div 
                  className="glass-card p-6 rounded-lg relative overflow-hidden border-2 border-token-yellow/40"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute top-2 right-2 px-3 py-1 bg-token-yellow/20 rounded-full">
                    <span className="text-token-yellow text-xs font-bold">PREMIUM</span>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">Enterprise Token</h3>
                  <p className="text-white/70 mb-4">For serious projects with custom royalties</p>
                  
                  <div className="flex items-baseline mb-4">
                    <span className="text-4xl font-bold text-gradient-purple-blue">0.015</span>
                    <span className="text-2xl font-bold text-white ml-1">SOL</span>
                  </div>
                  
                  <ul className="space-y-2 mb-4">
                    {[ 
                      "Everything in Advanced",
                      "0% platform fees",
                      "Custom royalties (0-5%) → Your wallet",
                      "Multi-signature support",
                      "Dedicated support channel",
                      "White-label solutions"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center space-x-2">
                        <Check size={16} className="text-token-green flex-shrink-0" />
                        <span className="text-white/80 text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 p-3 bg-token-yellow/10 rounded-lg">
                    <p className="text-token-yellow text-sm">
                      <Info size={14} className="inline mr-1" />
                      <strong>Enterprise Benefits:</strong> No platform fees! Set your own 0-5% royalties that go directly to your wallet on every transfer.
                    </p>
                  </div>
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        );
      
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gradient-purple-blue mb-4">Configure Your Token</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left side - Configuration */}
              <div className="space-y-4">
                <div className="glass-card p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">Token Details</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input
                        id="tokenName"
                        placeholder="e.g., Awesome Token"
                        value={tokenName}
                        onChange={(e) => setTokenName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tokenSymbol">Token Symbol</Label>
                      <Input
                        id="tokenSymbol"
                        placeholder="e.g., AWE"
                        value={tokenSymbol}
                        onChange={(e) => setTokenSymbol(e.target.value.toUpperCase())}
                        className="mt-1"
                        maxLength={10}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="tokenSupply">Initial Supply</Label>
                      <Input
                        id="tokenSupply"
                        type="number"
                        placeholder="1000000"
                        value={tokenSupply}
                        onChange={(e) => setTokenSupply(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <Label>Decimals</Label>
                        <span className="text-white/60 text-sm">{tokenDecimals}</span>
                      </div>
                      <Slider
                        min={0}
                        max={9}
                        step={1}
                        value={[tokenDecimals]}
                        onValueChange={(value) => setTokenDecimals(value[0])}
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Describe your token (optional)"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                </div>
                </div>
                
                {/* Token Image */}
                <div className="glass-card p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">Token Image</h3>
                  
                  {tokenImagePreview ? (
                    <div className="text-center">
                      <img
                        src={tokenImagePreview}
                        alt="Token preview"
                        className="w-32 h-32 mx-auto rounded-full mb-4 border-4 border-token-purple"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTokenImage(null);
                          setTokenImagePreview(null);
                        }}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div {...getRootProps()} className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center cursor-pointer hover:border-token-purple/50 transition-colors">
                      <input {...getInputProps()} />
                      <Upload className="mx-auto h-12 w-12 text-white/60 mb-2" />
                      <p className="text-white/80">Drop image here or click to upload</p>
                      <p className="text-white/40 text-xs mt-1">PNG, JPG or GIF (max 5MB)</p>
                    </div>
                  )}
                </div>
                
                {/* Social Links */}
                <div className="glass-card p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">Social Links</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="twitter">Twitter</Label>
                      <Input
                        id="twitter"
                        placeholder="e.g., https://twitter.com/yourprofile"
                        value={socialLinks.twitter}
                        onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="discord">Discord</Label>
                      <Input
                        id="discord"
                        placeholder="e.g., https://discord.gg/yourserver"
                        value={socialLinks.discord}
                        onChange={(e) => setSocialLinks({ ...socialLinks, discord: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="telegram">Telegram</Label>
                      <Input
                        id="telegram"
                        placeholder="e.g., https://t.me/yourchannel"
                        value={socialLinks.telegram}
                        onChange={(e) => setSocialLinks({ ...socialLinks, telegram: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="e.g., https://yourwebsite.com"
                        value={socialLinks.website}
                        onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right side - Live Preview & Features */}
              <div className="space-y-4">
                {/* Live Preview */}
                {showLivePreview && (
                  <motion.div 
                    className="glass-card p-4 rounded-lg"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <h3 className="text-lg font-medium text-white mb-4">Live Preview</h3>
                    
                    <div className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        {tokenImagePreview ? (
                          <img
                            src={tokenImagePreview}
                            alt="Token"
                            className="w-12 h-12 rounded-full mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center mr-3">
                            <span className="text-white font-bold">
                              {tokenSymbol ? tokenSymbol.slice(0, 2) : "TK"}
                            </span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-white font-medium">
                            {tokenName || "Your Token Name"}
                          </h4>
                          <p className="text-white/60 text-sm">
                            ${tokenSymbol || "SYMBOL"}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-white/60">Supply:</span>
                          <span className="text-white ml-2">
                            {Number(tokenSupply || 0).toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-white/60">Decimals:</span>
                          <span className="text-white ml-2">{tokenDecimals}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Features */}
                <div className="glass-card p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">Token Features</h3>
                  
                  <div className="space-y-3">
                    {/* Fee Configuration Display */}
                    <div className="p-3 bg-token-purple/10 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">Transfer Fees</span>
                        <span className="text-token-green text-sm">
                          {(() => {
                            const feeConfig = getCurrentFeeConfig();
                            return feeConfig.rate;
                          })()}
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        {(() => {
                          const feeConfig = getCurrentFeeConfig();
                          if (feeConfig.type === 'none') {
                            return 'No transfer fees configured';
                          } else if (feeConfig.type === 'creator-royalty') {
                            return `Custom royalties paid to your wallet`;
                          } else {
                            return `Platform fees paid to treasury`;
                          }
                        })()}
                      </p>
                    </div>
                    
                    {/* Feature toggles for Basic plan (locked, upsell) */}
                    {selectedPlan === 'basic' && (
                      <>
                        {/* Mintable */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="isMintable" className="text-white">Mintable</Label>
                            <p className="text-xs text-white/60">Create more tokens later</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch id="isMintable" checked disabled onClick={() => toast({title: 'Upgrade Required', description: 'Unlock this feature with Premium or Enterprise plan!', variant: 'default'})} />
                              </TooltipTrigger>
                              <TooltipContent>Upgrade to Premium or Enterprise to disable Mintable</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Burnable */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="isBurnable" className="text-white">Burnable</Label>
                            <p className="text-xs text-white/60">Allow burning tokens</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch id="isBurnable" checked disabled onClick={() => toast({title: 'Upgrade Required', description: 'Unlock this feature with Premium or Enterprise plan!', variant: 'default'})} />
                              </TooltipTrigger>
                              <TooltipContent>Upgrade to Premium or Enterprise to disable Burnable</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Freeze Authority (simulated) */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="freezeAuthority" className="text-white">Freeze Authority</Label>
                            <p className="text-xs text-white/60">Ability to freeze token accounts</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch id="freezeAuthority" checked disabled onClick={() => toast({title: 'Upgrade Required', description: 'Unlock this feature with Premium or Enterprise plan!', variant: 'default'})} />
                              </TooltipTrigger>
                              <TooltipContent>Upgrade to Premium or Enterprise to disable Freeze</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Renounce Ownership (simulated) */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="renounceOwnership" className="text-white">Renounce Ownership</Label>
                            <p className="text-xs text-white/60">Make token fully decentralized</p>
                          </div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Switch id="renounceOwnership" checked disabled onClick={() => toast({title: 'Upgrade Required', description: 'Unlock this feature with Premium or Enterprise plan!', variant: 'default'})} />
                              </TooltipTrigger>
                              <TooltipContent>Upgrade to Premium or Enterprise to disable Renounce Ownership</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        {/* Royalty slider always visible, but only enabled for Enterprise */}
                        <div className="pt-3">
                          <Label className="text-white">Royalty %</Label>
                          <Slider
                            min={ROYALTY.minPercentage}
                            max={ROYALTY.maxPercentage}
                            step={0.1}
                            value={royaltyPercentage}
                            onValueChange={setRoyaltyPercentage}
                            disabled={['enterprise'].indexOf(selectedPlan) === -1}
                          />
                          <p className="text-xs text-token-yellow mt-1">Upgrade to Enterprise to enable custom royalties!</p>
                        </div>
                      </>
                    )}

                    {/* Feature toggles for Premium/Enterprise plans (unlocked) */}
                    {selectedPlan !== 'basic' && (
                      <>
                        {/* Mintable */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="isMintable" className="text-white">Mintable</Label>
                            <p className="text-xs text-white/60">Create more tokens later</p>
                          </div>
                          <Switch id="isMintable" checked={isMintable} onCheckedChange={setIsMintable} />
                        </div>
                        {/* Burnable */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="isBurnable" className="text-white">Burnable</Label>
                            <p className="text-xs text-white/60">Allow burning tokens</p>
                          </div>
                          <Switch id="isBurnable" checked={isBurnable} onCheckedChange={setIsBurnable} />
                        </div>
                        {/* Freeze Authority */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="freezeAuthority" className="text-white">Freeze Authority</Label>
                            <p className="text-xs text-white/60">Ability to freeze token accounts</p>
                          </div>
                          <Switch id="freezeAuthority" checked={freezeAuthority} onCheckedChange={setFreezeAuthority} />
                        </div>
                        {/* Renounce Ownership */}
                        <div className="flex items-center justify-between py-2">
                          <div>
                            <Label htmlFor="renounceOwnership" className="text-white">Renounce Ownership</Label>
                            <p className="text-xs text-white/60">Make token fully decentralized</p>
                          </div>
                          <Switch id="renounceOwnership" checked={renounceOwnership} onCheckedChange={setRenounceOwnership} />
                        </div>
                        {/* Royalty slider for both advanced and enterprise, but only enabled for enterprise */}
                        <div className="pt-3">
                          <Label className="text-white">Royalty %</Label>
                          <Slider
                            min={ROYALTY.minPercentage}
                            max={ROYALTY.maxPercentage}
                            step={0.1}
                            value={royaltyPercentage}
                            onValueChange={setRoyaltyPercentage}
                            disabled={selectedPlan !== 'enterprise'}
                          />
                          {selectedPlan !== 'enterprise' && (
                            <p className="text-xs text-token-yellow mt-1">Upgrade to Enterprise to enable custom royalties!</p>
                          )}
                          {selectedPlan === 'enterprise' && (
                            <p className="text-xs text-white/40 mt-1">Royalties go directly to your wallet on every transfer</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <h2 className="text-2xl font-bold text-gradient-purple-blue mb-4">Review & Create</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token Summary */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-4">Token Summary</h3>
                
                <div className="flex items-center mb-4">
                  {tokenImagePreview ? (
                    <img
                      src={tokenImagePreview}
                      alt="Token"
                      className="w-16 h-16 rounded-full border-2 border-token-purple mr-4"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-xl">
                        {tokenSymbol.slice(0, 2)}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-xl font-bold text-white">{tokenName}</h3>
                    <p className="text-white/60">${tokenSymbol}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Initial Supply</span>
                    <span className="text-white font-medium">
                      {Number(tokenSupply).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Decimals</span>
                    <span className="text-white font-medium">{tokenDecimals}</span>
                  </div>
                  
                  {/* Enhanced fee display */}
                  <div className="flex justify-between py-2 border-b border-white/10">
                    <span className="text-white/60">Transfer Fees</span>
                    <span className="text-token-green font-medium">
                      {(() => {
                        const feeConfig = getCurrentFeeConfig();
                        return feeConfig.rate;
                      })()}
                    </span>
                  </div>
                  
                  {(() => {
                    const feeConfig = getCurrentFeeConfig();
                    if (feeConfig.type === 'creator-royalty') {
                      return (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">Fee Destination</span>
                          <span className="text-token-purple font-medium">Your Wallet</span>
                        </div>
                      );
                    } else if (feeConfig.type === 'platform') {
                      return (
                        <div className="flex justify-between py-2 border-b border-white/10">
                          <span className="text-white/60">Fee Destination</span>
                          <span className="text-white font-medium">Treasury</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                  
                  <div className="flex justify-between py-2">
                    <span className="text-white/60">Plan</span>
                    <span className="text-white font-medium capitalize">{getPlanDisplayName(selectedPlan)}</span>
                  </div>
                </div>
              </div>
              
              {/* Fee Summary */}
              <div className="glass-card p-6 rounded-xl">
                <h3 className="text-xl font-bold text-white mb-4">Fee Summary</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/60">Creation Fee</span>
                    <span className="text-white font-medium">
                      {getPlanFee(selectedPlan)} SOL
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Metadata Fee</span>
                    <span className="text-white font-medium">{getMetadataFee(selectedPlan)} SOL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Network Fee (est.)</span>
                    <span className="text-white font-medium">~0.00001 SOL</span>
                  </div>
                  
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between font-bold">
                      <span className="text-white">Total Cost</span>
                      <span className="text-gradient-purple-blue text-xl">
                        {(getPlanFee(selectedPlan) + getMetadataFee(selectedPlan) + 0.00001).toFixed(5)} SOL
                      </span>
                    </div>
                  </div>
                  
                  {selectedPlan === 'basic' && (
                    <div className="p-3 bg-token-green/10 rounded-lg mt-4">
                      <p className="text-token-green text-sm font-medium">
                        🎉 The Basic plan is now <b>FREE</b>!
                      </p>
                    </div>
                  )}

                  {/* Enterprise fee explanation */}
                  {selectedPlan === 'enterprise' && (
                    <div className="p-3 bg-token-purple/10 rounded-lg mt-4">
                      <p className="text-token-purple text-sm font-medium">
                        {(() => {
                          const feeConfig = getCurrentFeeConfig();
                          if (feeConfig.type === 'none') {
                            return '💎 Enterprise: No transfer fees configured - completely free transfers!';
                          } else if (feeConfig.type === 'creator-royalty') {
                            return `💰 Enterprise: ${feeConfig.rate} royalties will be paid to your wallet on every transfer!`;
                          }
                          return '💎 Enterprise benefits unlocked!';
                        })()}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Terms */}
                <div className="mt-6 space-y-3">
                  <h4 className="text-white font-medium">Please Confirm:</h4>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="terms" 
                      checked={termsAccepted}
                      onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="terms" className="text-sm text-white">
                        I have verified all token information
                      </label>
                      <p className="text-xs text-white/60">
                        Token parameters cannot be changed after creation
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox 
                      id="fees" 
                      checked={feesAccepted}
                      onCheckedChange={(checked) => setFeesAccepted(checked === true)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label htmlFor="fees" className="text-sm text-white">
                        I understand the fee structure
                      </label>
                      <p className="text-xs text-white/60">
                        {(() => {
                          const feeConfig = getCurrentFeeConfig();
                          if (feeConfig.type === 'none') {
                            return 'No transfer fees will be charged';
                          } else if (feeConfig.type === 'creator-royalty') {
                            return `${feeConfig.rate} royalties will be paid to your wallet on all transfers`;
                          } else {
                            return `${feeConfig.rate} transfer fees will be paid to treasury on all transfers`;
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            {!showViralKit ? (
              <>
                <div className="w-24 h-24 rounded-full bg-token-green/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                  <Check size={40} className="text-token-green" />
                </div>
                
                <h2 className="text-3xl font-bold text-gradient-purple-blue mb-4">
                  Creating Your Token...
                </h2>
                
                <p className="text-white/80 max-w-md mx-auto mb-8">
                  Your {tokenName} ({tokenSymbol}) token is being deployed to the Solana blockchain.
                </p>
                
                <div className="glass-card p-6 rounded-xl max-w-sm mx-auto">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-token-purple to-token-blue h-2 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 8, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-white/60 text-sm mt-4">
                    Please don't close this page...
                  </p>
                </div>
              </>
            ) : (
              <div className="max-w-4xl mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-32 h-32 rounded-full bg-token-green/20 flex items-center justify-center mx-auto mb-6"
                >
                  <Check size={64} className="text-token-green" />
                </motion.div>
                
                <h2 className="text-4xl font-bold text-gradient-purple-blue mb-4">
                  Congratulations! 🎉
                </h2>
                
                <p className="text-xl text-white/80 mb-8">
                  Your {tokenName} token has been created successfully!
                </p>
                
                {/* Move Token Details here, before ViralShareKit */}
                {createdTokenData && (
                  <div className="glass-card p-6 rounded-xl max-w-lg mx-auto mt-6 text-left">
                    <h3 className="text-xl font-bold text-gradient-purple-blue mb-2">Your Token Details</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between"><span className="text-white/60">Name:</span><span className="text-white font-medium">{createdTokenData.name}</span></div>
                      <div className="flex justify-between"><span className="text-white/60">Symbol:</span><span className="text-white font-medium">{createdTokenData.symbol}</span></div>
                      <div className="flex justify-between"><span className="text-white/60">Mint Address:</span><span className="text-white font-medium break-all">{createdTokenData.mint}</span></div>
                    </div>
                    <p className="text-xs text-white/40 mt-4">Please save your mint address and token details securely. You will need them to manage your token in the future.</p>
                    <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <Button className="btn-gradient-primary w-full sm:w-auto" onClick={() => navigate('/dashboard')}>
                        View Your Tokens in Dashboard
                      </Button>
                      <a
                        href={`https://solscan.io/token/${createdTokenData.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto"
                      >
                        <Button variant="outline" className="w-full sm:w-auto">View on Solscan</Button>
                      </a>
                    </div>
                  </div>
                )}
                
                {/* ViralShareKit and others follow after token details */}
                {createdTokenData && (
                  <ViralShareKit 
                    tokenName={createdTokenData.name}
                    tokenSymbol={createdTokenData.symbol}
                    tokenMint={createdTokenData.mint}
                    // Remove twitter prop if not supported by ViralShareKit
                  />
                )}
                <div className="mt-8 flex justify-center gap-4">
                  <Button 
                    className="btn-gradient-primary"
                    onClick={() => navigate("/dashboard")}
                  >
                    View in Dashboard
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Create Another Token
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };

  if (!publicKey) {
    return (
      <>
        <NavBar />
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
          <div className="glass-card p-8 rounded-xl max-w-md w-full text-center">
            <h1 className="text-2xl font-bold text-gradient-purple-blue mb-4">
              Connect Your Wallet
            </h1>
            <p className="text-white/80 mb-6">
              Connect your Solana wallet to start creating tokens for FREE!
            </p>
            <Button 
              onClick={() => setVisible(true)}
              className="btn-gradient-primary"
            >
              Connect Wallet
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <div className="glass-card p-8 rounded-xl">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between mb-4 relative">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0"></div>
              
              {[1, 2, 3, 4].map((stepNumber) => (
                <div key={stepNumber} className="relative z-10 flex flex-col items-center">
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      stepNumber === step
                        ? "bg-gradient-to-r from-token-purple to-token-blue text-white"
                        : stepNumber < step
                        ? "bg-token-green text-white"
                        : "bg-white/10 text-white/60"
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {stepNumber < step ? <Check size={16} /> : stepNumber}
                  </motion.div>
                  <span className={`text-sm mt-2 ${
                    stepNumber === step ? "text-white font-medium" : "text-white/60"
                  }`}>
                    {stepNumber === 1 ? "Plan" : stepNumber === 2 ? "Configure" : stepNumber === 3 ? "Review" : "Create"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-8">{renderStepContent()}</div>

          {/* Navigation */}
          {step < 4 && (
            <div className="flex justify-between">
              {step > 1 ? (
                <Button 
                  variant="outline" 
                  onClick={() => setStep(step - 1)}
                  disabled={isSubmitting}
                >
                  Previous
                </Button>
              ) : (
                <div></div>
              )}
              
              <Button 
                onClick={handleNext} 
                className="btn-gradient-primary"
                disabled={isSubmitting}
              >
                {step === 3 ? "Create Token" : "Next"}
                <ArrowRight className="ml-2" size={16} />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CreateToken;