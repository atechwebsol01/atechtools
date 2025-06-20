// Mock environment variables
process.env.VITE_TREASURY_WALLET = "7ZvYnqt3yGLZ5JGhUimYuEP1m5ZEjqFWc2GkxXHvyV5g";
process.env.VITE_TRANSFER_FEE_BPS = "10";

// Mock the window object
global.window = {
  solana: {}
};

// Mock the fetch API
global.fetch = jest.fn();
