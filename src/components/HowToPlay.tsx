'use client'

import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Button } from "./ui/button";
import { 
  Sword, 
  Shield,
  Coins, 
  Trophy, 
  Users, 
  Zap, 
  Target,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Flame,
  Droplet as DropletIcon,
  Wind,
  Mountain
} from 'lucide-react';

export default function HowToPlay() {
  const [currentPage, setCurrentPage] = useState(0);
  
  const pages = [
    // Page 1: Getting Started
    {
      title: "🎮 Getting Started",
      icon: <Sparkles className="w-6 h-6 text-purple-400" />,
      content: (
        <div className="space-y-6">
          {/* Quick Start */}
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/50 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-3 flex items-center gap-2">
              <Target className="w-6 h-6 text-purple-400" />
              Objective
            </h2>
            <p className="text-gray-200 text-lg leading-relaxed mb-3">
              Outlast your opponent in turn-based combat by reducing their health to zero!
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-purple-950/50 p-3 rounded-lg border border-purple-500/30">
                <p className="text-purple-300 font-semibold text-sm mb-1">Normal PvP</p>
                <p className="text-gray-300 text-xs">Earn XP and CHAKRA rewards for winning</p>
              </div>
              <div className="bg-orange-950/50 p-3 rounded-lg border border-orange-500/30">
                <p className="text-orange-300 font-semibold text-sm mb-1">Wager & Tournaments</p>
                <p className="text-gray-300 text-xs">Stake CHAKRA - winner takes all!</p>
              </div>
            </div>
          </div>

          {/* Setup Steps */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Quick Setup (4 Steps)</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
                <div>
                  <p className="text-white font-semibold">Create Your Account</p>
                  <p className="text-gray-400 text-sm">Click &quot;Create User&quot; to set up your blockchain account</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
                <div>
                  <p className="text-white font-semibold">Get Mantle Tokens</p>
                  <p className="text-gray-400 text-sm">Use the faucet to get free MNT for transaction fees</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
                <div>
                  <p className="text-white font-semibold">Mint Chakra</p>
                  <p className="text-gray-400 text-sm">Mint your starter CHAKRA tokens to begin playing</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-gray-800/50 p-4 rounded-lg border border-purple-500/30">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
                <div>
                  <p className="text-white font-semibold">Mint Your Character</p>
                  <p className="text-gray-400 text-sm">Get your first character FREE and start playing!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    
    // Page 2: Characters & Abilities
    {
      title: "⚔️ Characters & Villages",
      icon: <Sword className="w-6 h-6 text-orange-400" />,
      content: (
        <div className="space-y-6">
          {/* Villages */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Mountain className="w-6 h-6 text-green-400" />
              Villages & Chakra Types
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                <p className="font-bold text-green-400 mb-1">🍃 Hidden Leaf</p>
                <p className="text-gray-300 text-sm">Balanced fighters with versatile abilities</p>
              </div>
              <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                <p className="font-bold text-yellow-400 mb-1">🏜️ Hidden Sand</p>
                <p className="text-gray-300 text-sm">Defensive specialists</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                <p className="font-bold text-blue-400 mb-1">🌊 Hidden Mist</p>
                <p className="text-gray-300 text-sm">Strategic assassins</p>
              </div>
              <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4">
                <p className="font-bold text-purple-400 mb-1">⚡ Hidden Cloud</p>
                <p className="text-gray-300 text-sm">High-speed attackers</p>
              </div>
            </div>
          </div>

          {/* Chakra Types */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Chakra Natures</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-white"><span className="font-bold text-red-400">Fire</span> - Aggressive damage</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg">
                <DropletIcon className="w-4 h-4 text-blue-400" />
                <span className="text-white"><span className="font-bold text-blue-400">Water</span> - Adaptable defense</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg">
                <Wind className="w-4 h-4 text-cyan-400" />
                <span className="text-white"><span className="font-bold text-cyan-400">Wind</span> - Speed attacks</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg">
                <Mountain className="w-4 h-4 text-amber-600" />
                <span className="text-white"><span className="font-bold text-amber-600">Earth</span> - Tank builds</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800/50 p-3 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white"><span className="font-bold text-yellow-400">Lightning</span> - Critical hits</span>
              </div>
            </div>
          </div>

          {/* Character Stats */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-blue-300 mb-2">💡 Pro Tip</h3>
            <p className="text-gray-300 text-sm">
              Each village/chakra combination creates a unique character with different abilities. 
              Experiment with different characters to find your playstyle!
            </p>
          </div>
        </div>
      )
    },

    // Page 3: Combat System
    {
      title: "⚔️ Combat System",
      icon: <Sword className="w-6 h-6 text-red-400" />,
      content: (
        <div className="space-y-6">
          {/* Turn Order */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-purple-400" />
              How Combat Works
            </h2>
            
            <div className="space-y-4">
              <div className="bg-gray-800/50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <p className="text-white font-bold">Roll to Decide First Player</p>
                </div>
                <p className="text-gray-300 text-sm ml-8">
                  Both players roll dice. Highest number goes first. This is the ONLY dice roll in the game!
                </p>
              </div>

              <div className="bg-gray-800/50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <p className="text-white font-bold">Select Your Ability</p>
                </div>
                <p className="text-gray-300 text-sm ml-8">
                  On your turn, manually select any ability from your character&apos;s 6 abilities. Choose attacks or defenses based on your strategy!
                </p>
              </div>

              <div className="bg-gray-800/50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <p className="text-white font-bold">Manage Your Stamina</p>
                </div>
                <p className="text-gray-300 text-sm ml-8">
                  Each ability costs stamina (15-50 for attacks, 15 for defenses). You start with 100 stamina and regenerate +12 per turn. Plan your moves wisely!
                </p>
              </div>

              <div className="bg-gray-800/50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-orange-600 rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <p className="text-white font-bold">Alternate Turns</p>
                </div>
                <p className="text-gray-300 text-sm ml-8">
                  Players take turns selecting abilities until one reaches 0 HP. Last warrior standing wins!
                </p>
              </div>
            </div>
          </div>

          {/* Stamina System */}
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-yellow-300 mb-2">⚡ Stamina System</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <p><span className="font-bold text-white">Starting Stamina:</span> 100</p>
              <p><span className="font-bold text-white">Regeneration:</span> +12 stamina per turn</p>
              <p><span className="font-bold text-white">Stamina Costs:</span></p>
              <ul className="ml-4 space-y-1">
                <li>• Attack 20: 15 stamina</li>
                <li>• Attack 25: 20 stamina</li>
                <li>• Attack 30: 30 stamina</li>
                <li>• Attack 35: 50 stamina</li>
                <li>• Defense abilities: 15 stamina</li>
              </ul>
              <p className="mt-2 text-yellow-200"><span className="font-bold">Critical Hits:</span> Deal +3 to +5 above base damage to gain +20 bonus stamina!</p>
            </div>
          </div>

          {/* Cooldown System */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-orange-300 mb-2">🔒 Cooldown System</h3>
            <p className="text-gray-300 text-sm">
              Stronger attacks have cooldowns after use: Attack 25 (1 turn), Attack 30 (2 turns), Attack 35 (3 turns). 
              The weakest attack (20) has no cooldown. Defense types also have 2-turn cooldowns after being used.
            </p>
          </div>
        </div>
      )
    },

    // Page 4: Defensive Abilities
    {
      title: "🛡️ Defensive Abilities",
      icon: <Shield className="w-6 h-6 text-blue-400" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-400" />
            Master Your Defense
          </h2>

          {/* Reflect */}
          <div className="bg-purple-900/30 border-2 border-purple-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-300">Reflect</h3>
                <p className="text-purple-400 text-sm">Counter-attack ability</p>
              </div>
            </div>
            <p className="text-gray-200 leading-relaxed">
              Returns the incoming damage back to the attacker. Perfect for punishing aggressive opponents! Must be in your defense inventory to use.
            </p>
            <div className="mt-3 bg-purple-950/50 p-3 rounded-lg">
              <p className="text-purple-300 text-sm">
                <span className="font-bold">⚡ Effect:</span> Attacker takes their own damage. Costs 15 stamina to add to inventory. 2-turn cooldown after use.
              </p>
            </div>
          </div>

          {/* Dodge */}
          <div className="bg-cyan-900/30 border-2 border-cyan-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-cyan-600 rounded-full flex items-center justify-center">
                <Wind className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-cyan-300">Dodge</h3>
                <p className="text-cyan-400 text-sm">Evasion ability</p>
              </div>
            </div>
            <p className="text-gray-200 leading-relaxed">
              Completely avoid incoming damage. Must be in your defense inventory to use when attacked.
            </p>
            <div className="mt-3 bg-cyan-950/50 p-3 rounded-lg">
              <p className="text-cyan-300 text-sm">
                <span className="font-bold">⚡ Effect:</span> Take 0 damage. Costs 15 stamina to add to inventory. 2-turn cooldown after use.
              </p>
            </div>
          </div>

          {/* Block */}
          <div className="bg-blue-900/30 border-2 border-blue-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-300">Block</h3>
                <p className="text-blue-400 text-sm">Damage reduction</p>
              </div>
            </div>
            <p className="text-gray-200 leading-relaxed">
              Reduces incoming damage by 50%. Must be in your defense inventory to use when attacked.
            </p>
            <div className="mt-3 bg-blue-950/50 p-3 rounded-lg">
              <p className="text-blue-300 text-sm">
                <span className="font-bold">⚡ Effect:</span> Take 50% damage. Costs 15 stamina to add to inventory. 2-turn cooldown after use.
              </p>
            </div>
          </div>
        </div>
      )
    },

    // Page 5: Economy & Rewards
    {
      title: "💰 Economy & Rewards",
      icon: <Coins className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Coins className="w-6 h-6 text-yellow-400" />
            CHAKRA Token Economy
          </h2>

          {/* CHAKRA Explanation */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border border-yellow-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <img src="/chakra_coin.svg" alt="CHAKRA" className="w-12 h-12" />
              <div>
                <h3 className="text-xl font-bold text-yellow-300">CHAKRA (CHK)</h3>
                <p className="text-yellow-400 text-sm">In-game currency</p>
              </div>
            </div>
            <p className="text-gray-200 mb-3">
              The native token of StakeWars. Earn it by winning matches and tournaments!
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300"><span className="font-bold text-white">Earn:</span> Win matches, tournaments, and complete challenges</p>
              </div>
              <div className="flex items-start gap-2">
                <Coins className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300"><span className="font-bold text-white">Spend:</span> Buy characters (1000 CHK), power-ups, and enter wager matches</p>
              </div>
            </div>
          </div>

          {/* Game Modes */}
          <div>
            <h3 className="text-xl font-bold text-white mb-3">Game Modes & Rewards</h3>
            <div className="space-y-3">
              <div className="bg-gray-800/50 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-green-400" />
                  <p className="font-bold text-white">Normal PvP</p>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  Play casual matches without staking. Perfect for practice and earning rewards!
                </p>
                <div className="bg-green-950/50 p-2 rounded text-xs text-green-300">
                  <span className="font-bold">Rewards:</span> Earn XP and CHAKRA for winning
                </div>
              </div>

              <div className="bg-gray-800/50 border border-purple-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  <p className="font-bold text-white">Wager Matches</p>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  Stake CHAKRA tokens in 1v1 battles. Winner takes all!
                </p>
                <div className="bg-purple-950/50 p-2 rounded text-xs text-purple-300">
                  <span className="font-bold">High Risk, High Reward:</span> Stake to win big
                </div>
              </div>

              <div className="bg-gray-800/50 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-orange-400" />
                  <p className="font-bold text-white">Tournaments</p>
                </div>
                <p className="text-gray-300 text-sm mb-2">
                  Compete in scheduled tournaments with entry fees. Climb the leaderboard!
                </p>
                <div className="bg-orange-950/50 p-2 rounded text-xs text-orange-300">
                  <span className="font-bold">Compete:</span> Prize pool for top players
                </div>
              </div>
            </div>
          </div>

          {/* Tokenomics */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-red-300 mb-2">🔥 Deflationary Model</h4>
            <p className="text-gray-300 text-xs">
              When you buy characters: 60% of CHAKRA is permanently burned, 40% goes to treasury. 
              This keeps the economy balanced and rewards long-term players.
            </p>
          </div>
        </div>
      )
    },

    // Page 6: Strategy Guide
    {
      title: "🧠 Strategy & Tips",
      icon: <Zap className="w-6 h-6 text-yellow-400" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-400" />
            Winning Strategies
          </h2>

          {/* Core Strategies */}
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-300 mb-2">🎯 Know Your Opponent</h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                Watch their patterns. Do they defend early or attack aggressively? Adapt your strategy mid-match.
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-blue-500/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-blue-300 mb-2">🛡️ Defense Timing is Key</h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                Don&apos;t waste your defensive abilities on small attacks. Save Reflect/Dodge for big damage! Remember you can only hold 2 defenses max.
              </p>
            </div>

            <div className="bg-gradient-to-r from-cyan-900/40 to-green-900/40 border border-cyan-500/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-300 mb-2">⚡ Stamina Management</h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                Manage your stamina carefully! Strong attacks cost 30-50 stamina. You regenerate +12 per turn, so plan your moves to avoid running out.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-900/40 to-yellow-900/40 border border-green-500/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-300 mb-2">🎯 Ability Selection</h3>
              <p className="text-gray-200 text-sm leading-relaxed">
                You manually select abilities - no dice rolls! Choose strategically based on stamina, cooldowns, and your opponent&apos;s health.
              </p>
            </div>
          </div>

          {/* Advanced Tips */}
          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <h3 className="text-lg font-bold text-orange-300 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Advanced Tactics
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span><span className="font-bold text-white">Health Advantage:</span> If you&apos;re ahead in HP, conserve defenses; if behind, use them strategically</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span><span className="font-bold text-white">Reflect Timing:</span> Use Reflect when you predict a big attack coming based on opponent&apos;s patterns</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span><span className="font-bold text-white">Damage Ranges:</span> Attacks deal random damage within ±5 of base value. Critical hits (+3 to +5 above base) reward +20 stamina!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span><span className="font-bold text-white">Cooldown Management:</span> Stronger attacks have cooldowns (1-3 turns). Plan your sequence to avoid being locked out of your best moves</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold">•</span>
                <span><span className="font-bold text-white">Defense Limits:</span> Maximum 2 defenses in inventory, no duplicates. Use them strategically when big attacks are coming!</span>
              </li>
          </ul>
          </div>
        </div>
      )
    },

    // Page 7: Marketplace & Progression
    {
      title: "🏪 Marketplace & Growth",
      icon: <Sparkles className="w-6 h-6 text-pink-400" />,
      content: (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-pink-400" />
            Grow Your Collection
          </h2>

          {/* Characters */}
          <div className="bg-purple-900/30 border border-purple-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Sword className="w-6 h-6 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Characters</h3>
            </div>
            <div className="space-y-3 text-sm">
              <p className="text-gray-200">
                <span className="font-bold text-purple-300">First Character:</span> FREE! Mint your first character at no cost.
              </p>
              <p className="text-gray-200">
                <span className="font-bold text-purple-300">Additional Characters:</span> 1000 CHK each from the Marketplace.
              </p>
              <div className="bg-purple-950/50 p-3 rounded-lg mt-3">
                <p className="text-purple-200 text-xs">
                  💡 Each character has unique abilities. Build a collection to adapt to different opponents!
                </p>
              </div>
            </div>
          </div>

          {/* Power-Ups */}
          <div className="bg-blue-900/30 border border-blue-500/50 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <Zap className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Power-Ups (In-Game)</h3>
            </div>
            <p className="text-gray-200 text-sm mb-3">
              Purchase attack power-ups during active matches to gain an edge:
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-blue-950/50 p-3 rounded-lg">
                <span className="text-blue-200 text-sm">
                  <Sword className="w-4 h-4 inline mr-2 text-orange-400" />
                  Attack Boost
                </span>
                <span className="text-blue-300 font-bold text-sm">+Damage</span>
              </div>
            </div>
            <p className="text-gray-400 text-xs mt-3">
              Available during matches from the Marketplace menu
            </p>
          </div>

          {/* Transfer */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-300 mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Transfer CHAKRA
            </h4>
            <p className="text-gray-300 text-xs">
              Send CHAKRA to friends or trade with other players. Use the Transfer page to send CHK to any Mantle address.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="fixed bottom-5 right-5 lg:right-9 z-40">
      <Dialog>
        <DialogTrigger className="connect-button-bg h-11 px-5 rounded-3xl items-center cursor-pointer shadow-lg transition-all">
          <div className="flex gap-2 items-center">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="underline font-bold text-[11px] sm:text-xs text-white">
              How to Play
            </span>
          </div>
        </DialogTrigger>
        
        <DialogContent className="bg-gray-900 border-2 border-purple-500/50 max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">How to Play StakeWars</DialogTitle>
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-purple-500/30">
            <div className="flex items-center gap-3">
              {pages[currentPage].icon}
              <h2 className="text-2xl font-bold text-white">{pages[currentPage].title}</h2>
            </div>
            <div className="flex items-center gap-2 bg-purple-900/30 px-3 py-1 rounded-full">
              <span className="text-purple-300 text-sm font-semibold">{currentPage + 1} / {pages.length}</span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500 scrollbar-track-gray-800">
            {pages[currentPage].content}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-purple-500/30">
            <Button
              variant="outline"
              className={`flex items-center gap-2 ${
                currentPage === 0 ? "invisible" : ""
              }`}
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            {/* Page Indicators */}
            <div className="flex gap-2 justify-center">
              {pages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`transition-all ${
                    index === currentPage 
                      ? "w-8 h-2 bg-purple-500 rounded-full" 
                      : "w-2 h-2 bg-gray-600 rounded-full hover:bg-gray-500"
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              ))}
            </div>

            <Button
              className={`flex items-center gap-2 bg-purple-600 hover:bg-purple-700 ${
                currentPage === pages.length - 1 ? "invisible" : ""
              }`}
              onClick={() =>
                setCurrentPage((prev) => Math.min(pages.length - 1, prev + 1))
              }
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
