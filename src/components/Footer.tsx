import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 py-12 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-token-purple to-token-blue flex items-center justify-center">
                <span className="text-white font-bold text-sm">AT</span>
              </div>
              <span className="text-lg font-bold text-gradient-purple-blue">ATECHTOOLS</span>
            </div>
            <p className="text-white/60 text-sm">
              The most advanced Solana token creation platform with revolutionary features and stunning design.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com/atechtoolsorg" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-token-purple transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/>
                </svg>
              </a>
              <a href="https://github.com/atechwebsol01" className="text-white/60 hover:text-token-purple transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </a>
              <a href="#" className="text-white/60 hover:text-token-purple transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Platform</h4>
            <ul className="space-y-2">
              <li><Link to="/create" className="text-white/60 hover:text-token-purple transition-colors">Create Token</Link></li>
              <li><Link to="/dashboard" className="text-white/60 hover:text-token-purple transition-colors">Dashboard</Link></li>
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">Documentation</Link></li>
              <li><Link to="/#pricing" className="text-white/60 hover:text-token-purple transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">User Guides</Link></li>
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">API Documentation</Link></li>
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">FAQ</Link></li>
              <li><a href="https://solana.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-token-purple transition-colors">Solana</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2">
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">About Us</Link></li>
              <li><Link to="/privacy" className="text-white/60 hover:text-token-purple transition-colors">Privacy Policy</Link></li>
              <li><Link to="/docs" className="text-white/60 hover:text-token-purple transition-colors">Terms of Service</Link></li>
              <li><a href="mailto:admin@atechtools.org" className="text-white/60 hover:text-token-purple transition-colors">Contact Us</a></li>
            </ul>
            <div className="mt-4">
              <a href="mailto:admin@atechtools.org" className="btn-gradient-primary px-4 py-2 rounded-lg text-white font-medium shadow hover:shadow-lg transition-all block text-center">Send us a message</a>
            </div>
            <div className="mt-4 text-white/60 text-sm">
              <div>Email: <a href="mailto:admin@atechtools.org" className="text-token-purple underline">admin@atechtools.org</a></div>
              <div>Twitter: <a href="https://twitter.com/atechtoolsorg" className="text-token-purple underline" target="_blank" rel="noopener noreferrer">@atechtoolsorg</a></div>
              <div>Website: <a href="https://atechtools.org" className="text-token-purple underline" target="_blank" rel="noopener noreferrer">atechtools.org</a></div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/40 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} ATECHTOOLS. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-white/40 hover:text-token-purple transition-colors text-sm">Privacy Policy</Link>
            <Link to="/docs" className="text-white/40 hover:text-token-purple transition-colors text-sm">Terms of Service</Link>
            <Link to="/docs" className="text-white/40 hover:text-token-purple transition-colors text-sm">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;