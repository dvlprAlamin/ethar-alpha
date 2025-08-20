import React from 'react';

import MarketPriceSection from '../components/MarketPriceSection';
import NewsSection from './../components/NewsSection';
import WhyChooseUs from './../components/WhyChooseUs';
import Footer from './../components/Footer';
import CryptoBanner from './../components/CryptoBanner';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-slate-950">
      <div>
        <CryptoBanner />
        <MarketPriceSection isDashboard />
        {/* News Section */}
        <NewsSection />

        {/* Why Choose Us Section */}
        <WhyChooseUs />

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;
