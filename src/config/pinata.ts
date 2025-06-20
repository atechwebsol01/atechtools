// Enhanced Pinata configuration handler

// Pinata configuration with fallback values
const config = {
  pinataApiKey: import.meta.env.VITE_PINATA_API_KEY as string,
  pinataSecretKey: import.meta.env.VITE_PINATA_SECRET_KEY as string,
  pinataEndpoint: 'https://api.pinata.cloud',
};

/**
 * Validates that Pinata API keys are configured
 * @throws Error if keys are not configured
 */
export const validateConfig = () => {
  if (!config.pinataApiKey || !config.pinataSecretKey) {
    throw new Error('Pinata API keys not configured. Please add them to your .env file.');
  }
};

/**
 * Returns the Pinata configuration
 */
export const getPinataConfig = () => config;

/**
 * Checks if Pinata is properly configured
 */
export const isPinataConfigured = (): boolean => {
  return Boolean(config.pinataApiKey && config.pinataSecretKey);
};