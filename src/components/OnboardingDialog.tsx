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

    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const balanceStorageKey = `onboarding-balance-${walletAddress}`;
    const lastCheckKey = `onboarding-balance-last-check-${walletAddress}`;
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const now = Date.now();
    
    // Don't check if:
    // 1. Not forcing refresh AND
    // 2. Already marked complete AND
    // 3. Last check was less than 5 minutes ago
    if (!forceRefresh && localStorage.getItem(step2CompleteKey) === 'true' && 
        lastCheckTime && (now - parseInt(lastCheckTime)) < 300000) {
      const cachedBalance = localStorage.getItem(balanceStorageKey);
      if (cachedBalance) {
        setHasBalance(true);
        setTokenBalance(parseFloat(cachedBalance) || 0);
        console.log('[Onboarding] Using cached balance (checked recently)');
        return;
      }
    }

    setCheckingBalance(true);

    // Retry logic for balance check - fetch multiple times
    const maxRetries = 3;
    let retryCount = 0;
    let hasTokenBalance = false;
    let balanceValue = 0;
    let currentBalanceData = balanceData;

    while (retryCount < maxRetries) {
      try {
        console.log(`[Balance Check] Attempt ${retryCount + 1}/${maxRetries} - Refreshing balance data...`);
        
        // Always refetch balance data when checking (with retry)
        if (refetchBalance) {
          try {
            const result = await Promise.race([
              refetchBalance(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Balance refetch timeout')), 10000)
              )
            ]);
            currentBalanceData = (result as any)?.data || balanceData;
            console.log(`[Balance Check] Balance data refetched (attempt ${retryCount + 1}):`, currentBalanceData);
          } catch (error) {
            console.error(`[Balance Check] Error refetching balance (attempt ${retryCount + 1}):`, error);
            // Fall back to existing balanceData
            currentBalanceData = balanceData;
          }
        }

        // Parse balance value
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
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Balance Check] ✅ Step 2 complete: Balance ${balanceValue} ${currentBalanceData?.symbol || 'MNT'}`);
            break; // Success, exit retry loop
          } else {
            localStorage.removeItem(step2CompleteKey);
            localStorage.removeItem(balanceStorageKey);
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Balance Check] ⚠️ Step 2 incomplete: Balance is zero`);
            break; // No balance, but check succeeded
          }
        } else {
          // If balanceData is not available, use cached value from localStorage
          const cachedBalance = localStorage.getItem(balanceStorageKey);
          const wasStep2Complete = localStorage.getItem(step2CompleteKey) === 'true';
          
          if (cachedBalance !== null && wasStep2Complete) {
            balanceValue = parseFloat(cachedBalance) || 0;
            hasTokenBalance = balanceValue > 0;
            console.log(`[Balance Check] 📦 Using cached balance ${balanceValue} from localStorage`);
            break; // Use cache, exit retry loop
          } else {
            // No data available, retry if not last attempt
            if (retryCount < maxRetries - 1) {
              console.log(`[Balance Check] ⏳ No balance data, retrying in 1s...`);
              await new Promise(resolve => setTimeout(resolve, 1000));
              retryCount++;
              continue;
            } else {
              hasTokenBalance = false;
              balanceValue = 0;
              console.log(`[Balance Check] ❌ No balance data available after ${maxRetries} attempts`);
              break;
            }
          }
        }
      } catch (error) {
        console.error(`[Balance Check] Error on attempt ${retryCount + 1}:`, error);
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        } else {
          // Final fallback to cache
          const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
          const cachedBalance = localStorage.getItem(balanceStorageKey);
          hasTokenBalance = step2Complete && cachedBalance !== null;
          balanceValue = cachedBalance ? parseFloat(cachedBalance) || 0 : 0;
          console.log(`[Balance Check] 🔄 Using cached value after ${maxRetries} failed attempts`);
          break;
        }
      }
    }
    
    setHasBalance(hasTokenBalance);
    setTokenBalance(balanceValue);
    setCheckingBalance(false);
  }, [walletAddress, authenticated, balanceData, refetchBalance]);

  // Separate function to check characters
  const checkCharacter = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      return;
    }

    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const lastCheckKey = `onboarding-character-last-check-${walletAddress}`;
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const now = Date.now();
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    
    // Don't check if:
    // 1. Not forcing refresh AND
    // 2. Already marked complete AND
    // 3. Last check was less than 5 minutes ago
    if (!forceRefresh && step3Complete && 
        lastCheckTime && (now - parseInt(lastCheckTime)) < 300000) {
      setHasCharacter(true);
      console.log('[Onboarding] Using cached character status (checked recently)');
      return;
    }

    setCheckingCharacter(true);

    try {
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
            localStorage.setItem(step3CompleteKey, 'true');
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Character Check] ✅ Step 3: Found ${ownedCharacters.length} character(s) - marked complete`);
            setHasCharacter(true);
          } else {
            localStorage.removeItem(step3CompleteKey);
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Character Check] ⚠️ Step 3: No characters found - marked incomplete`);
            setHasCharacter(false);
          }
        } catch (error) {
          console.error("[Character Check] Error fetching characters:", error);
          localStorage.setItem(lastCheckKey, now.toString()); // Update timestamp even on error
          
          if (forceRefresh) {
            setHasCharacter(false);
            console.log(`[Character Check] ❌ Force refresh failed - marked incomplete`);
          } else if (step3Complete) {
            setHasCharacter(true);
            console.log(`[Character Check] 🔄 Check failed, but using cached completion status`);
          } else {
            setHasCharacter(false);
            console.log(`[Character Check] ❌ Check failed and no cached completion found`);
          }
        }
      } else {
        setHasCharacter(true);
        console.log(`[Character Check] 📦 Using cached completion status (character exists)`);
      }
    } catch (error) {
      console.error("[Character Check] Error checking character:", error);
      const cachedStep3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      setHasCharacter(cachedStep3Complete);
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

  // Separate useEffect for character check - runs independently with better caching
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const lastCheckKey = `onboarding-character-last-check-${walletAddress}`;
      const lastCheckTime = localStorage.getItem(lastCheckKey);
      const now = Date.now();
      
      // Only check if:
      // 1. Not already marked complete, OR
      // 2. Last check was more than 5 minutes ago (300000ms)
      const shouldCheck = !localStorage.getItem(step3CompleteKey) || 
                         !lastCheckTime || 
                         (now - parseInt(lastCheckTime)) > 300000; // 5 minutes
      
      if (shouldCheck) {
        // Small delay to ensure wallet is fully initialized
        const timer = setTimeout(() => {
          checkCharacter(false);
          localStorage.setItem(lastCheckKey, now.toString());
        }, 1000); // Increased delay for better performance
        return () => clearTimeout(timer);
      } else {
        // Use cached value
        const cachedComplete = localStorage.getItem(step3CompleteKey) === 'true';
        setHasCharacter(cachedComplete);
        console.log('[Onboarding] Using cached character status (checked recently)');
      }
    }
  }, [walletAddress, authenticated, ready, checkCharacter]);

  // Check profile and determine dialog visibility - optimized to reduce re-renders
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      setIsOpen(false);
      setHasProfile(false);
      return;
    }

    // Clean up old generic onboarding key (migration)
    const oldKey = sessionStorage.getItem('onboarding-complete');
    if (oldKey) {
      sessionStorage.removeItem('onboarding-complete');
    }
    
    // Check profile (synchronous)
    const userHasProfile = !!(user && user.id);
    setHasProfile(userHasProfile);
    
    // Get step completion status - use localStorage for consistency
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
    
    // Both balance and character use localStorage now
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    
    // Don't show on task pages
    if (pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    // Use actual state values for more reliable check
    const allComplete = userHasProfile && hasBalance && hasCharacter;
    
    // Determine if dialog should show - only update if state actually changed
    if (allComplete) {
      localStorage.setItem(onboardingCompleteKey, 'true');
      setIsOpen(false);
    } else {
      localStorage.removeItem(onboardingCompleteKey);
      const shouldShow = !userHasProfile || !hasBalance || !hasCharacter;
      setIsOpen(shouldShow);
    }
  }, [walletAddress, ready, authenticated, user, pathname, hasBalance, hasCharacter]);

  // Mark when on task pages and check completion when leaving - optimized
  useEffect(() => {
    // Note: Faucet is now external (hackquest.io), so we only track mint-character
    if (pathname === '/mint-character') {
      sessionStorage.setItem('was-on-task-page', 'true');
    } else {
      // When leaving task pages, check if steps were completed
      const wasOnTaskPage = sessionStorage.getItem('was-on-task-page');
      if (wasOnTaskPage && walletAddress && authenticated) {
        sessionStorage.removeItem('was-on-task-page');
        
        // Only check if not already complete to avoid unnecessary calls
        const step2CompleteKey = `onboarding-step2-${walletAddress}`;
        const step3CompleteKey = `onboarding-step3-${walletAddress}`;
        const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
        const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
        
        // Only force refresh if something might have changed
        if (!step2Complete || !step3Complete) {
          // Increased delay to ensure balance/character data has updated
          const timer = setTimeout(() => {
            if (!step2Complete) checkBalance(true);
            if (!step3Complete) checkCharacter(true);
          }, 3000); // Increased delay for better reliability
          return () => clearTimeout(timer);
        }
      }
    }
  }, [pathname, walletAddress, authenticated, checkBalance, checkCharacter]);

  // Periodic refresh - only runs character check (balance is persisted in localStorage)
  // Reduced frequency to improve performance
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const isComplete = localStorage.getItem(step3CompleteKey) === 'true';
      
      // Only set up periodic check if not complete
      // If complete, no need to keep checking
      if (!isComplete) {
        // Re-check character every 5 minutes (300000ms) instead of 60 seconds
        const interval = setInterval(() => {
          const lastCheckKey = `onboarding-character-last-check-${walletAddress}`;
          const lastCheckTime = localStorage.getItem(lastCheckKey);
          const now = Date.now();
          
          // Only check if last check was more than 5 minutes ago
          if (!lastCheckTime || (now - parseInt(lastCheckTime)) > 300000) {
            checkCharacter(false);
            localStorage.setItem(lastCheckKey, now.toString());
          }
        }, 300000); // Check every 5 minutes
        return () => clearInterval(interval);
      }
    }
  }, [walletAddress, authenticated, ready, checkCharacter, hasCharacter]);

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

