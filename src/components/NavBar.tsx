'use client'

import React, { useState, useEffect, useRef } from 'react'
import ConnectButton from './ConnectButton'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import UserProfile from './UserProfile'
import SearchDialog from './SearchDialog'
import { usePrivy, useWallets, useSendTransaction } from '@privy-io/react-auth'
import useOnlineGameStore from '@/store/useOnlineGame'
import { toast } from 'react-toastify'
import { useSound } from '@/contexts/SoundContext'
import { encodeFunctionData } from 'viem'
import { STAKEWARS_ABI } from '@/lib/abi'
import { STAKEWARS_CONTRACT_ADDRESS } from '@/lib/contractaddr'
import { getChakraBalance } from '@/lib/contractUtils'
import {
  Home,
  Gamepad2,
  Sword,
  Trophy,
  DollarSign,
  BarChart3,
  Send,
  Bot,
  Droplet,
  Menu,
  X,
  Wallet,
  LogOut,
  Copy,
  Check,
  Volume2,
  VolumeX,
  LucideIcon
} from 'lucide-react'

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  requiresAuth?: boolean;
}

const navigationLinks: NavLink[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/lobby', label: 'Lobby', icon: Gamepad2, requiresAuth: true },
  { href: '/mint-character', label: 'Mint Character', icon: Sword, requiresAuth: true },
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/wager', label: 'Wager Matches (PvP)', icon: DollarSign, requiresAuth: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: BarChart3 },
  { href: '/transfer', label: 'Transfer CHAKRA', icon: Send, requiresAuth: true },
  { href: '/ai-game', label: 'AI Game (PvAI)', icon: Bot, requiresAuth: true },
];

export default function NavBar() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const path = usePathname();
  const { roomId } = useOnlineGameStore();
  const { isMuted, toggleMute, playButtonClick } = useSound();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chakraBalance, setChakraBalance] = useState<number | null>(null);
  const [isMintingChakra, setIsMintingChakra] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if wallet is connected
  const walletConnected = authenticated && wallets.length > 0;
  const walletAddress = wallets[0]?.address || '';

  // Filter links based on auth status
  const visibleLinks = navigationLinks.filter(link => 
    !link.requiresAuth || walletConnected
  );

  const isActive = (href: string) => {
    if (href === '/') return path === '/';
    return path.startsWith(href);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [path]);

  // Copy wallet address to clipboard
  const copyAddress = async () => {
    if (!walletAddress) return;
    
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      toast.success('Wallet address copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
      toast.error('Failed to copy address');
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 8)}...${addr.slice(-8)}`;
  };

  // Fetch CHAKRA balance
  const fetchChakraBalance = async () => {
    if (!walletAddress) {
      setChakraBalance(null);
      return;
    }

    try {
      const balance = await getChakraBalance(walletAddress as `0x${string}`);
      setChakraBalance(balance);
    } catch (error) {
      console.error("Error fetching CHAKRA balance:", error);
      setChakraBalance(0);
    }
  };

  // Mint starter CHAKRA
  const handleMintChakra = async () => {
    if (!walletAddress || !wallets[0]) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsMintingChakra(true);

    try {
      // Encode the mintChakra function call
      const data = encodeFunctionData({
        abi: STAKEWARS_ABI,
        functionName: "mintChakra",
        args: [walletAddress as `0x${string}`],
      });

      // Send transaction using Privy
      const { hash } = await sendTransaction(
        {
          to: STAKEWARS_CONTRACT_ADDRESS as `0x${string}`,
          data: data,
        },
        {
          address: wallets[0].address,
        }
      );

      toast.success(`Mint transaction sent! Hash: ${hash}`);
      
      // Wait a bit for confirmation, then refresh balance
      setTimeout(async () => {
        await fetchChakraBalance();
        toast.success("CHAKRA minted successfully!");
        setIsMintingChakra(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error minting CHAKRA:", error);
      toast.error(`Failed to mint CHAKRA: ${error?.message || error}`);
      setIsMintingChakra(false);
    }
  };

  // Fetch CHAKRA balance when wallet connects and periodically update it
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      // Fetch immediately
      fetchChakraBalance();
      
      // Set up interval to fetch balance every 10 seconds
      const intervalId = setInterval(() => {
        fetchChakraBalance();
      }, 10000); // Update every 10 seconds
      
      // Cleanup interval on unmount or when dependencies change
      return () => {
        clearInterval(intervalId);
      };
    } else {
      setChakraBalance(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authenticated, walletAddress]);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border-b border-purple-500/20 sticky top-0 z-50">
      <div className="flex justify-between items-center py-4 px-5 lg:px-14">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex-shrink-0">
            <img 
              src="/stake-wars-logo.png" 
              alt="stake wars logo" 
              className="size-[80px] lg:size-[100px] hover:opacity-80 transition-opacity"
            />
          </Link>

          {/* Search */}
          {path !== `/game-play/${roomId}` && (
            <div className="hidden sm:block">
              <SearchDialog />
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* CHAKRA Balance Display - Desktop */}
          {walletConnected && chakraBalance !== null && (
            <div className="hidden md:flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg border border-purple-500/30">
                <img src="/chakra_coin.svg" alt="chakra" className="w-5 h-5" />
                <span className="text-white font-semibold text-sm">
                  {chakraBalance.toFixed(2)} CHK
                </span>
              </div>
              <button
                onClick={async () => {
                  playButtonClick();
                  await handleMintChakra();
                }}
                disabled={isMintingChakra}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                title="Mint starter CHAKRA"
              >
                {isMintingChakra ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span className="hidden lg:inline">Minting...</span>
                  </>
                ) : (
                  <>
                    <Droplet className="w-4 h-4" />
                    <span className="hidden lg:inline">Mint CHAKRA</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mute/Unmute Button */}
          <button
            onClick={toggleMute}
            data-no-sound
            className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
            title={isMuted ? "Unmute sound" : "Mute sound"}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          {/* Mobile Search */}
          {path !== `/game-play/${roomId}` && (
            <div className="sm:hidden">
              <SearchDialog />
            </div>
          )}

          {/* Desktop: User Profile (only when connected) */}
          {walletConnected && (
            <div className="hidden lg:block">
              <UserProfile />
            </div>
          )}

          {/* Desktop: Connect Button (handles both connect and disconnect) */}
          <div className="hidden lg:block">
            <ConnectButton width="w-full" />
          </div>

          {/* Tablet: Connect Button (medium screens) */}
          <div className="hidden sm:block lg:hidden">
            <ConnectButton width="w-full" />
          </div>

          {/* Mobile: Connect Button (small screens) */}
          <div className="block sm:hidden">
            <ConnectButton width="w-fit" />
          </div>

          {/* Hamburger Menu Toggle - All Screen Sizes */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                playButtonClick();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 text-white hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 bg-gray-900/98 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <nav className="py-2">
                  {/* Navigation Links */}
                  {visibleLinks.map((link) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => {
                          playButtonClick();
                          setMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-4 py-3 font-medium transition-all ${
                          isActive(link.href)
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                        {link.label}
                      </Link>
                    );
                  })}
                  
                  {/* Separator */}
                  <div className="border-t border-purple-500/20 my-2"></div>
                  
                  {/* CHAKRA Balance Section - Mobile */}
                  {walletConnected && chakraBalance !== null && (
                    <>
                      <div className="px-4 py-2">
                        <div className="text-gray-400 text-xs mb-2">CHAKRA Balance</div>
                        <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded-lg border border-purple-500/30">
                          <img src="/chakra_coin.svg" alt="chakra" className="w-5 h-5" />
                          <span className="text-white font-semibold text-sm flex-1">
                            {chakraBalance.toFixed(2)} CHK
                          </span>
                        </div>
                      </div>
                      <div className="px-4 py-2">
                        <button
                          onClick={async () => {
                            playButtonClick();
                            await handleMintChakra();
                            setMenuOpen(false);
                          }}
                          disabled={isMintingChakra}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium text-sm"
                        >
                          {isMintingChakra ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Minting...
                            </>
                          ) : (
                            <>
                              <Droplet className="w-4 h-4" />
                              Mint Starter CHAKRA
                            </>
                          )}
                        </button>
                      </div>
                      <div className="border-t border-purple-500/20 my-2"></div>
                    </>
                  )}
                  
                  {/* Wallet Section */}
                  <div className="px-4 py-2">
                    {walletConnected && walletAddress ? (
                      <>
                        {/* User Profile Button - Mobile Only */}
                        <div className="mb-3 lg:hidden">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playButtonClick();
                              setMenuOpen(false); // Close dropdown first
                              setTimeout(() => {
                                setProfileOpen(true); // Open profile after dropdown closes
                              }, 200);
                            }}
                            className="w-full flex items-center justify-center gap-3 bg-gray-800/50 p-3 rounded-lg border border-purple-500/30 cursor-pointer hover:bg-gray-800 transition-colors"
                          >
                            <div className="w-[43px] h-[43px] rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              <img src="/avater.png" alt="avatar" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-semibold text-sm">View Profile</span>
                          </button>
                        </div>

                        {/* Separator - Mobile Only */}
                        <div className="border-t border-purple-500/20 my-2 lg:hidden"></div>
                        
                        {/* Connected Wallet Display */}
                        <div className="mb-2">
                          <div className="text-gray-400 text-xs mb-1">Connected Wallet</div>
                          <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 rounded group">
                            <div className="text-white text-sm font-mono flex-1 truncate">
                              {formatAddress(walletAddress)}
                            </div>
                            <button
                              onClick={() => {
                                playButtonClick();
                                copyAddress();
                              }}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
                              title="Copy address"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                        
                        {/* Disconnect Button */}
                        <button
                          onClick={() => {
                            playButtonClick();
                            logout();
                            setMenuOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect Wallet
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Connect Wallet Button */}
                        <button
                          onClick={() => {
                            playButtonClick();
                            login();
                            setMenuOpen(false);
                          }}
                          className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                        >
                          <Wallet className="w-4 h-4" />
                          Connect Wallet
                        </button>
                      </>
                    )}
                  </div>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controlled UserProfile for Mobile - Outside dropdown */}
      {profileOpen && (
        <div className="lg:hidden">
          <UserProfile isOpen={profileOpen} setIsOpen={setProfileOpen} />
        </div>
      )}
    </div>
  );
}

