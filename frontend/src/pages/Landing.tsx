import React from 'react';
import Header from '../components/Header';
import HeroSection from '../components/HeroSection';
import MarketPriceSection from '../components/MarketPriceSection';
import NewsSection from '../components/NewsSection';
import WhyChooseUs from '../components/WhyChooseUs';
import Footer from '../components/Footer';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Market Prices Section */}
      <section id="markets" className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Live Market Prices
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              Track real-time cryptocurrency and NFT prices with our advanced
              market data
            </p>
          </div>
          <MarketPriceSection />
        </div>
      </section>

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
