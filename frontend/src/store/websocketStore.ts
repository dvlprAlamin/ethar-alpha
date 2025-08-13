import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './authStore';

interface MarketData {
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

interface Portfolio {
  BTC: { balance: number; usdValue: number; price: number };
  ETH: { balance: number; usdValue: number; price: number };
  TRC20: { balance: number; usdValue: number; price: number };
  USD: { balance: number; usdValue: number; price: number };
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

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

interface WebSocketState {
  socket: Socket | null;
  isConnected: boolean;
  marketData: Record<string, MarketData>;
  portfolio: Portfolio | null;
  notifications: Notification[];
  news: NewsArticle[];
  connectionError: string | null;

  // Actions
  connect: () => void;
  disconnect: () => void;
  subscribeToMarket: (pairs: string[]) => void;
  subscribeToPortfolio: () => void;
  subscribeToNotifications: () => void;
  subscribeToNews: () => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => void;
}

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  marketData: {},
  portfolio: null,
  notifications: [],
  news: [],
  connectionError: null,

  connect: () => {
    const { socket: existingSocket } = get();

    // Don't create multiple connections
    if (existingSocket?.connected) {
      return;
    }

    const { token } = useAuthStore.getState();

    const socket = io(WS_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection events
    socket.on('connect', () => {
      console.log('WebSocket connected');
      set({
        isConnected: true,
        connectionError: null,
        socket,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      set({
        isConnected: false,
        socket: null,
      });
    });

    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      set({
        connectionError: error.message,
        isConnected: false,
      });
    });

    // Authentication events
    socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    // Market data events
    socket.on('market:data', (data) => {
      set({ marketData: data.pairs });
    });

    socket.on('market:update', (data) => {
      const { marketData } = get();
      set({
        marketData: {
          ...marketData,
          [data.pair]: data.data,
        },
      });
    });

    // Portfolio events
    socket.on('portfolio:update', (data) => {
      set({ portfolio: data.portfolio });
    });

    // Notification events
    socket.on('notification', (data) => {
      const notification: Notification = {
        id: Date.now().toString(),
        type: data.type || 'info',
        title: data.title,
        message: data.message,
        timestamp: new Date(data.timestamp),
        read: false,
      };

      const { notifications } = get();
      set({
        notifications: [notification, ...notifications].slice(0, 50), // Keep only last 50
      });
    });

    // Trade events
    socket.on('trade:update', (data) => {
      get().addNotification({
        type: 'success',
        title: 'Trade Update',
        message: `Your ${data.type} order for ${data.amount} ${data.baseAsset} has been ${data.status}`,
      });
    });

    // System events
    socket.on('system:message', (data) => {
      get().addNotification({
        type: data.type,
        title: 'System Message',
        message: data.message,
      });
    });

    // Admin events (for admin users)
    socket.on('admin:alert', (data) => {
      get().addNotification({
        type: 'warning',
        title: 'Admin Alert',
        message: data.message,
      });
    });

    // News events
    socket.on('news:update', (data) => {
      set({ news: data.news });
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      get().addNotification({
        type: 'error',
        title: 'Connection Error',
        message: error.message || 'An error occurred with the connection',
      });
    });

    // Ping/Pong for connection health
    socket.on('pong', (data) => {
      // Connection is healthy
    });

    set({ socket });
  },

  disconnect: () => {
    const { socket } = get();

    if (socket) {
      socket.disconnect();
      set({
        socket: null,
        isConnected: false,
        marketData: {},
        portfolio: null,
      });
    }
  },

  subscribeToMarket: (pairs: string[]) => {
    const { socket } = get();

    if (socket?.connected) {
      socket.emit('subscribe:market', { pairs });
    }
  },

  subscribeToPortfolio: () => {
    const { socket } = get();

    if (socket?.connected) {
      socket.emit('subscribe:portfolio');
    }
  },

  subscribeToNotifications: () => {
    const { socket } = get();

    if (socket?.connected) {
      socket.emit('subscribe:notifications');
    }
  },

  subscribeToNews: () => {
    const { socket } = get();

    if (socket?.connected) {
      socket.emit('subscribe:news');
    }
  },

  markNotificationAsRead: (id: string) => {
    const { notifications } = get();

    set({
      notifications: notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    });
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  addNotification: (
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
    };

    const { notifications } = get();
    set({
      notifications: [newNotification, ...notifications].slice(0, 50),
    });
  },
}));

// Auto-connect functionality is handled in App.tsx

// Ping interval to keep connection alive
setInterval(() => {
  const { socket } = useWebSocketStore.getState();

  if (socket?.connected) {
    socket.emit('ping');
  }
}, 30000); // Ping every 30 seconds
