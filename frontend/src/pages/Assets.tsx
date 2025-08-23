import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, Download, Upload, History, ArrowUpRight, ArrowDownLeft, Building, ShoppingCart, Briefcase, CreditCard, TrendingUp } from 'lucide-react';
import Card from '../components/Card';

interface Transaction {
  id: string;
  type: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  icon: React.ComponentType<any>;
  isPositive: boolean;
}

const Assets: React.FC = () => {
  const navigate = useNavigate();
  
  // Static data for demonstration
  const totalAssets = 52345.89;
  const availableBalance = 12345.89;
  const lockedBalance = 40000.00;

  const transactions: Transaction[] = [
    {
      id: '1',
      type: 'Bank Transfer (Savings)',
      amount: 1500.00,
      date: '2024-07-28',
      status: 'completed',
      icon: Building,
      isPositive: true
    },
    {
      id: '2',
      type: 'Online Purchase',
      amount: 250.50,
      date: '2024-07-27',
      status: 'completed',
      icon: ShoppingCart,
      isPositive: false
    },
    {
      id: '3',
      type: 'Salary Payout',
      amount: 3200.00,
      date: '2024-07-26',
      status: 'completed',
      icon: Briefcase,
      isPositive: true
    },
    {
      id: '4',
      type: 'ATM Withdrawal',
      amount: 100.00,
      date: '2024-07-25',
      status: 'completed',
      icon: CreditCard,
      isPositive: false
    },
    {
      id: '5',
      type: 'Investment Gains',
      amount: 50.75,
      date: '2024-07-24',
      status: 'completed',
      icon: TrendingUp,
      isPositive: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
    

        {/* Total Assets */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center space-x-2 mb-2">
            <Wallet className="w-5 h-5 text-slate-400" />
            <span className="text-slate-400 text-sm font-medium">Total Assets</span>
          </div>
          <div className="text-4xl font-bold text-white">
            {formatCurrency(totalAssets)}
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Available Balance</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(availableBalance)}
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="text-slate-400 text-sm font-medium mb-2">Locked Balance</div>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(lockedBalance)}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <button 
            onClick={() => navigate('/deposit')}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors duration-200"
          >
            <Download className="w-5 h-5 hidden sm:block" />
            <span className="font-medium">Deposit</span>
          </button>
          <button 
            onClick={() => navigate('/withdraw')}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors duration-200"
          >
            <Upload className="w-5 h-5 hidden sm:block" />
            <span className="font-medium">Withdraw</span>
          </button>
          <button 
            onClick={() => navigate('/history')}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors duration-200"
          >
            <History className="w-5 h-5 hidden sm:block" />
            <span className="font-medium">History</span>
          </button>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
          </div>
          <div className="divide-y divide-slate-700">
            {transactions.map((transaction) => {
              const IconComponent = transaction.icon;
              return (
                <div key={transaction.id} className="p-6 flex items-center justify-between hover:bg-slate-750 transition-colors duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.isPositive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-medium">{transaction.type}</div>
                      <div className="text-slate-400 text-sm">{formatDate(transaction.date)}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      transaction.isPositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.isPositive ? '+' : '-'} {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="inline-block w-2 h-2 bg-green-400 rounded-full"></span>
                      <span className="text-green-400 text-sm font-medium capitalize">{transaction.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assets;