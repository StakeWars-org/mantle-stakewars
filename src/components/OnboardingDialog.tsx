"use client";

import { useEffect, useState, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Droplet, Sword, Check, Loader2, UserPlus, Coins, ChevronLeft, ChevronRight, Copy } from 'lucide-react';
import { toast } from 'react-toastify';
import { getCharactersOwnedByUser, getChakraBalance } from '@/lib/contractUtils';

// Faucet tutorial carousel images and captions (only steps 1-3 have images)
const faucetTutorialSteps = [
  {
    image: '/faucet-tutorial/step1.png',
    caption: 'Step 1: Visit the Mantle Faucet website and signin/signup'
  },
  {
    image: '/faucet-tutorial/step2.png',
    caption: 'Step 2: Go to the faucet page'
  },
  {
    image: '/faucet-tutorial/step3.png',
    caption: 'Step 3: Copy and paste your address in address input field'
  }
];

export default function OnboardingDialog() {
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const { address } = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);
  const [hasFaucetDone, setHasFaucetDone] = useState(false);
  const [hasChakra, setHasChakra] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkingChakra, setCheckingChakra] = useState(false);
  const [checkingCharacter, setCheckingCharacter] = useState(false);
  const [chakraBalance, setChakraBalance] = useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Get wallet address from Privy wallets or wagmi account
  const walletAddress = address || wallets[0]?.address || '';

  // Calculate progress - Order: Profile -> Faucet Done -> Chakra -> Character
  const stepsCompleted = (hasProfile ? 1 : 0) + (hasFaucetDone ? 1 : 0) + (hasChakra ? 1 : 0) + (hasCharacter ? 1 : 0);
  const totalSteps = 4;
  const isOnboardingComplete = hasProfile && hasFaucetDone && hasChakra && hasCharacter;

  // Mark step 2 (Faucet) as done manually
  const markFaucetDone = useCallback(() => {
    if (!walletAddress) return;
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    localStorage.setItem(step2CompleteKey, 'true');
    setHasFaucetDone(true);
    console.log('[Onboarding] Step 2 (Faucet) marked as complete');
  }, [walletAddress]);

  // Check Chakra balance (Step 3)
  const checkChakra = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      return;
    }

    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const chakraStorageKey = `onboarding-chakra-${walletAddress}`;
    const lastCheckKey = `onboarding-chakra-last-check-${walletAddress}`;
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const now = Date.now();
    
    // Don't check if:
    // 1. Not forcing refresh AND
    // 2. Already marked complete AND
    // 3. Last check was less than 5 minutes ago
    if (!forceRefresh && localStorage.getItem(step3CompleteKey) === 'true' && 
        lastCheckTime && (now - parseInt(lastCheckTime)) < 300000) {
      const cachedChakra = localStorage.getItem(chakraStorageKey);
      if (cachedChakra) {
        setHasChakra(true);
        setChakraBalance(parseFloat(cachedChakra) || 0);
        console.log('[Onboarding] Using cached Chakra balance (checked recently)');
        return;
      }
    }

    setCheckingChakra(true);

    // Retry logic for Chakra check - fetch multiple times
    const maxRetries = 3;
    let retryCount = 0;
    let hasChakraBalance = false;
    let chakraValue = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`[Chakra Check] Attempt ${retryCount + 1}/${maxRetries} - Fetching Chakra balance...`);
        
        const chakraCheckPromise = getChakraBalance(walletAddress as `0x${string}`);
        const timeoutPromise = new Promise<number>((_, reject) => 
          setTimeout(() => reject(new Error('Chakra check timeout')), 15000)
        );
        
        chakraValue = await Promise.race([chakraCheckPromise, timeoutPromise]);
        hasChakraBalance = chakraValue > 0;
        
        // Store in localStorage
        if (hasChakraBalance) {
          localStorage.setItem(step3CompleteKey, 'true');
          localStorage.setItem(chakraStorageKey, chakraValue.toString());
          localStorage.setItem(lastCheckKey, now.toString());
          console.log(`[Chakra Check] ✅ Step 3 complete: Chakra balance ${chakraValue}`);
          break; // Success, exit retry loop
        } else {
          localStorage.removeItem(step3CompleteKey);
          localStorage.removeItem(chakraStorageKey);
          localStorage.setItem(lastCheckKey, now.toString());
          console.log(`[Chakra Check] ⚠️ Step 3 incomplete: Chakra balance is zero`);
          break; // No Chakra, but check succeeded
        }
      } catch (error) {
        console.error(`[Chakra Check] Error on attempt ${retryCount + 1}:`, error);
        if (retryCount < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
          continue;
        } else {
          // Final fallback to cache
          const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
          const cachedChakra = localStorage.getItem(chakraStorageKey);
          hasChakraBalance = step3Complete && cachedChakra !== null;
          chakraValue = cachedChakra ? parseFloat(cachedChakra) || 0 : 0;
          console.log(`[Chakra Check] 🔄 Using cached value after ${maxRetries} failed attempts`);
          break;
        }
      }
    }
    
    setHasChakra(hasChakraBalance);
    setChakraBalance(chakraValue);
    setCheckingChakra(false);
  }, [walletAddress, authenticated]);

  // Check character ownership (Step 4)
  const checkCharacter = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      return;
    }

    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const lastCheckKey = `onboarding-character-last-check-${walletAddress}`;
    const lastCheckTime = localStorage.getItem(lastCheckKey);
    const now = Date.now();
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    
    // Don't check if:
    // 1. Not forcing refresh AND
    // 2. Already marked complete AND
    // 3. Last check was less than 5 minutes ago
    if (!forceRefresh && step4Complete && 
        lastCheckTime && (now - parseInt(lastCheckTime)) < 300000) {
      setHasCharacter(true);
      console.log('[Onboarding] Using cached character status (checked recently)');
      return;
    }

    setCheckingCharacter(true);

    try {
      if (forceRefresh || !step4Complete) {
        try {
          console.log('Fetching characters from contract...');
          const characterCheckPromise = getCharactersOwnedByUser(walletAddress as `0x${string}`);
          const timeoutPromise = new Promise<Awaited<ReturnType<typeof getCharactersOwnedByUser>>>((_, reject) => 
            setTimeout(() => reject(new Error('Character check timeout')), 15000)
          );
          
          const ownedCharacters = await Promise.race([characterCheckPromise, timeoutPromise]);
          const userHasCharacter = ownedCharacters.length > 0;
          
          if (userHasCharacter) {
            localStorage.setItem(step4CompleteKey, 'true');
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Character Check] ✅ Step 4: Found ${ownedCharacters.length} character(s) - marked complete`);
            setHasCharacter(true);
          } else {
            localStorage.removeItem(step4CompleteKey);
            localStorage.setItem(lastCheckKey, now.toString());
            console.log(`[Character Check] ⚠️ Step 4: No characters found - marked incomplete`);
            setHasCharacter(false);
          }
        } catch (error) {
          console.error("[Character Check] Error fetching characters:", error);
          localStorage.setItem(lastCheckKey, now.toString());
          
          if (forceRefresh) {
            setHasCharacter(false);
            console.log(`[Character Check] ❌ Force refresh failed - marked incomplete`);
          } else if (step4Complete) {
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
      const cachedStep4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      setHasCharacter(cachedStep4Complete);
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

    // Run Chakra and character checks in parallel
    await Promise.all([
      checkChakra(forceRefresh),
      checkCharacter(forceRefresh)
    ]);

    // After checks complete, determine if dialog should show
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    
    const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
    
    if (userHasProfile && step2Complete && step3Complete && step4Complete) {
      localStorage.setItem(onboardingCompleteKey, 'true');
      setIsOpen(false);
    } else {
      localStorage.removeItem(onboardingCompleteKey);
      const shouldShow = !userHasProfile || !step2Complete || !step3Complete || !step4Complete;
      setIsOpen(shouldShow);
    }
    
    setChecking(false);
  }, [walletAddress, authenticated, pathname, user, checkChakra, checkCharacter]);

  // Load from localStorage when wallet address changes - this ensures each address is checked separately
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      // Reset all state when no wallet is connected
      setHasFaucetDone(false);
      setHasChakra(false);
      setHasCharacter(false);
      setChakraBalance(0);
      return;
    }

    console.log(`[Onboarding] Loading status for address: ${walletAddress}`);

    // Load step 2 (Faucet) completion for THIS specific address
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    setHasFaucetDone(step2Complete);
    console.log(`[Onboarding] Step 2 (Faucet) for ${walletAddress}: ${step2Complete ? 'Complete' : 'Incomplete'}`);

    // Load step 3 (Chakra) from localStorage for THIS specific address
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const chakraStorageKey = `onboarding-chakra-${walletAddress}`;
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const cachedChakra = localStorage.getItem(chakraStorageKey);
    
    if (cachedChakra !== null && step3Complete) {
      const chakraValue = parseFloat(cachedChakra) || 0;
      setHasChakra(chakraValue > 0);
      setChakraBalance(chakraValue);
      console.log(`[Onboarding] Step 3 (Chakra) for ${walletAddress}: ${chakraValue} Chakra`);
    } else {
      setHasChakra(false);
      setChakraBalance(0);
      console.log(`[Onboarding] Step 3 (Chakra) for ${walletAddress}: Not complete`);
    }

    // Load step 4 (Character) from localStorage for THIS specific address
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    setHasCharacter(step4Complete);
    console.log(`[Onboarding] Step 4 (Character) for ${walletAddress}: ${step4Complete ? 'Complete' : 'Incomplete'}`);
  }, [walletAddress, authenticated, ready]);

  // Auto-check Chakra and Character if not in localStorage for THIS specific address
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      return;
    }

    // Always check for the current address - don't assume completion
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    
    console.log(`[Onboarding] Auto-checking for address: ${walletAddress}`);
    console.log(`[Onboarding] Step 3 cached: ${step3Complete}, Step 4 cached: ${step4Complete}`);
    
    // Auto-check if not complete for THIS address
    if (!step3Complete) {
      const timer = setTimeout(() => {
        console.log(`[Onboarding] Auto-checking Chakra for ${walletAddress}`);
        checkChakra(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
    
    if (!step4Complete) {
      const timer = setTimeout(() => {
        console.log(`[Onboarding] Auto-checking Character for ${walletAddress}`);
        checkCharacter(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [walletAddress, authenticated, ready, checkChakra, checkCharacter]);

  // Check profile and determine dialog visibility - checks for CURRENT connected address
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      setIsOpen(false);
      setHasProfile(false);
      return;
    }

    // Check profile (synchronous) - this is per user, not per address
    const userHasProfile = !!(user && user.id);
    setHasProfile(userHasProfile);
    
    // Get step completion status from localStorage for THIS specific address
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
    
    // Always read from localStorage to ensure we're checking the correct address
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    
    console.log(`[Onboarding] Checking completion for address: ${walletAddress}`);
    console.log(`[Onboarding] Steps: Profile=${userHasProfile}, Faucet=${step2Complete}, Chakra=${step3Complete}, Character=${step4Complete}`);
    
    // Don't show on task pages
    if (pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    // Use localStorage values directly (not state) to ensure we check the correct address
    const allComplete = userHasProfile && step2Complete && step3Complete && step4Complete;
    
    // Determine if dialog should show for THIS address
    if (allComplete) {
      localStorage.setItem(onboardingCompleteKey, 'true');
      setIsOpen(false);
      console.log(`[Onboarding] All steps complete for ${walletAddress} - hiding dialog`);
    } else {
      localStorage.removeItem(onboardingCompleteKey);
      const shouldShow = !userHasProfile || !step2Complete || !step3Complete || !step4Complete;
      setIsOpen(shouldShow);
      console.log(`[Onboarding] Steps incomplete for ${walletAddress} - ${shouldShow ? 'showing' : 'hiding'} dialog`);
    }
  }, [walletAddress, ready, authenticated, user, pathname, hasFaucetDone, hasChakra, hasCharacter]);

  // Mark when on task pages and check completion when leaving
  useEffect(() => {
    if (pathname === '/mint-character') {
      sessionStorage.setItem('was-on-task-page', 'true');
    } else {
      const wasOnTaskPage = sessionStorage.getItem('was-on-task-page');
      if (wasOnTaskPage && walletAddress && authenticated) {
        sessionStorage.removeItem('was-on-task-page');
        
        const step3CompleteKey = `onboarding-step3-${walletAddress}`;
        const step4CompleteKey = `onboarding-step4-${walletAddress}`;
        const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
        const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
        
        if (!step3Complete || !step4Complete) {
          const timer = setTimeout(() => {
            if (!step3Complete) checkChakra(true);
            if (!step4Complete) checkCharacter(true);
          }, 3000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [pathname, walletAddress, authenticated, checkChakra, checkCharacter]);

  // Periodic refresh for Chakra and Character
  useEffect(() => {
    if (ready && authenticated && walletAddress) {
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const step4CompleteKey = `onboarding-step4-${walletAddress}`;
      const isChakraComplete = localStorage.getItem(step3CompleteKey) === 'true';
      const isCharacterComplete = localStorage.getItem(step4CompleteKey) === 'true';
      
      if (!isChakraComplete || !isCharacterComplete) {
        const interval = setInterval(() => {
          const lastCheckKey3 = `onboarding-chakra-last-check-${walletAddress}`;
          const lastCheckKey4 = `onboarding-character-last-check-${walletAddress}`;
          const lastCheckTime3 = localStorage.getItem(lastCheckKey3);
          const lastCheckTime4 = localStorage.getItem(lastCheckKey4);
          const now = Date.now();
          
          if (!isChakraComplete && (!lastCheckTime3 || (now - parseInt(lastCheckTime3)) > 300000)) {
            checkChakra(false);
            localStorage.setItem(lastCheckKey3, now.toString());
          }
          
          if (!isCharacterComplete && (!lastCheckTime4 || (now - parseInt(lastCheckTime4)) > 300000)) {
            checkCharacter(false);
            localStorage.setItem(lastCheckKey4, now.toString());
          }
        }, 300000); // Check every 5 minutes
        return () => clearInterval(interval);
      }
    }
  }, [walletAddress, authenticated, ready, checkChakra, checkCharacter]);

  // Check every 10 seconds and show dialog if onboarding is not complete
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      return;
    }

    // Don't show on task pages
    if (pathname === '/mint-character') {
      return;
    }

    const checkAndShowDialog = () => {
      // Check profile
      const userHasProfile = !!(user && user.id);
      
      // Get step completion status from localStorage for THIS specific address
      const step2CompleteKey = `onboarding-step2-${walletAddress}`;
      const step3CompleteKey = `onboarding-step3-${walletAddress}`;
      const step4CompleteKey = `onboarding-step4-${walletAddress}`;
      
      const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
      const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      
      // Check if all steps are complete
      const allComplete = userHasProfile && step2Complete && step3Complete && step4Complete;
      
      // Show dialog if not complete
      if (!allComplete) {
        setIsOpen(true);
      }
    };

    // Check immediately
    checkAndShowDialog();

    // Then check every 10 seconds
    const interval = setInterval(checkAndShowDialog, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [walletAddress, ready, authenticated, user, pathname]);

  // Copy wallet address to clipboard
  const copyAddress = useCallback(async () => {
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
  }, [walletAddress]);

  // Carousel navigation
  const nextCarouselSlide = useCallback(() => {
    setCurrentCarouselIndex((prev) => (prev + 1) % faucetTutorialSteps.length);
  }, []);

  const prevCarouselSlide = useCallback(() => {
    setCurrentCarouselIndex((prev) => (prev - 1 + faucetTutorialSteps.length) % faucetTutorialSteps.length);
  }, []);

  if (!ready || !authenticated) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        setIsOpen(open);
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
            ⚠️ <span className="font-bold">Important:</span> Complete all steps to start playing!
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
          {/* Step 1: Create Account */}
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

          {/* Step 2: Get Faucet */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasFaucetDone 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile
                ? 'bg-gray-800 border-purple-500'
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasFaucetDone ? 'text-green-400' : hasProfile ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasFaucetDone ? (
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
                  Step 2: Get Mantle Tokens from Faucet
                  {hasFaucetDone && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {!hasProfile && <span className="text-gray-500 text-sm">(Create account first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasFaucetDone 
                    ? "You've completed the faucet tutorial!" 
                    : hasProfile
                      ? "Follow the tutorial below to get free Mantle tokens from the faucet"
                      : "Create your account first before getting tokens"
                  }
                </p>
                
                {!hasFaucetDone && hasProfile && (
                  <div className="space-y-3">
                    {/* Carousel */}
                    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                      <div className="relative">
                        {/* Image */}
                        <div className="aspect-video bg-gray-800 rounded-lg mb-3 flex items-center justify-center overflow-hidden relative">
                          <Image 
                            key={currentCarouselIndex}
                            src={faucetTutorialSteps[currentCarouselIndex].image} 
                            alt={faucetTutorialSteps[currentCarouselIndex].caption}
                            fill
                            className="object-contain"
                            priority
                          />
                        </div>
                        
                        {/* Caption */}
                        <p className="text-white text-sm text-center mb-3">
                          {faucetTutorialSteps[currentCarouselIndex].caption}
                        </p>
                        
                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                          <Button
                            onClick={prevCarouselSlide}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            Prev
                          </Button>
                          
                          <span className="text-gray-400 text-xs">
                            {currentCarouselIndex + 1} / {faucetTutorialSteps.length}
                          </span>
                          
                          <Button
                            onClick={nextCarouselSlide}
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1"
                          >
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Copy Address Section */}
                    <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                      <p className="text-gray-300 text-xs mb-2">Your Wallet Address:</p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={walletAddress}
                          readOnly
                          className="flex-1 bg-gray-900 text-white text-xs p-2 rounded border border-gray-700 font-mono"
                        />
                        <Button
                          onClick={copyAddress}
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                          title="Copy address"
                        >
                          {copied ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Step 4 instruction (no image) */}
                    <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                      <p className="text-blue-300 text-xs text-center">
                        Step 4: Click on Done button below to complete the step
                      </p>
                    </div>
                    
                    {/* Go to Faucet Button */}
                    <Button
                      onClick={() => {
                        window.open('https://www.hackquest.io/faucets/5003', '_blank');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Droplet className="w-4 h-4" />
                      Go to Faucet
                    </Button>
                    
                    {/* Done Button */}
                    <Button
                      onClick={markFaucetDone}
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Done - I've Got the Tokens
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Mint Chakra */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasChakra 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile && hasFaucetDone 
                ? 'bg-gray-800 border-purple-500' 
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasChakra ? 'text-green-400' : hasProfile && hasFaucetDone ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasChakra ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasProfile && hasFaucetDone 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <Coins className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 3: Mint Chakra
                  {hasChakra && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {(!hasProfile || !hasFaucetDone) && <span className="text-gray-500 text-sm">(Complete Steps 1 & 2 first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasChakra 
                    ? `You have ${chakraBalance.toFixed(2)} Chakra!` 
                    : hasProfile && hasFaucetDone
                      ? "Mint your starter Chakra to use in battles (FREE!)"
                      : !hasProfile
                        ? "Create your account first"
                        : "Get Mantle tokens first"
                  }
                </p>
                
                {!hasChakra && hasProfile && hasFaucetDone && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                    disabled={checkingChakra}
                  >
                    {checkingChakra ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4" />
                        Mint Chakra (Check NavBar)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Step 4: Mint Character */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            hasCharacter 
              ? 'bg-green-900/20 border-green-500' 
              : hasProfile && hasFaucetDone && hasChakra 
                ? 'bg-gray-800 border-purple-500' 
                : 'bg-gray-800 border-gray-700 opacity-50'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 mt-1 ${
                hasCharacter ? 'text-green-400' : hasProfile && hasFaucetDone && hasChakra ? 'text-purple-400' : 'text-gray-600'
              }`}>
                {hasCharacter ? (
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    hasProfile && hasFaucetDone && hasChakra 
                      ? 'bg-purple-500/30 border-purple-500' 
                      : 'bg-gray-700 border-gray-600'
                  }`}>
                    <Sword className="w-5 h-5" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                  Step 4: Mint Character
                  {hasCharacter && <span className="text-green-400 text-sm">✓ Complete</span>}
                  {(!hasProfile || !hasFaucetDone || !hasChakra) && <span className="text-gray-500 text-sm">(Complete Steps 1-3 first)</span>}
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  {hasCharacter 
                    ? "You have a character and can start playing!" 
                    : hasProfile && hasFaucetDone && hasChakra
                      ? "Create your first character to start playing (FREE!)"
                      : !hasProfile
                        ? "Create your account first"
                        : !hasFaucetDone
                          ? "Get Mantle tokens first"
                          : "Mint Chakra first"
                  }
                </p>
                
                {!hasCharacter && hasProfile && hasFaucetDone && hasChakra && (
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      router.push('/mint-character');
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2"
                    disabled={checkingCharacter}
                  >
                    {checkingCharacter ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <Sword className="w-4 h-4" />
                        Mint FREE Character
                      </>
                    )}
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
            disabled={checking || checkingChakra || checkingCharacter}
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
            Complete all 4 steps to start playing!
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
