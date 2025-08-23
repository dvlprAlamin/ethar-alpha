import React, { useState, useEffect } from 'react';
import { Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface DepositAddress {
  _id: string;
  network: string;
  address: string;
  qrCodeUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Deposit: React.FC = () => {
  const [selectedAddress, setSelectedAddress] = useState<DepositAddress | null>(
    null
  );
  const [depositAddresses, setDepositAddresses] = useState<DepositAddress[]>(
    []
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load deposit addresses from API
  const loadDepositAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/deposits/addresses`
      );

      if (!response.ok) {
        throw new Error('Failed to load deposit addresses');
      }

      const data = await response.json();
      setDepositAddresses(data.depositAddresses || []);

      // Auto-select first address if available
      if (data.depositAddresses && data.depositAddresses.length > 0) {
        setSelectedAddress(data.depositAddresses[0]);
      }
    } catch (err) {
      console.error('Error loading deposit addresses:', err);
      setError('Failed to load deposit addresses');
      toast.error('Failed to load deposit addresses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepositAddresses();
  }, []);

  const handleCopyAddress = async () => {
    if (!selectedAddress) {
      toast.error('No address selected');
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedAddress.address);
      toast.success('Address copied to clipboard!');
    } catch {
      toast.error('Failed to copy address');
    }
  };

  const handleAddressSelect = (address: DepositAddress) => {
    setSelectedAddress(address);
    setIsDropdownOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center justify-center px-4 py-4">
          <h1 className="text-xl font-semibold text-white">Scan to Deposit</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* QR Code Section */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <div className="text-center">
            {loading ? (
              <div className="mx-auto w-48 h-48 bg-slate-700 rounded-lg flex items-center justify-center mb-4">
                <div className="text-slate-400">Loading QR Code...</div>
              </div>
            ) : selectedAddress && selectedAddress.qrCodeUrl ? (
              <div className="mx-auto w-48 h-48 mb-4">
                <img
                  src={selectedAddress.qrCodeUrl}
                  alt={`QR Code for ${selectedAddress.network}`}
                  className="w-full h-full object-contain rounded-lg border-2 border-green-500"
                />
              </div>
            ) : (
              <div className="mx-auto w-48 h-48 bg-slate-700 rounded-lg border-2 border-slate-600 flex items-center justify-center mb-4">
                <div className="text-slate-400 text-center">
                  <div className="text-lg mb-2">📱</div>
                  <div>No QR Code Available</div>
                </div>
              </div>
            )}
            <p className="text-slate-400 text-sm">
              {selectedAddress
                ? `Use your crypto wallet app to scan this QR code for ${selectedAddress.network} deposits.`
                : 'Select a network to view the QR code.'}
            </p>
          </div>
        </div>

        {/* Select Network */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Select Network</h3>
          {error ? (
            <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              {error}
            </div>
          ) : loading ? (
            <div className="text-slate-400 text-sm p-3">
              Loading available networks...
            </div>
          ) : depositAddresses.length === 0 ? (
            <div className="text-slate-400 text-sm p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
              No deposit addresses available. Please contact support.
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 flex items-center justify-between text-left hover:bg-slate-700 transition-colors"
              >
                <span className="text-white">
                  {selectedAddress ? selectedAddress.network : 'Choose Network'}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20">
                  {depositAddresses.map((address) => (
                    <button
                      key={address._id}
                      onClick={() => handleAddressSelect(address)}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="text-white">{address.network}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deposit Address */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <h3 className="text-white font-medium mb-3">Deposit Address</h3>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between">
            <div className="flex-1 mr-3">
              <p className="text-white font-mono text-sm break-all">
                {selectedAddress
                  ? selectedAddress.address
                  : 'Select a network to view address'}
              </p>
            </div>
            <button
              onClick={handleCopyAddress}
              disabled={!selectedAddress}
              className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                selectedAddress
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-slate-600 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Warning Message */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <p className="text-yellow-400 text-sm">
            ⚠️ Only send {selectedAddress?.network || 'selected network'} to
            this address. Sending other assets may result in permanent loss.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Deposit;
