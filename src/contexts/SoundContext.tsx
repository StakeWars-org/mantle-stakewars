"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playButtonClick: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: ReactNode }) {
  const [isMuted, setIsMuted] = useState(false);
  const pathname = usePathname();
  const hasStartedRef = useRef(false);
  
  // Audio refs
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const buttonClickSoundRef = useRef<HTMLAudioElement | null>(null);
  
  // Volume constants
  const BACKGROUND_VOLUME = 0.15; // Low volume
  const BUTTON_CLICK_VOLUME = 0.2; // Low volume

  // Initialize audio elements
  useEffect(() => {
    // Background music
    backgroundMusicRef.current = new Audio();
    backgroundMusicRef.current.loop = true;
    backgroundMusicRef.current.volume = BACKGROUND_VOLUME;
    
    // Button click sound
    buttonClickSoundRef.current = new Audio('/sounds/Menu Selection Click.wav');
    buttonClickSoundRef.current.volume = BUTTON_CLICK_VOLUME;

    return () => {
      // Cleanup
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current = null;
      }
      if (buttonClickSoundRef.current) {
        buttonClickSoundRef.current = null;
      }
      hasStartedRef.current = false;
    };
  }, []);

  // Helper function to start music on user interaction
  const setupAutoplayFallback = useCallback(() => {
    const startOnInteraction = () => {
      if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
        backgroundMusicRef.current.play()
          .then(() => {
            hasStartedRef.current = true;
          })
          .catch(() => {});
      }
    };
    
    // Use once: true so listeners are automatically removed after first trigger
    document.addEventListener('click', startOnInteraction, { once: true });
    document.addEventListener('touchstart', startOnInteraction, { once: true });
    document.addEventListener('keydown', startOnInteraction, { once: true });
  }, []);

  // Handle route-based background music
  useEffect(() => {
    if (!backgroundMusicRef.current) return;

    const isGameRoute = pathname?.startsWith('/ai-game') || pathname?.startsWith('/game-play');
    
    // Determine which music to play
    const musicFile = isGameRoute 
      ? '/sounds/Light battle.ogg'
      : '/sounds/hold the line_0.flac';

    // Get current src without origin
    const currentSrc = backgroundMusicRef.current.src 
      ? new URL(backgroundMusicRef.current.src).pathname 
      : '';
    const newMusicPath = musicFile;

    // Only change if the music file is different
    if (currentSrc !== newMusicPath) {
      const wasPlaying = !backgroundMusicRef.current.paused;
      backgroundMusicRef.current.pause();
      backgroundMusicRef.current.src = musicFile;
      
      // Try to play immediately (music will continue playing even if muted, just at volume 0)
      backgroundMusicRef.current.play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {
          // Autoplay was prevented, set up fallback for user interaction
          setupAutoplayFallback();
        });
    } else if (backgroundMusicRef.current.paused && hasStartedRef.current) {
      // Resume if paused but was previously started
      backgroundMusicRef.current.play()
        .then(() => {
          hasStartedRef.current = true;
        })
        .catch(() => {
          // Will try again on next interaction
          setupAutoplayFallback();
        });
    }
  }, [pathname, setupAutoplayFallback]);

  // Play button click sound
  const playButtonClick = useCallback(() => {
    if (isMuted || !buttonClickSoundRef.current) return;
    
    // Reset to start and play
    buttonClickSoundRef.current.currentTime = 0;
    buttonClickSoundRef.current.play().catch((error) => {
      console.log('Button click sound error:', error);
    });
  }, [isMuted]);

  // Handle mute state - control volume instead of pausing
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    // When muted, set volume to 0 (music keeps playing)
    // When unmuted, restore volume to normal
    backgroundMusicRef.current.volume = isMuted ? 0 : BACKGROUND_VOLUME;
  }, [isMuted]);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  // Global button click handler
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Check if clicked element is a button or inside a button
      const button = target.closest('button');
      if (button && !button.hasAttribute('data-no-sound')) {
        playButtonClick();
      }
    };

    document.addEventListener('click', handleButtonClick);
    return () => {
      document.removeEventListener('click', handleButtonClick);
    };
  }, [playButtonClick]);

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playButtonClick }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}

