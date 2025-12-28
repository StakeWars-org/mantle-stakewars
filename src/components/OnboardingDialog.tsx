"use client";

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useBalance } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Droplet, Sword, Check, Loader2, UserPlus } from 'lucide-react';
import { getCharactersOwnedByUser } from '@/lib/contractUtils';

export default function OnboardingDialog() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const { data: balanceData } = useBalance({
    address: address,
  });
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [checking, setChecking] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Get wallet address from Privy wallets or wagmi account
  const walletAddress = address || wallets[0]?.address || '';

  // Calculate progress - Order: Profile -> Balance -> Character
  const stepsCompleted = (hasProfile ? 1 : 0) + (hasBalance ? 1 : 0) + (hasCharacter ? 1 : 0);
  const totalSteps = 3;
  const isOnboardingComplete = hasProfile && hasBalance && hasCharacter;

  const checkUserStatus = useCallback(async () => {
    if (!walletAddress || !authenticated) {
      setIsOpen(false);
      return;
    }

    // Don't show on task pages (where user is actually doing the tasks)
    // But allow it to show after leaving those pages
    if (pathname === '/faucet' || pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    // Mark that we left a task page (for showing dialog when returning)
    const wasOnTaskPage = sessionStorage.getItem('was-on-task-page');
    if (wasOnTaskPage) {
      sessionStorage.removeItem('was-on-task-page');
      // Force check immediately when returning from task page
    }

    setChecking(true);

    try {
      // Check if user has profile (using Privy user data)
      const userHasProfile = !!(user && user.id);
      setHasProfile(userHasProfile);

      // Check native token balance (MNT) using Privy/wagmi balance data
      let hasTokenBalance = false;
      let balanceValue = 0;
      
      if (balanceData) {
        // balanceData.formatted is already in human-readable format (e.g., "0.5")
        balanceValue = parseFloat(balanceData.formatted) || 0;
        hasTokenBalance = balanceValue > 0;
      } else {
        // Fallback: try to get balance directly using viem if wagmi hook hasn't loaded yet
        try {
          // This will be handled by the useBalance hook, so we just wait for it
          hasTokenBalance = false;
          balanceValue = 0;
        } catch {
          hasTokenBalance = false;
          balanceValue = 0;
        }
      }
      
      // Log the user's Mantle token balance
      console.log(`User's Mantle Token Balance: ${balanceValue} ${balanceData?.symbol || 'MNT'}`);
      
      setHasBalance(hasTokenBalance);
      setTokenBalance(balanceValue);

      // Check if user has characters directly from contract (same as lobby page)
      let userHasCharacter = false;
      try {
        const ownedCharacters = await getCharactersOwnedByUser(walletAddress as `0x${string}`);
        userHasCharacter = ownedCharacters.length > 0;
      } catch (error) {
        console.error("Error fetching characters:", error);
        userHasCharacter = false;
      }
      setHasCharacter(userHasCharacter);

      // Check if onboarding is permanently complete for THIS wallet
      const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
      const onboardingComplete = sessionStorage.getItem(onboardingCompleteKey);
      
      // Mark as complete if user has profile, balance, and character
      if (userHasProfile && hasTokenBalance && userHasCharacter) {
        sessionStorage.setItem(onboardingCompleteKey, 'true');
        setIsOpen(false);
        return;
      }

      // If already marked complete for this wallet, never show again
      if (onboardingComplete) {
        setIsOpen(false);
        return;
      }

      // Show dialog if user is missing profile OR balance OR character
      const shouldShow = !userHasProfile || !hasTokenBalance || !userHasCharacter;
      setIsOpen(shouldShow);

    } catch {
      // Silent error handling
    } finally {
      setChecking(false);
    }
  }, [walletAddress, authenticated, pathname, user, balanceData]);

  // Mark when on task pages
  useEffect(() => {
    if (pathname === '/faucet' || pathname === '/mint-character') {
      sessionStorage.setItem('was-on-task-page', 'true');
    }
  }, [pathname]);

  // Check status immediately when wallet connects
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      // Clean up old generic onboarding key (migration)
      const oldKey = sessionStorage.getItem('onboarding-complete');
      if (oldKey) {
        sessionStorage.removeItem('onboarding-complete');
      }
      
      // Reset onboarding state for new wallet
      setIsOpen(false);
      setHasProfile(false);
      setHasBalance(false);
      setHasCharacter(false);
      
      // Immediate check for new wallet (delay to ensure wallet is fully initialized)
      const timer = setTimeout(() => {
        checkUserStatus();
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setIsOpen(false);
      setHasProfile(false);
      setHasBalance(false);
      setHasCharacter(false);
    }
  }, [walletAddress, ready, authenticated]);

  // Periodic check and page change detection
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      checkUserStatus();
      
      // Re-check every 60 seconds to catch updates (longer interval to avoid disrupting user actions)
      const interval = setInterval(checkUserStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [pathname, user, checkUserStatus, ready, authenticated, walletAddress, balanceData]);

  if (!ready || !authenticated) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Allow temporary closing even if not complete
        setIsOpen(open);
        // Dialog will reappear on next check if not complete
      }}
    >
      <DialogContent 
        className={`bg-gray-900 border-2 max-w-lg overflow-auto max-h-[90vh] ${
          isOnboardingComplete 
            ? 'border-green-500' 
            : 'border-purple-500'
        }`}
        showCloseButton={true}
      >
        <DialogTitle className="text-2xl font-bold text-white text-center mb-2">
          🎮 Getting Started
        </DialogTitle>
        
        {/* Important Notice */}
        <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3 mb-3">
          <p className="text-blue-300 text-xs text-center">
            ⚠️ <span className="font-bold">Important:</span> Create your account first, then get Mantle tokens to perform transactions on the network.
          </p>
        </div>
        
        {!isOnboardingComplete && (
          <p className="text-gray-400 text-xs text-center mb-4">
            You can close this dialog to complete the steps. It will reappear until all steps are done.
          </p>
        )}

        {/* Progress Indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Your Progress</span>
            <span className={`text-lg font-bold ${
              isOnboardingComplete ? 'text-green-400' : 'text-purple-400'
            }`}>
              {stepsCompleted}/{totalSteps}
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isOnboardingComplete 
                  ? 'bg-green-500' 
                  : 'bg-gradient-to-r from-purple-500 to-pink-500'
              }`}
              style={{ width: `${(stepsCompleted / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1: Create Account - ALWAYS FIRST */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasProfile 
              ? 'bg-green-900/20 border-green-500' 
              : 'bg-gray-800 border-purple-500'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasProfile ? 'text-green-400' : 'text-purple-400'
              }`}>
                {hasProfile ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center border-2 border-purple-500">
                    <UserPlus className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 1: Create Account
                  {hasProfile && <span className="text-green-400 text-sm">✓ Complete</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasProfile 
                    ? "Your account is ready!" 
                    : "Your Privy account is connected. Account creation is automatic when you connect your wallet."
                  }
                </p>
                
                {!hasProfile && (
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                    <p className="text-blue-300 text-xs">
                      ✅ Your Privy account is connected! You can proceed to get Mantle tokens.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Get Mantle Tokens */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasBalance 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile
                ? 'bg-gray-800 border-purple-500'
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasBalance ? 'text-green-400' : hasProfile ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasBalance ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasProfile 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <Droplet className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 2: Get Mantle Tokens
                  {hasBalance && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {!hasProfile && <span className="text-gray-500 text-sm">(Create account first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasBalance 
                    ? `You have ${tokenBalance.toFixed(4)} ${balanceData?.symbol || 'MNT'} for transaction fees` 
                    : hasProfile
                      ? "You need MNT tokens to perform transactions on Mantle network"
                      : "Create your account first before getting tokens"
                  }
                </p>
                
                {!hasBalance && hasProfile && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/faucet');
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                  >
                    <Droplet className="w-4 h-4" />
                    Get Free Tokens from Faucet
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Mint Character */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasCharacter 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile && hasBalance 
                ? 'bg-gray-800 border-purple-500' 
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasCharacter ? 'text-green-400' : hasProfile && hasBalance ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasCharacter ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasProfile && hasBalance 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <Sword className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 3: Mint Character
                  {hasCharacter && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {(!hasProfile || !hasBalance) && <span className="text-gray-500 text-sm">(Complete Steps 1 & 2 first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasCharacter 
                    ? "You have a character and can start playing!" 
                    : hasProfile && hasBalance
                      ? "Create your first character to start playing (FREE!)"
                      : !hasProfile
                        ? "Create your account first"
                        : "Get Mantle tokens first"
                  }
                </p>
                
                {!hasCharacter && hasProfile && hasBalance && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/mint-character');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                  >
                    <Sword className="w-4 h-4" />
                    Mint FREE Character
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <Button
            onClick={checkUserStatus}
            disabled={checking}
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
          >
            {checking ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                🔄 Refresh Status
              </>
            )}
          </Button>
          <p className="text-gray-500 text-xs text-center mt-2">
            Complete all 3 steps to start playing!
          </p>
        </div>

        {/* Close hint */}
        {isOnboardingComplete && (
          <p className="text-green-400 text-sm text-center mt-2">
            ✅ All done! Close this to start playing.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

