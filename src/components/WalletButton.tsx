"use client";

import { useState, useEffect, useRef } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from './ui/button';
import { Copy, Check, ChevronDown, Wallet, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';

interface WalletButtonProps {
  className?: string;
}

export default function WalletButton({ className = '' }: WalletButtonProps) {
  const { ready, authenticated, logout, login } = usePrivy();
  const { wallets } = useWallets();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get wallet address from Privy wallets
  const walletAddress = wallets[0]?.address || '';

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Compact wallet address display
  const compactAddress = formatAddress(walletAddress);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Copy wallet address
  const copyAddress = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy address');
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    logout();
    setIsOpen(false);
  };

  // Handle change wallet - logout then login to allow connecting a different wallet
  const handleChangeWallet = async () => {
    setIsOpen(false);
    try {
      // Logout first, then immediately open login modal to connect a different wallet
      await logout();
      // Small delay to ensure logout completes, then open login modal
      setTimeout(() => {
        login();
      }, 100);
    } catch (error) {
      console.error('Error changing wallet:', error);
      toast.error('Failed to change wallet. Please try again.');
    }
  };

  if (!ready || !authenticated || !walletAddress) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Wallet Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`text-white border border-white connect-button-bg rounded-[7px] flex items-center justify-between gap-1 sm:gap-2
          min-h-[36px] sm:min-h-[42px] 
          text-xs sm:text-sm 
          px-2 sm:px-4
          font-semibold ${className}`}
      >
        <Wallet className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
        <span className="flex-1 truncate text-[0.65rem] sm:text-sm">{compactAddress}</span>
        <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-gray-900 border border-purple-500/30 rounded-lg shadow-2xl z-50 max-h-[80vh] overflow-auto">
          {/* Wallet Address */}
          <div className="p-2 sm:p-3 border-b border-gray-700">
            <p className="text-gray-400 text-[0.65rem] sm:text-xs mb-1">Connected Wallet</p>
            <div className="flex items-center gap-2 bg-gray-800 px-2 sm:px-3 py-1.5 sm:py-2 rounded">
              <span className="text-white text-xs sm:text-sm font-mono flex-1 truncate">
                {formatAddress(walletAddress)}
              </span>
              <button
                onClick={copyAddress}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                ) : (
                  <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              onClick={handleChangeWallet}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-white hover:bg-gray-800 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
            >
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4" />
              Change Wallet
            </button>
            
            <button
              onClick={handleDisconnect}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-red-400 hover:bg-gray-800 transition-colors flex items-center gap-2 sm:gap-3 text-xs sm:text-sm"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

