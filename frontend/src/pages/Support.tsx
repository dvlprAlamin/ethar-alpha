import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
} from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Support: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const [activeSection, setActiveSection] = useState<string>('faq');

  // Mock FAQ data
  const filteredFAQs: FAQItem[] = [
    {
      id: '1',
      question: 'How do I deposit cryptocurrency?',
      answer:
        'To deposit cryptocurrency, go to the Deposit page, select your preferred network and currency, then send your crypto to the provided address. Always double-check the network and address before sending.',
      category: 'deposits',
    },
    {
      id: '2',
      question: 'What are the trading fees?',
      answer:
        'Our trading fees are competitive and vary based on your trading volume. Maker fees start at 0.1% and taker fees start at 0.15%. Higher volume traders enjoy reduced fees.',
      category: 'trading',
    },
    {
      id: '3',
      question: 'How long do withdrawals take?',
      answer:
        'Withdrawal processing times depend on the cryptocurrency and network congestion. Most withdrawals are processed within 30 minutes to 2 hours.',
      category: 'withdrawals',
    },
    {
      id: '4',
      question: 'How do I enable two-factor authentication?',
      answer:
        'Go to Security Settings in your account, click on "Enable 2FA", scan the QR code with your authenticator app, and enter the verification code to complete setup.',
      category: 'security',
    },
    {
      id: '5',
      question: 'What should I do if I forgot my password?',
      answer:
        'Click on "Forgot Password" on the login page, enter your email address, and follow the instructions in the reset email we send you.',
      category: 'account',
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-semibold text-white">Support</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {[
            {
              id: 'faq',
              label: 'FAQ',
              icon: <HelpCircle className="w-4 h-4" />,
            },
            {
              id: 'contact',
              label: 'Contact',
              icon: <MessageCircle className="w-4 h-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
                activeSection === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        {activeSection === 'faq' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            {filteredFAQs.map((faq) => (
              <div
                key={faq.id}
                className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(faq.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-900/70 transition-colors"
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  {expandedFAQ === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                {expandedFAQ === faq.id && (
                  <div className="px-6 pb-4 text-slate-300 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Contact Information
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:bg-slate-700 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Mail className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Email Support
                  </h3>
                </div>
                <p className="text-slate-300 mb-2">Get help via email</p>
                <p className="text-blue-400 font-medium">support@ethar.com</p>
                <p className="text-sm text-slate-400 mt-2">
                  Response time: 24-48 hours
                </p>
              </div>

              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:bg-slate-700 transition-colors">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Phone className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    Phone Support
                  </h3>
                </div>
                <p className="text-slate-300 mb-2">Call our support line</p>
                <p className="text-purple-400 font-medium">+1 (555) 123-4567</p>
                <p className="text-sm text-slate-400 mt-2">
                  Mon-Fri: 9AM-6PM EST
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
