import React from 'react';

import MarketPriceSection from '../components/MarketPriceSection';
import NewsSection from './../components/NewsSection';
import WhyChooseUs from './../components/WhyChooseUs';
import Footer from './../components/Footer';

const Dashboard: React.FC = () => {
  return (
    <div className="bg-slate-950">
      <div>
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
