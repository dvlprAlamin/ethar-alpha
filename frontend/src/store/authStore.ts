import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isActive: boolean;
  twoFactorEnabled: boolean;
  balances: {
    BTC: number;
    ETH: number;
    TRC20: number;
    USD: number;
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (
    email: string,
    password: string,
    twoFactorToken?: string
  ) => Promise<{ success: boolean; requiresTwoFactor?: boolean }>;
  register: (
    email: string,
    password: string,
    name: string,
    phone?: string
  ) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateBalance: (currency: string, amount: number) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      isLoading: false,
      error: null,

      login: async (
        email: string,
        password: string,
        twoFactorToken?: string
      ) => {
        set({ loading: true, isLoading: true, error: null });

        try {
          const response = await axios.post('/auth/login', {
            email,
            password,
            twoFactorToken,
          });

          const { token, user, requiresTwoFactor } = response.data;

          // If 2FA is required and no token provided
          if (requiresTwoFactor && !twoFactorToken) {
            set({ loading: false, isLoading: false });
            return { success: false, requiresTwoFactor: true };
          }

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            isLoading: false,
            error: null,
          });

          return { success: true };
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || 'Login failed';
          set({
            loading: false,
            isLoading: false,
            error: errorMessage,
            isAuthenticated: false,
            user: null,
            token: null,
          });

          // Clear axios authorization header
          delete axios.defaults.headers.common['Authorization'];

          return { success: false };
        }
      },

      register: async (
        email: string,
        password: string,
        name: string,
        phone?: string
      ) => {
        set({ loading: true, isLoading: true, error: null });

        try {
          const response = await axios.post('/auth/register', {
            email,
            password,
            name,
            phone,
          });

          const { token, user } = response.data;

          // Set axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          set({
            user,
            token,
            isAuthenticated: true,
            loading: false,
            isLoading: false,
            error: null,
          });

          return true;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.error || 'Registration failed';
          set({
            loading: false,
            isLoading: false,
            error: errorMessage,
          });

          return false;
        }
      },

      logout: () => {
        // Clear axios authorization header
        delete axios.defaults.headers.common['Authorization'];

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      refreshUser: async () => {
        const { token } = get();

        if (!token) {
          console.log('No token available for refresh');
          return;
        }

        try {
          // Set authorization header if not already set
          if (!axios.defaults.headers.common['Authorization']) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }

          console.log('Making API call to /auth/profile...');
          const response = await axios.get('/auth/profile');
          console.log('API response:', response.data);
          
          const user = response.data.user || response.data;
          console.log('Extracted user:', user);
          console.log('User balances:', user?.balances);

          set({ user });
          console.log('User state updated');
        } catch (error: any) {
          console.error('Failed to refresh user:', error);
          console.error('Error response:', error.response?.data);

          // If token is invalid, logout
          if (error.response?.status === 401) {
            get().logout();
          }
        }
      },

      updateBalance: (currency: string, amount: number) => {
        const { user } = get();

        if (user && user.balances.hasOwnProperty(currency)) {
          set({
            user: {
              ...user,
              balances: {
                ...user.balances,
                [currency]: amount,
              },
            },
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ loading, isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set axios authorization header on app load
        if (state?.token) {
          axios.defaults.headers.common[
            'Authorization'
          ] = `Bearer ${state.token}`;
        }
      },
    }
  )
);

// Axios interceptor for handling token expiration
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);
