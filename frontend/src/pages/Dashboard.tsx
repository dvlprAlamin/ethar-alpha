import React from 'react';
import { useAuthStore } from '../store/authStore';

import MarketPriceSection from '../components/MarketPriceSection';

const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-300">Welcome back, {user?.name}</p>
        </div>
      </div>

      {/* Real-time Market Price Section */}
      <MarketPriceSection />
    </div>
  );
};

export default Dashboard;
