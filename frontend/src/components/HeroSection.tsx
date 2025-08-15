import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BarChart3, Shield, Zap } from 'lucide-react';

const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2300d4ff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 text-cyan-400 opacity-20 animate-pulse">
        <TrendingUp className="h-8 w-8" />
      </div>
      <div className="absolute top-40 right-20 text-blue-400 opacity-20 animate-pulse delay-1000">
        <BarChart3 className="h-6 w-6" />
      </div>
      <div className="absolute bottom-40 left-20 text-cyan-300 opacity-20 animate-pulse delay-2000">
        <Shield className="h-7 w-7" />
      </div>
      <div className="absolute bottom-20 right-10 text-blue-300 opacity-20 animate-pulse delay-500">
        <Zap className="h-5 w-5" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white lg:leading-[1.1]">
              Trade Crypto &{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                NFTs
              </span>{' '}
              with Confidence
            </h1>
            <p className="mt-6 text-xl text-slate-300 leading-relaxed">
              Join millions of traders worldwide. Access real-time market data,
              advanced trading tools, and secure your digital assets with our
              professional-grade platform.
            </p>

            {/* Stats */}
            {/* <div className="mt-8 grid grid-cols-3 gap-6 text-center lg:text-left">
              <div>
                <div className="text-2xl font-bold text-cyan-400">$2.5B+</div>
                <div className="text-sm text-slate-400">Trading Volume</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">500K+</div>
                <div className="text-sm text-slate-400">Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">99.9%</div>
                <div className="text-sm text-slate-400">Uptime</div>
              </div>
            </div> */}

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                to="/register"
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                Start Trading Now
              </Link>
              <a
                href="#markets"
                className="border-2 border-slate-600 hover:border-cyan-400 text-slate-300 hover:text-cyan-400 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:bg-slate-800"
              >
                View Markets
              </a>
            </div>
          </div>

          {/* Visual Element */}
          <div className="relative">
            <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-2xl">
              {/* Mock Trading Interface */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-white">
                    Live Markets
                  </h3>
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-slate-400">Live</span>
                  </div>
                </div>

                {/* Mock Price Cards */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        ₿
                      </div>
                      <div>
                        <div className="text-white font-medium">Bitcoin</div>
                        <div className="text-slate-400 text-sm">BTC</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">$43,250</div>
                      <div className="text-green-400 text-sm">+2.5%</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        Ξ
                      </div>
                      <div>
                        <div className="text-white font-medium">Ethereum</div>
                        <div className="text-slate-400 text-sm">ETH</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">$2,680</div>
                      <div className="text-red-400 text-sm">-1.2%</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-slate-800 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        🎨
                      </div>
                      <div>
                        <div className="text-white font-medium">NFT Floor</div>
                        <div className="text-slate-400 text-sm">BAYC</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white font-semibold">15.2 ETH</div>
                      <div className="text-green-400 text-sm">+5.8%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 -z-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
