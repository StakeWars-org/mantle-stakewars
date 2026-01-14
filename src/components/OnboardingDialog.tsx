"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
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

  // Refs to prevent duplicate calls and track last successful values
  const chakraCheckInProgress = useRef(false);
  const characterCheckInProgress = useRef(false);
  const lastSuccessfulChakraBalance = useRef<number | null>(null);
  const consecutiveChakraFailures = useRef(0);
  const consecutiveCharacterFailures = useRef(0);

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

  // Check Chakra balance (Step 3) - IMPROVED with retry logic and last known good value
  const checkChakra = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      setHasChakra(false);
      setChakraBalance(0);
      return;
    }

    // Prevent duplicate simultaneous calls
    if (chakraCheckInProgress.current && !forceRefresh) {
      console.log('[Chakra Check] Already in progress, skipping...');
      return;
    }

    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const chakraStorageKey = `onboarding-chakra-${walletAddress}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedStep3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      const cachedChakra = localStorage.getItem(chakraStorageKey);
      
      if (cachedStep3Complete && cachedChakra) {
        const chakraValue = parseFloat(cachedChakra) || 0;
        setHasChakra(chakraValue > 0);
        setChakraBalance(chakraValue);
        lastSuccessfulChakraBalance.current = chakraValue;
        console.log('[Chakra Check] Using cached balance:', chakraValue);
        return;
      }
    }

    chakraCheckInProgress.current = true;
    setCheckingChakra(true);

    try {
      console.log('[Chakra Check] Fetching balance from contract...');
      const balance = await getChakraBalance(walletAddress as `0x${string}`);
      
      // Reset failure counter on success
      consecutiveChakraFailures.current = 0;
      
      // Update state
      const hasChakraBalance = balance > 0;
      setHasChakra(hasChakraBalance);
      setChakraBalance(balance);
      lastSuccessfulChakraBalance.current = balance;
      
      // Update localStorage
      if (hasChakraBalance) {
        localStorage.setItem(step3CompleteKey, 'true');
        localStorage.setItem(chakraStorageKey, balance.toString());
        console.log(`[Chakra Check] ✅ Balance: ${balance} - Step 3 complete`);
      } else {
        // Only remove if balance is truly 0 (not a failed call)
        localStorage.removeItem(step3CompleteKey);
        localStorage.removeItem(chakraStorageKey);
        console.log(`[Chakra Check] ⚠️ Balance: 0 - Step 3 incomplete`);
      }
    } catch (error) {
      consecutiveChakraFailures.current++;
      console.error("[Chakra Check] Error fetching balance:", error);
      console.log(`[Chakra Check] Consecutive failures: ${consecutiveChakraFailures.current}`);
      
      // On error, use cache or last known good value
      const cachedStep3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      const cachedChakra = localStorage.getItem(chakraStorageKey);
      
      // If we've had multiple failures but previously had a balance, trust the cache
      if (consecutiveChakraFailures.current < 3) {
        if (cachedChakra) {
          const chakraValue = parseFloat(cachedChakra) || 0;
          setHasChakra(cachedStep3Complete && chakraValue > 0);
          setChakraBalance(chakraValue);
          console.log(`[Chakra Check] 🔄 Using cached value after error: ${chakraValue}`);
        } else if (lastSuccessfulChakraBalance.current !== null) {
          // Use last known good value
          setHasChakra(lastSuccessfulChakraBalance.current > 0);
          setChakraBalance(lastSuccessfulChakraBalance.current);
          console.log(`[Chakra Check] 🔄 Using last known value after error: ${lastSuccessfulChakraBalance.current}`);
        }
      } else {
        // After 3 consecutive failures, mark as incomplete
        setHasChakra(false);
        setChakraBalance(0);
        console.log(`[Chakra Check] ❌ Multiple failures - marking incomplete`);
      }
    } finally {
      setCheckingChakra(false);
      chakraCheckInProgress.current = false;
    }
  }, [walletAddress, authenticated]);

  // Check character ownership (Step 4) - IMPROVED with retry logic
  const checkCharacter = useCallback(async (forceRefresh = false) => {
    if (!walletAddress || !authenticated) {
      setHasCharacter(false);
      return;
    }

    // Prevent duplicate simultaneous calls
    if (characterCheckInProgress.current && !forceRefresh) {
      console.log('[Character Check] Already in progress, skipping...');
      return;
    }

    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedStep4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      
      if (cachedStep4Complete) {
        setHasCharacter(true);
        console.log('[Character Check] Using cached status: has character');
        return;
      }
    }

    characterCheckInProgress.current = true;
    setCheckingCharacter(true);

    try {
      console.log('[Character Check] Fetching characters from contract...');
      const ownedCharacters = await getCharactersOwnedByUser(walletAddress as `0x${string}`);
      const userHasCharacter = ownedCharacters.length > 0;
      
      // Reset failure counter on success
      consecutiveCharacterFailures.current = 0;
      
      // Update state and localStorage
      setHasCharacter(userHasCharacter);
      
      if (userHasCharacter) {
        localStorage.setItem(step4CompleteKey, 'true');
        console.log(`[Character Check] ✅ Found ${ownedCharacters.length} character(s) - Step 4 complete`);
      } else {
        // Only remove if truly no characters (not a failed call)
        localStorage.removeItem(step4CompleteKey);
        console.log(`[Character Check] ⚠️ No characters found - Step 4 incomplete`);
      }
    } catch (error) {
      consecutiveCharacterFailures.current++;
      console.error("[Character Check] Error fetching characters:", error);
      console.log(`[Character Check] Consecutive failures: ${consecutiveCharacterFailures.current}`);
      
      // On error, use cache if we haven't had too many failures
      const cachedStep4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      
      if (consecutiveCharacterFailures.current < 3) {
        setHasCharacter(cachedStep4Complete);
        console.log(`[Character Check] 🔄 Using cached value after error: ${cachedStep4Complete}`);
      } else {
        // After 3 consecutive failures, mark as incomplete
        setHasCharacter(false);
        console.log(`[Character Check] ❌ Multiple failures - marking incomplete`);
      }
    } finally {
      setCheckingCharacter(false);
      characterCheckInProgress.current = false;
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

  // Load from localStorage when wallet address changes
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      setHasFaucetDone(false);
      setHasChakra(false);
      setHasCharacter(false);
      setChakraBalance(0);
      return;
    }

    console.log(`[Onboarding] Loading status for address: ${walletAddress}`);

    // Load step 2 (Faucet) completion
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    setHasFaucetDone(step2Complete);

    // Load step 3 (Chakra) from localStorage
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const chakraStorageKey = `onboarding-chakra-${walletAddress}`;
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const cachedChakra = localStorage.getItem(chakraStorageKey);
    
    if (cachedChakra !== null && step3Complete) {
      const chakraValue = parseFloat(cachedChakra) || 0;
      setHasChakra(chakraValue > 0);
      setChakraBalance(chakraValue);
      lastSuccessfulChakraBalance.current = chakraValue;
    } else {
      setHasChakra(false);
      setChakraBalance(0);
    }

    // Load step 4 (Character) from localStorage
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    setHasCharacter(step4Complete);
    
    // Reset failure counters when wallet changes
    consecutiveChakraFailures.current = 0;
    consecutiveCharacterFailures.current = 0;
  }, [walletAddress, authenticated, ready]);

  // SINGLE UNIFIED POLLING EFFECT - 15 seconds to avoid rate limiting
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      return;
    }

    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;

    // Initial check after mount - stagger the checks to avoid simultaneous calls
    const initialChakraTimer = setTimeout(() => {
      const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      
      if (!step3Complete) {
        console.log('[Onboarding] Initial Chakra check');
        checkChakra(false);
      }
    }, 3000); // Wait 3 seconds after mount

    const initialCharacterTimer = setTimeout(() => {
      const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      
      if (!step4Complete) {
        console.log('[Onboarding] Initial Character check');
        checkCharacter(false);
      }
    }, 5000); // Wait 5 seconds after mount (staggered)

    // Set up single interval for both checks (every 15 seconds to avoid rate limiting)
    const intervalId = setInterval(() => {
      const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
      const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
      
      // Stagger the checks within the interval
      if (!step3Complete) {
        console.log('[Onboarding] Periodic Chakra check (15s)');
        checkChakra(false);
      }
      
      if (!step4Complete) {
        // Wait 2 seconds before checking character to avoid simultaneous calls
        setTimeout(() => {
          console.log('[Onboarding] Periodic Character check (15s)');
          checkCharacter(false);
        }, 2000);
      }
      
      // Stop interval if both are complete
      if (step3Complete && step4Complete) {
        console.log('[Onboarding] Both checks complete - stopping interval');
        clearInterval(intervalId);
      }
    }, 15000); // 15 seconds (slower than NavBar to avoid conflicts)

    return () => {
      clearTimeout(initialChakraTimer);
      clearTimeout(initialCharacterTimer);
      clearInterval(intervalId);
    };
  }, [walletAddress, authenticated, ready, checkChakra, checkCharacter]);

  // Check profile and determine dialog visibility
  useEffect(() => {
    if (!ready || !authenticated || !walletAddress) {
      setIsOpen(false);
      setHasProfile(false);
      return;
    }

    // Check profile (synchronous)
    const userHasProfile = !!(user && user.id);
    setHasProfile(userHasProfile);
    
    // Get step completion status from localStorage
    const step2CompleteKey = `onboarding-step2-${walletAddress}`;
    const step3CompleteKey = `onboarding-step3-${walletAddress}`;
    const step4CompleteKey = `onboarding-step4-${walletAddress}`;
    const onboardingCompleteKey = `onboarding-complete-${walletAddress}`;
    
    const step2Complete = localStorage.getItem(step2CompleteKey) === 'true';
    const step3Complete = localStorage.getItem(step3CompleteKey) === 'true';
    const step4Complete = localStorage.getItem(step4CompleteKey) === 'true';
    
    console.log(`[Onboarding] Visibility check for ${walletAddress}`);
    console.log(`[Onboarding] Steps: Profile=${userHasProfile}, Faucet=${step2Complete}, Chakra=${step3Complete}, Character=${step4Complete}`);
    
    // Don't show on task pages
    if (pathname === '/mint-character') {
      setIsOpen(false);
      return;
    }
    
    const allComplete = userHasProfile && step2Complete && step3Complete && step4Complete;
    
    if (allComplete) {
      localStorage.setItem(onboardingCompleteKey, 'true');
      setIsOpen(false);
      console.log(`[Onboarding] All complete - hiding dialog`);
    } else {
      localStorage.removeItem(onboardingCompleteKey);
      setIsOpen(true);
      console.log(`[Onboarding] Steps incomplete - showing dialog`);
    }
  }, [walletAddress, ready, authenticated, user, pathname, hasFaucetDone, hasChakra, hasCharacter]);

  // Mark when on task pages and force check when leaving
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
            console.log('[Onboarding] Returned from task page - force checking');
            if (!step3Complete) checkChakra(true);
            // Stagger character check
            if (!step4Complete) {
              setTimeout(() => checkCharacter(true), 2000);
            }
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [pathname, walletAddress, authenticated, checkChakra, checkCharacter]);

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