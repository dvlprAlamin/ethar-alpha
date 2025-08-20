import React from 'react';
import Header from '../components/Header';
import MarketPriceSection from '../components/MarketPriceSection';
import NewsSection from '../components/NewsSection';
import WhyChooseUs from '../components/WhyChooseUs';
import Footer from '../components/Footer';
import CryptoBanner from '../components/CryptoBanner';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <Header />
      <CryptoBanner />

      {/* Market Prices Section */}
      <MarketPriceSection />

      {/* News Section */}
      <NewsSection />

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;
