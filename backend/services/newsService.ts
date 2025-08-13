import axios from 'axios';

// CoinStats API response interface
interface CoinStatsNewsArticle {
  id: string;
  title: string;
  description?: string;
  link: string;
  imgUrl: string;
  feedDate: number;
  source: string;
  sourceLink: string;
  content?: boolean;
  shareURL?: string;
}

// Legacy NewsAPI interface (kept for compatibility)
interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
  author?: string;
}

interface CryptoNews {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author?: string;
}

class NewsService {
  private baseUrl = 'https://openapiv1.coinstats.app';
  private apiKey =
    process.env.COINSTATS_API_KEY ||
    'UKBoWKe6LaXMhu3OJ+X72t1FpJ8KYCEh8II+Ma4OTxw=';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 300000; // 5 minutes cache

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

  async getCryptoNews(limit: number = 20): Promise<CryptoNews[]> {
    const cacheKey = `crypto_news_${limit}`;

    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      if (!this.apiKey) {
        console.warn('CoinStats API key not configured, returning mock data');
        return this.getMockNews(limit);
      }

      const response = await axios.get(`${this.baseUrl}/news`, {
        headers: {
          'X-API-KEY': this.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      // CoinStats API returns an object with a 'result' property containing the array
      let articles: CoinStatsNewsArticle[] = [];
      if (Array.isArray(response.data)) {
        articles = response.data;
      } else if (response.data && Array.isArray(response.data.result)) {
        articles = response.data.result;
      } else if (response.data && Array.isArray(response.data.data)) {
        articles = response.data.data;
      } else if (response.data && Array.isArray(response.data.news)) {
        articles = response.data.news;
      } else {
        console.log('Unexpected response structure from CoinStats API');
        articles = [];
      }

      const news: CryptoNews[] = articles
        .slice(0, limit)
        .map((article: CoinStatsNewsArticle) => ({
          id: article.id || `news_${Date.now()}_${Math.random()}`,
          title: article.title || 'No title available',
          description: article.description || '',
          url: article.link || '#',
          imageUrl:
            article.imgUrl ||
            'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cryptocurrency%20news%20bitcoin%20blockchain%20technology&image_size=landscape_4_3',
          publishedAt: article.feedDate
            ? new Date(article.feedDate).toISOString()
            : new Date().toISOString(),
          source: article.source || 'CoinStats',
          author: undefined,
        }));

      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.error('Error fetching crypto news from CoinStats:', error);

      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }

      return this.getMockNews(limit);
    }
  }

  async getTopHeadlines(limit: number = 10): Promise<CryptoNews[]> {
    // For CoinStats API, we'll use the same endpoint but return fewer items
    return this.getCryptoNews(limit);
  }

  private getMockNews(limit: number): CryptoNews[] {
    const mockArticles: CryptoNews[] = [
      {
        id: 'mock_1',
        title:
          'Bitcoin Reaches New All-Time High as Institutional Adoption Grows',
        description:
          'Bitcoin continues its upward trajectory as more institutional investors enter the cryptocurrency market, driving prices to unprecedented levels.',
        url: '#',
        imageUrl:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bitcoin%20cryptocurrency%20chart%20rising%20golden%20coins%20financial%20success&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Crypto Daily',
        author: 'John Smith',
      },
      {
        id: 'mock_2',
        title: 'Ethereum 2.0 Staking Rewards Attract More Validators',
        description:
          'The Ethereum network sees increased participation in staking as validators are drawn to attractive rewards and network security benefits.',
        url: '#',
        imageUrl:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ethereum%20blockchain%20network%20staking%20validators%20blue%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Blockchain News',
        author: 'Sarah Johnson',
      },
      {
        id: 'mock_3',
        title: 'DeFi Protocols Show Strong Growth Despite Market Volatility',
        description:
          'Decentralized Finance protocols continue to attract users and capital, demonstrating resilience in the face of market uncertainty.',
        url: '#',
        imageUrl:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=defi%20decentralized%20finance%20protocols%20growth%20charts%20modern%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: 'DeFi Times',
        author: 'Mike Chen',
      },
      {
        id: 'mock_4',
        title: 'Central Banks Explore Digital Currency Implementation',
        description:
          'Major central banks worldwide are accelerating their research and development of Central Bank Digital Currencies (CBDCs).',
        url: '#',
        imageUrl:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=central%20bank%20digital%20currency%20cbdc%20government%20financial%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        source: 'Financial Tribune',
        author: 'Emma Wilson',
      },
      {
        id: 'mock_5',
        title: 'NFT Market Shows Signs of Recovery After Recent Downturn',
        description:
          'Non-Fungible Token markets are experiencing renewed interest from collectors and investors, signaling a potential recovery.',
        url: '#',
        imageUrl:
          'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=nft%20non%20fungible%20tokens%20digital%20art%20marketplace%20recovery&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        source: 'NFT Weekly',
        author: 'Alex Rodriguez',
      },
    ];

    return mockArticles.slice(0, limit);
  }

  // Clear cache manually if needed
  clearCache(): void {
    this.cache.clear();
  }
}

export const newsService = new NewsService();
export default NewsService;
export type { CryptoNews, NewsArticle };
