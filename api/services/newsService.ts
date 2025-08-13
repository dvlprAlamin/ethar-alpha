import axios from 'axios';

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
  private baseUrl = 'https://newsapi.org/v2';
  private apiKey = process.env.NEWS_API_KEY;
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
      timestamp: Date.now()
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
        console.warn('NewsAPI key not configured, returning mock data');
        return this.getMockNews(limit);
      }

      const response = await axios.get(
        `${this.baseUrl}/everything`,
        {
          params: {
            q: 'cryptocurrency OR bitcoin OR ethereum OR blockchain OR crypto',
            language: 'en',
            sortBy: 'publishedAt',
            pageSize: limit,
            apiKey: this.apiKey
          },
          timeout: 10000
        }
      );

      const news: CryptoNews[] = response.data.articles.map((article: NewsArticle, index: number) => ({
        id: `news_${Date.now()}_${index}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.urlToImage || '/api/placeholder/400/200',
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author
      }));

      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.error('Error fetching crypto news:', error);
      
      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      return this.getMockNews(limit);
    }
  }

  async getTopHeadlines(limit: number = 10): Promise<CryptoNews[]> {
    const cacheKey = `top_headlines_${limit}`;
    
    if (this.isValidCache(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      if (!this.apiKey) {
        console.warn('NewsAPI key not configured, returning mock data');
        return this.getMockNews(limit);
      }

      const response = await axios.get(
        `${this.baseUrl}/top-headlines`,
        {
          params: {
            category: 'business',
            q: 'cryptocurrency OR bitcoin',
            language: 'en',
            pageSize: limit,
            apiKey: this.apiKey
          },
          timeout: 10000
        }
      );

      const news: CryptoNews[] = response.data.articles.map((article: NewsArticle, index: number) => ({
        id: `headline_${Date.now()}_${index}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        imageUrl: article.urlToImage || '/api/placeholder/400/200',
        publishedAt: article.publishedAt,
        source: article.source.name,
        author: article.author
      }));

      this.setCache(cacheKey, news);
      return news;
    } catch (error) {
      console.error('Error fetching top headlines:', error);
      
      // Return cached data if available, otherwise return mock data
      const cached = this.getCache(cacheKey);
      if (cached) {
        return cached;
      }
      
      return this.getMockNews(limit);
    }
  }

  private getMockNews(limit: number): CryptoNews[] {
    const mockArticles: CryptoNews[] = [
      {
        id: 'mock_1',
        title: 'Bitcoin Reaches New All-Time High as Institutional Adoption Grows',
        description: 'Bitcoin continues its upward trajectory as more institutional investors enter the cryptocurrency market, driving prices to unprecedented levels.',
        url: '#',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=bitcoin%20cryptocurrency%20chart%20rising%20golden%20coins%20financial%20success&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Crypto Daily',
        author: 'John Smith'
      },
      {
        id: 'mock_2',
        title: 'Ethereum 2.0 Staking Rewards Attract More Validators',
        description: 'The Ethereum network sees increased participation in staking as validators are drawn to attractive rewards and network security benefits.',
        url: '#',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ethereum%20blockchain%20network%20staking%20validators%20blue%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Blockchain News',
        author: 'Sarah Johnson'
      },
      {
        id: 'mock_3',
        title: 'DeFi Protocols Show Strong Growth Despite Market Volatility',
        description: 'Decentralized Finance protocols continue to attract users and capital, demonstrating resilience in the face of market uncertainty.',
        url: '#',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=defi%20decentralized%20finance%20protocols%20growth%20charts%20modern%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
        source: 'DeFi Times',
        author: 'Mike Chen'
      },
      {
        id: 'mock_4',
        title: 'Central Banks Explore Digital Currency Implementation',
        description: 'Major central banks worldwide are accelerating their research and development of Central Bank Digital Currencies (CBDCs).',
        url: '#',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=central%20bank%20digital%20currency%20cbdc%20government%20financial%20technology&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
        source: 'Financial Tribune',
        author: 'Emma Wilson'
      },
      {
        id: 'mock_5',
        title: 'NFT Market Shows Signs of Recovery After Recent Downturn',
        description: 'Non-Fungible Token markets are experiencing renewed interest from collectors and investors, signaling a potential recovery.',
        url: '#',
        imageUrl: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=nft%20non%20fungible%20tokens%20digital%20art%20marketplace%20recovery&image_size=landscape_4_3',
        publishedAt: new Date(Date.now() - 18000000).toISOString(),
        source: 'NFT Weekly',
        author: 'Alex Rodriguez'
      }
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