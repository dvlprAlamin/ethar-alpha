import React from 'react';
import Header from '../components/Header';
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
      {/* <HeroSection /> */}

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
