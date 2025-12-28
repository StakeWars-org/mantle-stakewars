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
  const { data: balanceData, refetch: refetchBalance } = useBalance({
    address: address,
  });
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasBalance, setHasBalance] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkingBalance, setCheckingBalance] = useState(false);
  const [checkingCharacter, setCheckingCharacter] = useState(false);
  const [tokenBalance, setTokenBalance] = useState(0);

  // Get wallet address from Privy wallets or wagmi account
  const walletAddress = address || wallets[0]?.address || '';

  // Calculate progress - Order: Profile -> Balance -> Character
  const stepsCompleted = (hasProfile ? 1 : 0) + (hasBalance ? 1 : 0) + (hasCharacter ? 1 : 0);
  const totalSteps = 3;
  const isOnboardingComplete = hasProfile && hasBalance && hasCharacter;

  // Separate function to check balance - only runs on manual refresh
  const checkBalance = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      return;
    }

    setCheckingBalance(true);

    try {
      const step2CompleteKey = `onboarding-step2-${walletAddress}`;
      const balanceStorageKey = `onboarding-balance-${walletAddress}`;
      
      // Always refetch balance data when checking (manual refresh)
      let currentBalanceData = balanceData;
      if (refetchBalance) {
        try {
          console.log('Refreshing balance data...');
          const result = await refetchBalance();
          currentBalanceData = result.data || balanceData;
          console.log('Balance data refetched:', currentBalanceData);
        } catch (error) {
          console.error('Error refetching balance:', error);
          currentBalanceData = balanceData;
        }
      }

      let hasTokenBalance = false;
      let balanceValue = 0;
      
      if (currentBalanceData !== undefined && currentBalanceData !== null) {
        if (currentBalanceData.formatted !== undefined && currentBalanceData.formatted !== null) {
          balanceValue = parseFloat(currentBalanceData.formatted) || 0;
        } else if (currentBalanceData.value !== undefined && currentBalanceData.value !== null) {
          balanceValue = Number(currentBalanceData.value) / 1e18;
        }
        
        hasTokenBalance = balanceValue > 0;
        
        // Store in localStorage (persists across sessions)
        if (hasTokenBalance) {
          localStorage.setItem(step2CompleteKey, 'true');
          localStorage.setItem(balanceStorageKey, balanceValue.toString());
          console.log(`Step 2 complete: Balance ${balanceValue} ${currentBalanceData?.symbol || 'MNT'} (saved to localStorage)`);
        } else {
          localStorage.removeItem(step2CompleteKey);
          localStorage.removeItem(balanceStorageKey);
          console.log(`Step 2 incomplete: Balance is zero`);
        }
      } else {
        // If balanceData is not available, use cached value from localStorage
        const cachedBalance = localStorage.getItem(balanceStorageKey);
        const wasStep2Complete = localStorage.getItem(step2CompleteKey) === 'true';
        
        if (cachedBalance !== null && wasStep2Complete) {
          balanceValue = parseFloat(cachedBalance) || 0;
          hasTokenBalance = balanceValue > 0;
          console.log(`Step 2: Using cached balance ${balanceValue} from localStorage`);
        } else {
          hasTokenBalance = false;
          balanceValue = 0;
          console.log(`Step 2: No balance data available and no cache found`);
        }
      }
      
      setHasBalance(hasTokenBalance);
      setTokenBalance(balanceValue);
    } catch (error) {
      console.error("Error checking balance:", error);
      const step2CompleteKey = `onboarding-step2-${walletAddress}`;
      const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
      setHasBalance(step2Complete);
      // Use cached balance value if available
      const cachedBalance = localStorage.getItem(`onboarding-balance-${walletAddress}`);
      if (cachedBalance) {
        setTokenBalance(parseFloat(cachedBalance) || 0);
      }
    } finally {
      setCheckingBalance(false);
    }
  }, [walletAddress, authenticated, balanceData, refetchBalance]);

  // Separate function to check characters
  const checkCharacter = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      return;
    }

    setCheckingCharacter(true);

    try {
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const step3Complete = sessionStorage.getItem(step3CompleteKey) === 'true';
      
      // Always check if forcing refresh, otherwise check if not already complete
      if (forceRefresh || !step3Complete) {
        try {
          console.log('Fetching characters from contract...');
          const characterCheckPromise = getCharactersOwnedByUser(walletAddress as `0x${string}`);
          const timeoutPromise = new Promise<Awaited<ReturnType<typeof getCharactersOwnedByUser>>>((_, reject) => 
            setTimeout(() => reject(new Error('Character check timeout')), 10000)
          );
          
          const ownedCharacters = await Promise.race([characterCheckPromise, timeoutPromise]);
          const userHasCharacter = ownedCharacters.length > 0;
          
          if (userHasCharacter) {
            sessionStorage.setItem(step3CompleteKey, 'true');
            console.log(`Step 3: Found ${ownedCharacters.length} character(s) - marked complete`);
            setHasCharacter(true);
          } else {
            sessionStorage.removeItem(step3CompleteKey);
            console.log(`Step 3: No characters found - marked incomplete`);
            setHasCharacter(false);
          }
        } catch (error) {
          console.error("Error fetching characters:", error);
          if (forceRefresh) {
            setHasCharacter(false);
            console.log(`Step 3: Force refresh failed - marked incomplete`);
          } else if (step3Complete) {
            setHasCharacter(true);
            console.log(`Step 3: Check failed, but using cached completion status`);
          } else {
            setHasCharacter(false);
            console.log(`Step 3: Check failed and no cached completion found`);
          }
        }
      } else {
        setHasCharacter(true);
        console.log(`Step 3: Using cached completion status (character exists)`);
      }
    } catch (error) {
      console.error("Error checking character:", error);
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const step3Complete = sessionStorage.getItem(step3CompleteKey) === 'true';
      setHasCharacter(step3Complete);
    } finally {
      setCheckingCharacter(false);
    }
  }, [walletAddress, authenticated]);

  // Combined function for refresh button
  const checkUserStatus = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      setIsOpen(false);
      return;
    }

    if (pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    setChecking(true);
    
    // Check profile first (synchronous)
    const userHasProfile = !!(user && user.id);
    setHasProfile(userHasProfile);

    // Run balance and character checks in parallel (independently)
    await Promise.all([
      checkBalance(forceRefresh),
      checkCharacter(forceRefresh)
    ]);

    // After both checks complete, determine if dialog should show
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step2Complete = sessionStorage.getItem(step2CompleteKey) === 'true';
    const step3Complete = sessionStorage.getItem(step3CompleteKey) === 'true';
    
    const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
    
    if (userHasProfile && step2Complete && step3Complete) {
      sessionStorage.setItem(onboardingCompleteKey, 'true');
      setIsOpen(false);
    } else {
      sessionStorage.removeItem(onboardingCompleteKey);
      const shouldShow = !userHasProfile || !step2Complete || !step3Complete;
      setIsOpen(shouldShow);
    }
    
    setChecking(false);
  }, [walletAddress, authenticated, pathname, user, checkBalance, checkCharacter]);

  // Load balance from localStorage on mount (no refetch on page load/change)
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      const step2CompleteKey = `onboarding-step2-${walletAddress}`;
      const balanceStorageKey = `onboarding-balance-${walletAddress}`;
      
      // Load from localStorage (persisted across sessions)
      const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
      const cachedBalance = localStorage.getItem(balanceStorageKey);
      
      if (cachedBalance !== null && step2Complete) {
        const balanceValue = parseFloat(cachedBalance) || 0;
        setHasBalance(balanceValue > 0);
        setTokenBalance(balanceValue);
        console.log(`Loaded balance from localStorage: ${balanceValue}`);
      } else {
        setHasBalance(false);
        setTokenBalance(0);
      }
    }
  }, [walletAddress, authenticated, ready]);

  // Separate useEffect for character check - runs independently
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      // Small delay to ensure wallet is fully initialized
      const timer = setTimeout(() => {
        checkCharacter(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [walletAddress, authenticated, ready, checkCharacter]);

  // Check profile and determine dialog visibility
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      // Clean up old generic onboarding key (migration)
      const oldKey = sessionStorage.getItem('onboarding-complete');
      if (oldKey) {
        sessionStorage.removeItem('onboarding-complete');
      }
      
      // Check profile (synchronous)
      const userHasProfile = !!(user && user.id);
      setHasProfile(userHasProfile);
      
      // Get step completion status
      const step2CompleteKey = `onboarding-step2-${walletAddress}`;
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
      
      // Balance is stored in localStorage, character in sessionStorage
      const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
      const step3Complete = sessionStorage.getItem(step3CompleteKey) === 'true';
      
      // Don't show on task pages
      if (pathname === '/mint-character') {
        setIsOpen(false);
        return;
      }
      
      // Determine if dialog should show
      if (userHasProfile && step2Complete && step3Complete) {
        sessionStorage.setItem(onboardingCompleteKey, 'true');
        setIsOpen(false);
      } else {
        sessionStorage.removeItem(onboardingCompleteKey);
        const shouldShow = !userHasProfile || !step2Complete || !step3Complete;
        setIsOpen(shouldShow);
      }
    } else {
      setIsOpen(false);
      setHasProfile(false);
    }
  }, [walletAddress, ready, authenticated, user, pathname, hasBalance, hasCharacter]);

  // Mark when on task pages and check completion when leaving
  useEffect(() => {
    // Note: Faucet is now external (hackquest.io), so we only track mint-character
    if (pathname === '/mint-character') {
      sessionStorage.setItem('was-on-task-page', 'true');
    } else {
      // When leaving task pages, check if steps were completed
      const wasOnTaskPage = sessionStorage.getItem('was-on-task-page');
      if (wasOnTaskPage && walletAddress && authenticated) {
        sessionStorage.removeItem('was-on-task-page');
        // Small delay to ensure balance/character data has updated, then check both independently
        setTimeout(() => {
          checkBalance(true);
          checkCharacter(true);
        }, 2000);
      }
    }
  }, [pathname, walletAddress, authenticated, checkBalance, checkCharacter]);

  // Periodic refresh - only runs character check (balance is persisted in localStorage)
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      // Re-check character every 60 seconds (balance is persisted, no need to refetch)
      const interval = setInterval(() => {
        checkCharacter(false);
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [walletAddress, authenticated, ready, checkCharacter]);

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
                      window.open('https://www.hackquest.io/faucets/5003', '_blank');
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
            onClick={() => checkUserStatus(true)}
            disabled={checking || checkingBalance || checkingCharacter}
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

