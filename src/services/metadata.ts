// services/metadata.ts - Complete metadata service with IPFS upload

import { IPFS_CONFIG } from '../config';

// Upload file to IPFS using Pinata
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    if (!IPFS_CONFIG.pinataApiKey || !IPFS_CONFIG.pinataSecretKey) {
      console.warn('IPFS configuration missing, using placeholder URL');
      return 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Token+Image';
    }

    const formData = new FormData();
    formData.append('file', file);

    const pinataMetadata = JSON.stringify({
      name: `ATECHTOOLS_${file.name}_${Date.now()}`,
      keyvalues: {
        platform: 'ATECHTOOLS',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', pinataMetadata);

    const pinataOptions = JSON.stringify({
      cidVersion: 0,
    });
    formData.append('pinataOptions', pinataOptions);

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': IPFS_CONFIG.pinataApiKey,
        'pinata_secret_api_key': IPFS_CONFIG.pinataSecretKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`IPFS upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    console.log('✅ File uploaded to IPFS:', ipfsUrl);
    return ipfsUrl;

  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    
    // Fallback: create a data URL for images
    if (file.type.startsWith('image/')) {
      try {
        const dataUrl = await fileToDataUrl(file);
        console.log('📎 Using fallback data URL for image');
        return dataUrl;
      } catch {
        // Final fallback
        return 'https://via.placeholder.com/400x400/6366f1/ffffff?text=Upload+Failed';
      }
    }
    
    throw error;
  }
};

// Upload JSON metadata to IPFS
export const uploadMetadataToIPFS = async (metadata: object): Promise<string> => {
  try {
    if (!IPFS_CONFIG.pinataApiKey || !IPFS_CONFIG.pinataSecretKey) {
      console.warn('IPFS configuration missing, using placeholder URL');
      return 'https://via.placeholder.com/metadata.json';
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': IPFS_CONFIG.pinataApiKey,
        'pinata_secret_api_key': IPFS_CONFIG.pinataSecretKey,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `ATECHTOOLS_metadata_${Date.now()}`,
          keyvalues: {
            platform: 'ATECHTOOLS',
            type: 'metadata',
            timestamp: Date.now().toString()
          }
        },
        pinataOptions: {
          cidVersion: 0,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Metadata upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const metadataUrl = `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
    
    console.log('✅ Metadata uploaded to IPFS:', metadataUrl);
    return metadataUrl;

  } catch (error) {
    console.error('❌ Metadata upload failed:', error);
    throw error;
  }
};

// Convert file to data URL
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        resolve(event.target.result as string);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsDataURL(file);
  });
};

// Validate image file
export const validateImageFile = (file: File): { valid: boolean; message: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.'
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      message: 'File size too large. Please upload an image under 5MB.'
    };
  }

  return { valid: true, message: 'Valid image file' };
};

// Fetch metadata from IPFS/HTTP URL
export const fetchMetadata = async (uri: string): Promise<any> => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch metadata:', error);
    return null;
  }
};

// Create token metadata object and upload to IPFS
export const createTokenMetadata = async (params: {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  properties?: {
    files?: Array<{ uri: string; type: string }>;
    category?: string;
    creators?: Array<{ address: string; verified: boolean; share: number }>;
  };
  external_url?: string;
}): Promise<string> => {
  const metadata = {
    name: params.name,
    symbol: params.symbol,
    description: params.description || `${params.name} token created with ATECHTOOLS`,
    image: params.image || '',
    plan: "enterprise", // Add plan for enterprise tokens
    attributes: params.attributes || [],
    properties: {
      files: params.image ? [{ uri: params.image, type: 'image/png' }] : [],
      category: 'image',
      creators: params.properties?.creators || [],
      ...params.properties
    },
    external_url: params.external_url || 'https://atechtools.io'
  };

  // Upload metadata to IPFS and return the URL
  return await uploadMetadataToIPFS(metadata);
};

// Helper function for Arweave upload (alternative to IPFS)
// Removed unused parameter 'file' from uploadToArweave to fix TS error
export const uploadToArweave = async () => {
  // Placeholder for Arweave upload implementation
  // You can implement this if you prefer Arweave over IPFS
  throw new Error('Arweave upload not implemented yet');
};

// Get IPFS gateway URL from hash
export const getIPFSUrl = (hash: string, gateway = 'https://gateway.pinata.cloud/ipfs/'): string => {
  if (hash.startsWith('http')) {
    return hash; // Already a full URL
  }
  return `${gateway}${hash}`;
};

// Convert IPFS URL to different gateway
export const convertIPFSUrl = (url: string, newGateway = 'https://gateway.pinata.cloud/ipfs/'): string => {
  // Extract IPFS hash from URL
  const ipfsRegex = /\/ipfs\/([a-zA-Z0-9]+)/;
  const match = url.match(ipfsRegex);
  
  if (match) {
    return `${newGateway}${match[1]}`;
  }
  
  return url; // Return original if not an IPFS URL
};

// Check if URL is an IPFS URL
export const isIPFSUrl = (url: string): boolean => {
  return url.includes('/ipfs/') || url.startsWith('ipfs://');
};

// Default export for compatibility
export default {
  uploadToIPFS,
  uploadMetadataToIPFS,
  validateImageFile,
  fetchMetadata,
  createTokenMetadata,
  uploadToArweave,
  getIPFSUrl,
  convertIPFSUrl,
  isIPFSUrl
};