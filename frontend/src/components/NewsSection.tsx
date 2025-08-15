import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, TrendingUp } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  imageUrl?: string;
}

const NewsSection: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      // Mock news data for now - replace with actual API call
      const mockNews: NewsItem[] = [
        {
          id: '1',
          title:
            'Bitcoin Reaches New All-Time High Amid Institutional Adoption',
          description:
            'Major corporations continue to add Bitcoin to their treasury reserves, driving unprecedented demand and price growth.',
          url: '#',
          publishedAt: '2024-01-15T10:30:00Z',
          source: 'CryptoNews',
          imageUrl:
            'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=200&fit=crop',
        },
        {
          id: '2',
          title: 'Ethereum 2.0 Staking Rewards Hit Record Levels',
          description:
            'The latest network upgrade has significantly improved staking yields, attracting more validators to the network.',
          url: '#',
          publishedAt: '2024-01-15T08:15:00Z',
          source: 'BlockchainDaily',
          imageUrl:
            'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=200&fit=crop',
        },
        {
          id: '3',
          title:
            'NFT Market Shows Signs of Recovery with Blue-Chip Collections',
          description:
            'Premium NFT collections are experiencing renewed interest from collectors and investors worldwide.',
          url: '#',
          publishedAt: '2024-01-15T06:45:00Z',
          source: 'NFTInsider',
          imageUrl:
            'https://images.unsplash.com/photo-1640161704729-cbe966a08476?w=400&h=200&fit=crop',
        },
        {
          id: '4',
          title: 'Central Bank Digital Currencies Gain Momentum Globally',
          description:
            'Multiple countries announce pilot programs for their digital currency initiatives, reshaping the financial landscape.',
          url: '#',
          publishedAt: '2024-01-14T22:20:00Z',
          source: 'FinTechToday',
          imageUrl:
            'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&h=200&fit=crop',
        },
        {
          id: '5',
          title: 'DeFi Protocols Report Surge in Total Value Locked',
          description:
            'Decentralized finance platforms see massive growth as users seek higher yields and financial autonomy.',
          url: '#',
          publishedAt: '2024-01-14T18:10:00Z',
          source: 'DeFiPulse',
          imageUrl:
            'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=400&h=200&fit=crop',
        },
        {
          id: '6',
          title: 'Regulatory Clarity Boosts Crypto Market Confidence',
          description:
            'New guidelines from financial regulators provide much-needed clarity for cryptocurrency businesses and investors.',
          url: '#',
          publishedAt: '2024-01-14T15:30:00Z',
          source: 'RegulatoryWatch',
          imageUrl:
            'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=200&fit=crop',
        },
      ];

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setNews(mockNews);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }
  };

  if (loading) {
    return (
      <section id="news" className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Latest Crypto News
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Stay updated with the latest developments in cryptocurrency and
              blockchain technology
            </p>
          </div>
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="news" className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="news" className="py-20 bg-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-cyan-400 mr-3" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Latest Crypto News
            </h2>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Stay updated with the latest developments in cryptocurrency and
            blockchain technology
          </p>
        </div>

        {/* News Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.map((article) => (
            <article
              key={article.id}
              className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden hover:border-cyan-500 transition-all duration-300 group hover:transform hover:-translate-y-2 hover:shadow-2xl"
            >
              {/* Image */}
              <div className="relative h-48 bg-slate-700 overflow-hidden">
                {article.imageUrl ? (
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TrendingUp className="h-12 w-12 text-slate-500" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-cyan-400">
                    {article.source}
                  </span>
                  <div className="flex items-center text-slate-400 text-sm">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDate(article.publishedAt)}
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-cyan-400 transition-colors duration-200">
                  {article.title}
                </h3>

                <p className="text-slate-300 text-sm mb-4 line-clamp-3">
                  {article.description}
                </p>

                <a
                  href={article.url}
                  className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Read More
                  <ExternalLink className="h-4 w-4 ml-1" />
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl">
            View All News
          </button>
        </div>
      </div>
    </section>
  );
};

export default NewsSection;
