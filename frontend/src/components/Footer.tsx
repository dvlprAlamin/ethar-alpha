import React from 'react';
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'Trading', href: '#' },
      { name: 'Markets', href: '#' },
      { name: 'Portfolio', href: '#' },
      { name: 'Analytics', href: '#' },
      { name: 'API', href: '#' },
    ],
    support: [
      { name: 'Help Center', href: '#' },
      { name: 'Contact Us', href: '#' },
      { name: 'Trading Guide', href: '#' },
      { name: 'Security', href: '#' },
      { name: 'Status', href: '#' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Press', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Partners', href: '#' },
    ],
    legal: [
      { name: 'Terms of Service', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'Compliance', href: '#' },
      { name: 'Licenses', href: '#' },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: <Twitter className="h-5 w-5" />, href: '#' },
    { name: 'Facebook', icon: <Facebook className="h-5 w-5" />, href: '#' },
    { name: 'Instagram', icon: <Instagram className="h-5 w-5" />, href: '#' },
    { name: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, href: '#' },
  ];

  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center  space-x-2 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-400 p-2 rounded-lg group-hover:from-blue-600 group-hover:to-cyan-500 transition-all duration-200">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors duration-200">
                  Ethar Alpha
                </span>
              </div>
              <p className="text-slate-300 mb-6 max-w-md">
                The world's leading cryptocurrency trading platform. Trade with
                confidence, security, and speed.
              </p>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center text-slate-300">
                  <Mail className="h-4 w-4 mr-3 text-cyan-400" />
                  <span className="text-sm">support@cryptotrade.com</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <Phone className="h-4 w-4 mr-3 text-cyan-400" />
                  <span className="text-sm">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center text-slate-300">
                  <MapPin className="h-4 w-4 mr-3 text-cyan-400" />
                  <span className="text-sm">New York, NY 10001</span>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Platform</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 text-sm flex items-center group"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 text-sm flex items-center group"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 text-sm flex items-center group"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 text-sm flex items-center group"
                    >
                      {link.name}
                      <ExternalLink className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Section */}
        {/* <div className="py-8 border-t border-slate-800">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-6 lg:mb-0">
              <h3 className="text-white font-semibold mb-2">Stay Updated</h3>
              <p className="text-slate-300 text-sm">
                Get the latest crypto news and market updates delivered to your
                inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors duration-200 flex-1 lg:w-64"
              />
              <button className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div> */}

        {/* Bottom Section */}
        <div className="py-6 border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-slate-400 text-sm">
                © {currentYear} CryptoTrade. All rights reserved.
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-sm">Developed by</span>
                <Link to="https://www.coolsheikh.com/" target="_blank">
                  <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    CoolSheikh
                  </div>
                </Link>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-4">
              <span className="text-slate-400 text-sm mr-2">Follow us:</span>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="text-slate-400 hover:text-cyan-400 transition-colors duration-200"
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <div className="py-4 border-t border-slate-800">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-500/20 p-1 rounded">
                <Shield className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  <strong className="text-white">Security Notice:</strong> Never
                  share your private keys or seed phrases. CryptoTrade will
                  never ask for your password or private information via email
                  or phone. Always verify URLs and enable 2FA for maximum
                  security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
