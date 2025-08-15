import axios from 'axios';
import { OPENSEA_API_KEY } from '../config/environment';
import logger from '../utils/logger';

interface OpenSeaNFT {
  identifier: string;
  collection: string;
  contract: string;
  token_standard: string;
  name: string;
  description: string;
  image_url: string;
  metadata_url: string;
  opensea_url: string;
  updated_at: string;
  is_disabled: boolean;
  is_nsfw: boolean;
}

interface OpenSeaCollection {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  banner_image_url: string;
  owner: string;
  safelist_status: string;
  category: string;
  is_disabled: boolean;
  is_nsfw: boolean;
  trait_offers_enabled: boolean;
  collection_offers_enabled: boolean;
  opensea_url: string;
  project_url: string;
  wiki_url: string;
  discord_url: string;
  telegram_url: string;
  twitter_username: string;
  instagram_username: string;
  contracts: Array<{
    address: string;
    chain: string;
  }>;
}

interface NFTData {
  identifier: string;
  name: string;
  description: string;
  image_url: string;
  collection_name: string;
  opensea_url: string;
  contract_address: string;
  token_standard: string;
  last_updated: string;
}

interface CollectionStats {
  collection: string;
  name: string;
  description: string;
  image_url: string;
  floor_price: number;
  market_cap: number;
  volume_24h: number;
  change_24h: number;
  opensea_url: string;
  total_supply: number;
}

class OpenSeaService {
  private readonly baseURL = process.env.OPENSEA_API_BASE_URL;
  private readonly apiKey: string;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.apiKey = OPENSEA_API_KEY;
    if (!this.apiKey) {
      logger.warn('OpenSea API key not found. Using mock data.');
    }
  }

  private getHeaders() {
    const headers: any = {
      Accept: 'application/json',
      'User-Agent': 'Ethar-Alpha/1.0',
    };

    if (this.apiKey) {
      headers['X-API-KEY'] = this.apiKey;
    }

    return headers;
  }

  private isValidCache(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  private getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached ? cached.data : null;
  }

  async getTrendingCollections(): Promise<CollectionStats[]> {
    const cacheKey = `trending_collections`;

    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.get(`${this.baseURL}/collections`, {
        headers: this.getHeaders(),
        timeout: 10000,
      });
      console.log('response', response);
      return response.data.collections;
    } catch (error) {
      console.error('Error fetching trending collections:', error);

      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      return [];
    }
  }

  // async getNFTsByCollection(collection: string, limit: number = 20): Promise<NFTData[]> {
  //   const cacheKey = `nfts_${collection}_${limit}`;

  //   if (this.isValidCache(cacheKey)) {
  //     return this.getCache(cacheKey);
  //   }

  //   try {
  //     const response = await axios.get(
  //       `${this.baseUrl}/collection/${collection}/nfts`,
  //       {
  //         params: {
  //           limit: Math.min(limit, 200) // OpenSea API limit
  //         },
  //         headers: this.getHeaders(),
  //         timeout: 15000
  //       }
  //     );

  //     const nfts: NFTData[] = response.data.nfts.map((nft: OpenSeaNFT) => ({
  //       identifier: nft.identifier,
  //       name: nft.name || `#${nft.identifier}`,
  //       description: nft.description || '',
  //       image_url: nft.image_url || '',
  //       collection_name: nft.collection,
  //       opensea_url: nft.opensea_url,
  //       contract_address: nft.contract,
  //       token_standard: nft.token_standard,
  //       last_updated: nft.updated_at
  //     }));

  //     this.setCache(cacheKey, nfts);
  //     return nfts;
  //   } catch (error) {
  //     console.error('Error fetching NFTs by collection:', error);

  //     // Return cached data if available, otherwise return mock data
  //     const cached = this.getCache(cacheKey);
  //     if (cached) {
  //       return cached;
  //     }

  //     // Return mock data as fallback
  //     return this.getMockNFTs(limit);
  //   }
  // }

  clearCache(): void {
    this.cache.clear();
  }
}

export const openSeaService = new OpenSeaService();
export default openSeaService;
