import React from 'react';
import { Shield, Zap, Users, Lock, Award, Globe } from 'lucide-react';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="group">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 h-full hover:border-cyan-500 transition-all duration-300 hover:transform hover:-translate-y-2 hover:shadow-2xl">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg mb-6 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-xl font-semibold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-200">
          {title}
        </h3>
        <p className="text-slate-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};

const WhyChooseUs: React.FC = () => {
  const features = [
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: 'P2P Network',
      description:
        'Experience true peer-to-peer trading with our decentralized network architecture that connects traders directly without intermediaries.',
    },
    {
      icon: <Shield className="h-8 w-8 text-white" />,
      title: 'Multi-Wallet Support',
      description:
        'Seamlessly connect with MetaMask, Trust Wallet, WalletConnect, and TokenPocket. Your favorite wallet, our powerful platform.',
    },
    {
      icon: <Zap className="h-8 w-8 text-white" />,
      title: 'Easy to Understand',
      description:
        'Intuitive interface designed for both beginners and experts. Start trading crypto with confidence using our user-friendly platform.',
    },
    {
      icon: <Lock className="h-8 w-8 text-white" />,
      title: '100% Decentralized',
      description:
        'Full decentralization means you maintain complete control of your assets. No central authority, no single point of failure.',
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: '24h Support',
      description:
        'Round-the-clock customer support available 24/7. Get assistance whenever you need it, from our dedicated support team.',
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: 'Global Access',
      description:
        'Trade from anywhere in the world with our globally compliant platform. Access hundreds of cryptocurrencies and trading pairs from a single interface.',
    },
  ];

  return (
    <section id="why-choose-us" className="py-20 bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-cyan-400 mr-3" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Why Choose Ethar Alpha?
            </h2>
          </div>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Experience the future of cryptocurrency trading with our
            cutting-edge platform designed for both beginners and professionals
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
