import React, { useEffect, useState } from 'react';
import { useWebSocketStore } from '../store/websocketStore';
import { useAuthStore } from '../store/authStore';
import {
  Newspaper,
  ExternalLink,
  Clock,
  RefreshCw,
  TrendingUp,
  Globe,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import Card from '../components/Card';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
  author?: string;
}

// Legacy interface for backward compatibility
interface LegacyNewsArticle {
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [additionalNews, setAdditionalNews] = useState<NewsArticle[]>([]);

  useEffect(() => {
    console.log('🚀 News component mounted - isConnected:', isConnected);

    // Always try to fetch news on initial load, regardless of WebSocket connection
    fetchAdditionalNews(1, false);

    if (isConnected) {
      subscribeToNews();

      // Auto-refresh every 5 minutes
      const interval = setInterval(() => {
        fetchAdditionalNews(1, false);
        setCurrentPage(1);
        setHasMore(true);
      }, 5 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [isConnected, subscribeToNews]);

  useEffect(() => {
    console.log('🔌 Connection status changed - isConnected:', isConnected);
  }, [isConnected]);

  useEffect(() => {
    console.log(
      '📊 additionalNews updated - length:',
      additionalNews.length,
      'articles:',
      additionalNews
    );
  }, [additionalNews]);

  useEffect(() => {
    if (news.length > 0) {
      setLoading(false);
    }
  }, [news]);

  const fetchAdditionalNews = async (
    page: number = 1,
    append: boolean = false
  ) => {
    console.log(
      '🔍 fetchAdditionalNews called - page:',
      page,
      'append:',
      append,
      'loadingMore:',
      loadingMore,
      'hasMore:',
      hasMore
    );

    if (loadingMore || !hasMore) {
      console.log(
        '⚠️ Skipping fetch - loadingMore:',
        loadingMore,
        'hasMore:',
        hasMore
      );
      return;
    }

    try {
      const limit = 20;
      const offset = (page - 1) * limit;

      const API_BASE_URL = import.meta.env.VITE_API_URL;
      const apiUrl = `${API_BASE_URL}/market/news?limit=${limit}&offset=${offset}`;

      console.log('📡 Making API call to:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      console.log(
        '📥 API Response status:',
        response.status,
        response.statusText
      );

      if (response.ok) {
        const responseData = await response.json();
        console.log('📊 API Response data:', responseData);

        // Handle API response format: { success: true, data: [...articles] }
        const articles =
          responseData.data || responseData.articles || responseData || [];

        console.log('✅ Data received, articles count:', articles.length);

        // Convert to consistent format
        const normalizedArticles: NewsArticle[] = articles.map(
          (article: any, index: number) => {
            // Check if it's legacy format (has source.name) or new format (has source as string)
            if (
              article.source &&
              typeof article.source === 'object' &&
              article.source.name
            ) {
              // Legacy format
              return {
                id: article.id || `legacy_${Date.now()}_${index}`,
                title: article.title,
                description: article.description || '',
                url: article.url,
                imageUrl:
                  article.urlToImage ||
                  article.imageUrl ||
                  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cryptocurrency%20news%20bitcoin%20blockchain%20technology&image_size=landscape_4_3',
                publishedAt: article.publishedAt,
                source: article.source.name,
                author: article.author,
              };
            } else {
              // New CoinStats format
              return {
                id: article.id || `news_${Date.now()}_${index}`,
                title: article.title,
                description: article.description || '',
                url: article.url,
                imageUrl:
                  article.imageUrl ||
                  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=cryptocurrency%20news%20bitcoin%20blockchain%20technology&image_size=landscape_4_3',
                publishedAt: article.publishedAt,
                source: article.source || 'CoinStats',
                author: article.author,
              };
            }
          }
        );

        console.log('🔄 Normalized news articles:', normalizedArticles);

        if (append) {
          setAdditionalNews((prev) => {
            const newNews = [...prev, ...normalizedArticles];
            console.log(
              '📰 Updated additionalNews array length:',
              newNews.length
            );
            return newNews;
          });
        } else {
          setAdditionalNews(normalizedArticles);
        }

        // Check if there are more articles to load
        setHasMore(normalizedArticles.length === limit);

        if (normalizedArticles.length < limit) {
          console.log('🔚 No more articles available');
        }
      }
    } catch (error) {
      console.error('💥 Error fetching additional news:', error);
    } finally {
      if (!append) {
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
      console.log('✨ fetchAdditionalNews completed');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMore(true);
    try {
      await fetchAdditionalNews(1, false);
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // const loadMore = async () => {
  //   if (loadingMore || !hasMore) return;

  //   setLoadingMore(true);
  //   const nextPage = currentPage + 1;

  //   try {
  //     await fetchAdditionalNews(nextPage, true);
  //     setCurrentPage(nextPage);
  //   } catch (error) {
  //     console.error('Error loading more news:', error);
  //   }
  // };

  const formatTimeAgo = (dateString: string) => {
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
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const allNews = [...news, ...additionalNews].slice(0, 20);

  if (loading) {
    return (
      <div className="h-full bg-gray-50 flex items-center justify-center">
        <LoadingSpinner text="Loading crypto news..." />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 lg:p-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
                <Newspaper className="w-8 h-8 mr-3 text-blue-600" />
                Crypto News
              </h1>
              <p className="text-gray-600 mt-1 lg:mt-2">
                Stay updated with the latest cryptocurrency news
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  isConnected
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-red-500'
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Live Updates' : 'Disconnected'}
                </span>
              </div> */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable News Feed */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 pt-0">
        <div className="max-w-6xl mx-auto space-y-4">
          {allNews.length === 0 ? (
            <Card className="p-8 lg:p-12 text-center">
              <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No News Available
              </h3>
              <p className="text-gray-500">
                Check back later for the latest crypto news updates.
              </p>
            </Card>
          ) : (
            allNews.map((article, index) => (
              <Card
                key={`${article.url}-${index}`}
                className="hover:shadow-md transition-shadow"
              >
                <div className="p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                    {/* Article Image */}
                    <div className="flex-shrink-0 sm:w-24">
                      {article?.imageUrl ? (
                        <img
                          src={article?.imageUrl}
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
                            <span>{article.source || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>{formatTimeAgo(article.publishedAt)}</span>
                          </div>
                        </div>

                        {index < 3 && (
                          <div className="flex items-center space-x-1 text-orange-600">
                            <TrendingUp className="w-4 h-4" />
                            <span className="text-xs font-medium">
                              Trending
                            </span>
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
      </div>
    </div>
  );
};

export default News;
