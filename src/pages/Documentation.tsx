import React from "react";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Documentation: React.FC = () => {
  return (
    <>
      <NavBar />
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-gradient-purple-blue mb-4">Documentation</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Everything you need to know about creating and managing Solana tokens with ATECHTOOLS.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 mb-8">
          <Tabs defaultValue="overview">
            <TabsList className="mb-6 w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tutorial">Tutorial</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Welcome to ATECHTOOLS</h2>
                  <p className="text-white/80 mb-4">
                    ATECHTOOLS is a next-generation platform for creating, launching, and managing Solana SPL tokens. Our mission is to empower creators, communities, and businesses with the most advanced, user-friendly, and cost-effective tokenization tools on the market.
                  </p>
                  <p className="text-white/80">
                    Whether you're launching a meme coin, a community token, or a full-scale project, ATECHTOOLS gives you the power to build, grow, and manage your token with ease. No coding required, no hidden fees, just pure innovation.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Key Features</h3>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Step-by-step wizard for token creation</li>
                    <li>0% platform fees on ADVANCED AND ENTERPRSISE plans</li>
                    <li>Customizable supply, decimals, and advanced metadata</li>
                    <li>Mintable, burnable, and royalty-enabled tokens</li>
                    <li>Stunning dashboard for managing all your tokens</li>
                    <li>Viral marketing tools and analytics</li>
                    <li>Multi-sig and enterprise-grade security</li>
                    <li>Direct support from the ATECHTOOLS team</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Getting Started</h3>
                  <ol className="list-decimal list-inside space-y-2 text-white/80">
                    <li>Connect your Solana wallet (Phantom, Solflare, Backpack, etc.)</li>
                    <li>Go to <a href="https://atechtools.org" className="text-token-purple underline">atechtools.org</a> and click "Create Token"</li>
                    <li>Choose your plan and configure your token</li>
                    <li>Review, confirm, and sign the transaction</li>
                    <li>Share your token with the world using our viral tools</li>
                    <li>Manage and grow your token in the Dashboard</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Technology Stack</h3>
                  <p className="text-white/80 mb-3">
                    ATECHTOOLS is built on the latest Solana and Web3 technologies:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-white/80">
                    <li>Solana Blockchain</li>
                    <li>Metaplex Umi Framework</li>
                    <li>SPL Token Program</li>
                    <li>Metaplex Token Metadata</li>
                    <li>Web3.js, Wallet Adapter, and more</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tutorial">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Step-by-Step Token Creation Tutorial</h2>
                  <p className="text-white/80 mb-4">
                    This tutorial will guide you through the complete process of creating a token with Aurora Token Forge.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Step 1: Connect Your Wallet</h3>
                    <p className="text-white/80 mb-3">
                      Before creating a token, you need to connect a compatible Solana wallet:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/80">
                      <li>Click the "Connect Wallet" button in the top-right corner</li>
                      <li>Select your preferred wallet (Phantom, Solflare, etc.)</li>
                      <li>Approve the connection request in your wallet</li>
                      <li>Ensure you have enough SOL to cover creation fees</li>
                    </ul>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Step 2: Choose Your Plan</h3>
                    <p className="text-white/80 mb-3">
                      Select the plan that best fits your token requirements:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/80">
                      <li><strong>BASIC (FREE!!!):</strong> Standard SPL token with fixed supply and basic metadata</li>
                      <li><strong>ADVANCED:</strong> Adds mintable/burnable functionality, royalties, enhanced metadata</li>
                      <li><strong>ENTERPRISE:</strong> All features plus multi-sig, advanced analytics, priority processing</li>
                    </ul>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Step 3: Configure Token Parameters</h3>
                    <p className="text-white/80 mb-3">
                      Set up your token with the following parameters:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/80">
                      <li><strong>Token Name:</strong> Full name of your token (e.g., "Aurora Token")</li>
                      <li><strong>Token Symbol:</strong> Short identifier, typically 3-5 characters (e.g., "AURA")</li>
                      <li><strong>Initial Supply:</strong> The number of tokens to create initially</li>
                      <li><strong>Decimals:</strong> Divisibility of your token (0-9, with 9 being standard for most tokens)</li>
                      <li><strong>Advanced Features:</strong> Enable/disable mintable, burnable, and royalty features</li>
                      <li><strong>Token Image:</strong> Upload an image to represent your token (Advanced/Enterprise plans only)</li>
                    </ul>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Step 4: Review & Create</h3>
                    <p className="text-white/80 mb-3">
                      Before finalizing your token:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/80">
                      <li>Review all token parameters carefully</li>
                      <li>Check the fee breakdown</li>
                      <li>Confirm acknowledgments about irreversible settings</li>
                      <li>Click "Create Token" button</li>
                      <li>Approve the transaction in your wallet</li>
                      <li>Wait for confirmation (typically less than a minute)</li>
                    </ul>
                  </div>

                  <div className="glass-card p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">Step 5: Manage Your Token</h3>
                    <p className="text-white/80 mb-3">
                      After creation, you can manage your token in the dashboard:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-white/80">
                      <li>View token details and metrics</li>
                      <li>Transfer tokens to other wallets</li>
                      <li>Mint additional tokens (if enabled)</li>
                      <li>Burn tokens (if enabled)</li>
                      <li>Manage token authorities</li>
                      <li>Track royalty earnings</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="features">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Token Features</h2>
                  <p className="text-white/80 mb-6">
                    Aurora Token Forge offers the following features for your token:
                  </p>
                  
                  <div className="glass-card p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-white mb-2">Automatic Transfer Fee</h3>
                    <p className="text-white/80">
                      Every token created with Aurora Token Forge includes a built-in transfer fee mechanism:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-white/80">
                      <li>0.1% fee on all token transfers</li>
                      <li>Fee is collected automatically by the token contract</li>
                      <li>Fees are sent to a treasury wallet for platform sustainability</li>
                      <li>Transparent and unchangeable after token creation</li>
                    </ul>
                  </div>
                  
                  <div className="glass-card p-4 rounded-lg mb-4">
                    <h3 className="font-bold text-white mb-2">Custom Royalties</h3>
                    <p className="text-white/80">
                      In addition to the automatic transfer fee, you can enable custom royalties:
                    </p>
                    <ul className="list-disc list-inside space-y-1 mt-2 text-white/80">
                      <li>Set custom royalty percentage (0.1% - 5%)</li>
                      <li>Royalties go to the token creator's wallet</li>
                      <li>Separate from the automatic transfer fee</li>
                      <li>Perfect for revenue-generating token projects</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Custom Token Parameters</h4>
                      <p className="text-white/80">
                        Define name, symbol, supply, and decimals for your token, with full customization of metadata.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Token Supply Management</h4>
                      <p className="text-white/80">
                        Choose between fixed supply or mintable tokens with configurable supply caps.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Royalty System</h4>
                      <p className="text-white/80">
                        Earn automatic royalties on token transfers with customizable percentages.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Enhanced Metadata</h4>
                      <p className="text-white/80">
                        Add images, descriptions, and external URLs to your token using Metaplex standards.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Authority Management</h4>
                      <p className="text-white/80">
                        Configure mint and freeze authorities with options to revoke after creation.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Burnable Tokens</h4>
                      <p className="text-white/80">
                        Enable token burning capabilities for reducing supply over time.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Management Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Token Dashboard</h4>
                      <p className="text-white/80">
                        Comprehensive dashboard for monitoring all your created tokens in one place.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Transfer Interface</h4>
                      <p className="text-white/80">
                        Simple interface for transferring tokens to other wallets or smart contracts.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Analytics</h4>
                      <p className="text-white/80">
                        Track token usage, transfers, and other key metrics over time.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Royalty Tracking</h4>
                      <p className="text-white/80">
                        Monitor royalty earnings with detailed analytics and withdrawal options.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-white mb-3">Security Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Authority Revocation</h4>
                      <p className="text-white/80">
                        Tools to safely revoke authorities after token creation if desired.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Transaction Verification</h4>
                      <p className="text-white/80">
                        Clear transaction details before signing for maximum transparency.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Multi-Signature Support</h4>
                      <p className="text-white/80">
                        Enterprise-level multi-sig capabilities for critical operations.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h4 className="font-bold text-white mb-2">Error Prevention</h4>
                      <p className="text-white/80">
                        Built-in validation to prevent common mistakes in token creation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="faq">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Frequently Asked Questions</h2>
                  <div className="space-y-6">
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">What is an SPL token?</h3>
                      <p className="text-white/80">
                        SPL (Solana Program Library) tokens are Solana's native token standard, similar to ERC-20 on Ethereum. 
                        They enable the creation of fungible tokens on the Solana blockchain.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">How much does it cost to create a token?</h3>
                      <p className="text-white/80">
                        Aurora Token Forge offers three pricing tiers:
                        <br />- Basic: 0 SOL + 0.01 SOL metadata fee
                        <br />- Advanced: 0.1 SOL + 0.01 SOL metadata fee
                        <br />- Enterprise: 0.25 SOL + 0.01 SOL metadata fee
                        <br />
                        Additional Solana network fees apply (typically very small).
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">What wallets are supported?</h3>
                      <p className="text-white/80">
                        We support all major Solana wallets including Phantom, Solflare, Backpack, and Brave Wallet.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">What is the royalty system?</h3>
                      <p className="text-white/80">
                        The royalty system allows token creators to earn a small percentage fee (up to 5%) on every transfer of their token. 
                        This creates a sustainable revenue stream for token projects.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">Can I modify token parameters after creation?</h3>
                      <p className="text-white/80">
                        Some parameters like name, symbol, and decimals cannot be changed after creation. However, if you enable mintable, 
                        you can adjust the supply later. Authority settings can also be changed if you retain the authority.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">Is the token creation process reversible?</h3>
                      <p className="text-white/80">
                        No, token creation on the blockchain is permanent and irreversible. Please double-check all parameters before confirming.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">How do I list my token on exchanges?</h3>
                      <p className="text-white/80">
                        Token listing on exchanges is a separate process and depends on the exchange's requirements. However, 
                        tokens created with Aurora Token Forge are fully compatible with all Solana exchanges.
                      </p>
                    </div>
                    
                    <div className="glass-card p-4 rounded-lg">
                      <h3 className="font-bold text-white mb-2">What blockchain networks are supported?</h3>
                      <p className="text-white/80">
                        Currently, Aurora Token Forge supports the Solana blockchain (mainnet-beta, testnet, and devnet).
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-2">Contact & Support</h3>
                  <p className="text-white/80 mb-2">
                    For support, partnership, or questions, email us at <a href="mailto:admin@atechtools.org" className="text-token-purple underline">admin@atechtools.org</a> or DM us on Twitter <a href="https://twitter.com/atechtoolsorg" className="text-token-purple underline" target="_blank" rel="noopener noreferrer">@atechtoolsorg</a>.
                  </p>
                  <a href="mailto:admin@atechtools.org" className="btn-gradient-primary px-4 py-2 rounded-lg text-white font-medium shadow hover:shadow-lg transition-all inline-block">Send us a message</a>
                </div>

                <div className="glass-card p-4 rounded-lg">
                  <h3 className="font-bold text-white mb-2">Privacy</h3>
                  <p className="text-white/80">
                    We respect your privacy and decentralization. Read our <a href="/privacy" className="text-token-purple underline">Privacy Policy</a> for details.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Documentation;