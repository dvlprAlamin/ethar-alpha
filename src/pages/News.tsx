import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from '../store/websocketStore';
import { useAuthStore } from '../store/authStore';
import {
  Newspaper,
  ExternalLink,
  Clock,
  RefreshCw,
  TrendingUp,
  Globe
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  urlToImage: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

const News: React.FC = () => {
  const { user } = useAuthStore();
  const { news, isConnected, subscribeToNews } = useWebSocketStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [additionalNews, setAdditionalNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    if (isConnected) {
      subscribeToNews();
      fetchAdditionalNews();
    }
  }, [isConnected, subscribeToNews]);

  useEffect(() => {
    if (news.length > 0) {
      setLoading(false);
    }
  }, [news]);

  const fetchAdditionalNews = async () => {
    try {
      const response = await fetch('/api/market/news', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAdditionalNews(data.articles || []);
      }
    } catch (error) {
      console.error('Error fetching additional news:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdditionalNews();
    setRefreshing(false);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const allNews = [...news, ...additionalNews].slice(0, 20);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
        <div className="max-w-6xl mx-auto">
          <LoadingSpinner text="Loading crypto news..." />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <Newspaper className="w-8 h-8 mr-3 text-blue-600" />
                Crypto News
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2">Stay updated with the latest cryptocurrency news</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Live Updates' : 'Disconnected'}
                </span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* News Feed */}
        <div className="space-y-4">
          {allNews.length === 0 ? (
            <Card className="p-8 lg:p-12 text-center">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No News Available</h3>
              <p className="text-gray-500">Check back later for the latest crypto news updates.</p>
            </Card>
          ) : (
            allNews.map((article, index) => (
              <Card key={`${article.url}-${index}`} className="hover:shadow-md transition-shadow">
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    {/* Article Image */}
                    <div className="flex-shrink-0 sm:w-24">
                      {article.urlToImage ? (
                        <img
                          src={article.urlToImage}
                          alt={article.title}
                          className="w-full sm:w-24 h-48 sm:h-24 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-full sm:w-24 h-48 sm:h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Article Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-base lg:text-lg font-semibold text-gray-900 line-clamp-2 pr-4">
                          {article.title}
                        </h3>
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Read full article"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      </div>

                      {article.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {article.description}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-1 sm:space-y-0">
                          <div className="flex items-center space-x-1">
                            <Globe className="w-4 h-4" />
                            <span>{article.source.name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(article.publishedAt)}</span>
                          </div>
                        </div>
                        
                        {index < 3 && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">Trending</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {allNews.length >= 20 && (
          <div className="text-center mt-6 lg:mt-8">
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto">
              Load More News
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default News;