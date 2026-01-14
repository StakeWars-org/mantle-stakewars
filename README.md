# StakeWars: A Self-Sustaining GameFi & Social Gaming Ecosystem on Mantle

## Table of Contents

1. [What is StakeWars?](#1-what-is-stakewars)
   - 1.1 [Game Overview](#11-game-overview)
   - 1.2 [Core Game Pillars](#12-core-game-pillars)
2. [Core Gameplay Systems](#2-core-gameplay-systems)
   - 2.1 [Combat System](#21-combat-system)
3. [Character System](#3-character-system)
   - 3.1 [Characters](#31-characters)
   - 3.2 [Ownership](#32-ownership)
   - 3.3 [Access Model](#33-access-model)
4. [Game Modes](#4-game-modes)
5. [Building Your Character (Progression System)](#5-building-your-character-progression-system)
   - 5.1 [Progression Philosophy](#51-progression-philosophy)
   - 5.2 [Ranks & Advancement](#52-ranks--advancement)
   - 5.3 [Character Mastery](#53-character-mastery)
   - 5.4 [Village & Element Identity](#54-village--element-identity)
6. [Token Economy (CHAKRA)](#6-token-economy-chakra)
   - 6.1 [What CHAKRA Is Used For](#61-what-chakra-is-used-for)
   - 6.2 [How CHAKRA Enters the System](#62-how-chakra-enters-the-system)
   - 6.3 [How CHAKRA Leaves the System](#63-how-chakra-leaves-the-system)
   - 6.4 [Starter CHAKRA (New Player Access)](#64-starter-chakra-new-player-access)
7. [Economic Flow & Sustainability Model](#7-economic-flow--sustainability-model)
   - 7.1 [CHAKRA Inflows](#71-chakra-inflows)
   - 7.2 [CHAKRA Outflows](#72-chakra-outflows)
   - 7.3 [Treasury Accumulation](#73-treasury-accumulation)
   - 7.4 [Economic Equilibrium Assumptions](#74-economic-equilibrium-assumptions)
   - 7.5 [Economic Flow Diagram](#75-economic-flow-diagram)
8. [Sponsored Events](#8-sponsored-events)
9. [Revenue-Sharing Seasons](#9-revenue-sharing-seasons)
   - 9.1 [Seasonal Structure](#91-seasonal-structure)
10. [Character Revenue Systems](#10-character-revenue-systems)
11. [Real Yield Mechanics (Fee-Backed, Non-Inflationary)](#11-real-yield-mechanics-fee-backed-non-inflationary)
   - 11.1 [Character Commitment Yield (Planned)](#111-character-commitment-yield-planned)
   - 11.2 [Treasury Participation Yield (Planned)](#112-treasury-participation-yield-planned)
   - 11.3 [Yield Design Principles](#113-yield-design-principles)
12. [Social & Identity Systems](#12-social--identity-systems)
13. [Regulatory & Compliance Considerations](#13-regulatory--compliance-considerations)
   - 13.1 [Fair Play & Anti-Dominance Design](#131-fair-play--anti-dominance-design)
14. [Technical Implementation](#14-technical-implementation)
15. [Getting Started](#15-getting-started)
16. [Learn More](#16-learn-more)

---

## 1. What is StakeWars?

StakeWars is a competitive social game where value is created by player rivalry, reputation, and time — not token emissions.

StakeWars is built around strategic PvP battles where players compete using skill, timing, and decision-making.  
Players build identity through characters, villages, ranks, and public performance rather than passive rewards.

Blockchain is used only to ensure:
- Fair competition
- Verifiable match results
- True ownership of characters and progression

StakeWars prioritizes long-term fun, rivalry, and social status over speculation.

### Game Overview

- **Genre:** Turn-based strategy combat RPG  
- **Platform:** Web browser (Next.js / React)  
- **Network:** Mantle  
- **Core Loop:** Players engage in strategic PvP battles using stamina-based abilities, cooldowns, and tactical defenses to defeat opponents, earn CHAKRA, climb leaderboards, and participate in competitive events.

### Core Game Pillars

- Skill-based competition  
- Player-funded competition  
- Deflationary economy  
- Social identity & reputation  
- Low-friction Web2 onboarding  

---

## 2. Core Gameplay Systems

### Combat System

#### Manual Ability Selection
Players choose from 6 abilities (4 attacks, 2 defenses) per turn.

#### Stamina Management
- 100 starting stamina  
- +12 regeneration per turn  
- Ability cost ranges from 15–50 stamina  

#### Damage Ranges & Variance
- Attacks deal ±5 damage from base values  
- Critical hits reward +20 stamina  

#### Cooldown System
- Progressive cooldowns (0–3 turns)  
- Prevents ability spamming  

#### Defense Inventory
- Maximum of 2 defenses  
- No duplicates  
- Forces timing and strategic depth  

---

## 3. Character System

### Characters
- 20 unique characters  
- 4 villages: Hidden Leaf, Sand, Mist, Cloud  
- 5 chakra types: Fire, Water, Wind, Earth, Lightning  
- Each character has unique abilities and playstyles  

### Ownership
- Characters are ERC-1155 NFTs  
- Fully player-owned  
- Tradeable and transferable  
- Progression tied to on-chain identity  

### Access Model
- First character is **FREE** (zero barrier to entry)  
- Additional characters cost **1,000 CHAKRA**
  - 60% burned (deflationary sink)  
  - 40% sent to treasury  

---

## 4. Game Modes

### 1. Normal PvP
- Casual matchmaking  
- Earn XP and CHAKRA  
- Designed for learning, retention, and progression  

### 2. Competitive Entry Matches
- 1v1 competitive battles  
- Players pay an entry fee to compete  
- Winner takes 95% of combined entry fees  
- 5% platform fee  

### 3. Tournaments
- 2, 4, or 8 player brackets  
- Entry fees create prize pools  
- Flexible reward distributions  
- Platform fee: 5%  

### 4. Missions Mode (Idle Gameplay)
- Players lock a character for a fixed duration  
- Earn CHAKRA upon mission completion  
- Early unlock results in no reward  
- Designed for passive engagement without inflation  

---

## 5. Building Your Character (Progression System)

### Progression Philosophy

Progression in StakeWars focuses on mastery, choice, and strategic depth — not permanent power increases.

### Ranks & Advancement

- Players advance through ninja ranks via competitive play  
- Higher ranks unlock:
  - New strategic options  
  - Ability variants  
  - Match modifiers  
  - Social recognition  

Ranks do not directly increase damage, health, or stamina.  
Above elite (Kage Candidate) ranks, inactivity may result in rank decay to preserve competitive integrity.

### Character Mastery
- Unlocks alternate ability behaviors  
- No raw stat inflation  
- Reflects experience, not spending  

### Village & Element Identity
- Villages act as social factions  
- Elements define playstyle identity  
- Village participation unlocks:
  - Unique strategic tools  
  - Village-specific events  
  - Competitive rivalries  

---

## 6. Token Economy (CHAKRA)

CHAKRA is a circulation and decision currency, not a passive reward token.

### What CHAKRA Is Used For
- Entering competitive matches  
- Unlocking strategic options  
- Influencing match conditions  
- Supporting village and seasonal events  

CHAKRA is earned through active play and spent to shape gameplay — not to overpower opponents.

### How CHAKRA Enters the System
- Competitive entry fees  
- Tournament prize redistribution  
- Performance-weighted gameplay rewards  
- Sponsored events (non-inflationary)  

### How CHAKRA Leaves the System
- Character unlocks (burn + treasury)  
- Tactical buffs and match modifiers  
- Village contributions  
- Seasonal commitments  

### Starter CHAKRA (New Player Access)

Every new player receives **400 CHAKRA** upon account creation.

This ensures:
- Fair access to competitive play  
- No dependency on secondary markets  
- Smooth Web2 onboarding  

No player is required to purchase CHAKRA to compete.

---

## 7. Economic Flow & Sustainability Model

StakeWars operates on a closed-loop, fee-backed economy designed to reach equilibrium through usage rather than emissions.

### 7.1 CHAKRA Inflows

CHAKRA enters circulation through:
- Starter allocations (one-time per user)
- Mission rewards come from treasury (non-inflationary)
- Competitive performance rewards
- Sponsored events (non-inflationary)

No uncapped or perpetual minting exists.

### 7.2 CHAKRA Outflows

CHAKRA exits circulation through:
- Character unlock burns (60%)
- Competitive entry consumption
- Tactical modifiers and match options
- Seasonal commitments
- Treasury sinks

These sinks scale with platform activity rather than speculation.

### 7.3 Treasury Accumulation

The treasury grows through:
- 40% of character unlock costs
- Platform fees from competitive play
- Sponsored event contributions

Treasury funds are used for:
- Platform development
- Sponsored competitions
- Seasonal rewards
- Future yield distributions

### 7.4 Economic Equilibrium Assumptions

StakeWars targets long-term equilibrium through:
- Deflationary character unlock mechanics
- Fee recycling into competitive rewards
- Optional yield participation
- Controlled reward issuance

As activity increases:
- CHAKRA velocity increases
- Burns offset reward distribution
- Yield becomes usage-backed
- Inflation pressure remains capped

This model prioritizes skilled, active participants and sustainable value creation.

### 7.5 Economic Flow Diagram
```
Player Activity
      ↓
Competitive Entry Fees
      ↓
┌──────── Platform ────────┐
│                          │
│    5% Platform Fee       │
│                          │
└───────┬───────────┬──────┘
        ↓           ↓
    Treasury    Prize Pools
        ↓
Seasonal Rewards / Yield
        ↓
  Active Players
```

**Flow Breakdown:**

1. **Player → Platform**: Entry fees, character purchases, tactical buffs
2. **Platform → Treasury**: 40% of character sales + 5% platform fees
3. **Platform → Winners**: 95% of competitive entry pools
4. **Treasury → Players**: Seasonal rewards, sponsored events, optional yield
5. **Character Purchases → Burn**: 60% permanently removed from circulation

**Key Principles:**
- Revenue is player-generated, not token-minted
- Burns scale with adoption (more players = more character unlocks = more deflation)
- Treasury grows with platform usage, enabling sustainable rewards
- Yield (if implemented) is backed by real fees, not emissions

---

## 8. Sponsored Events

- Brands or ecosystems sponsor tournaments  
- Sponsors fund prize pools directly  
- No token inflation  
- Players compete for externally funded rewards  

---

## 9. Revenue-Sharing Seasons

Revenue-sharing distributions are sourced exclusively from platform-generated fees and treasury allocations, ensuring rewards remain non-inflationary and usage-backed.

### Seasonal Structure
- Fixed-duration competitive seasons  
- Portion of platform revenue distributed to:
  - Top-ranked players  
  - Top guilds  
  - Tournament champions  

Designed to reward consistency, not speculation.

---

## 10. Character Revenue Systems

Characters may participate in platform revenue through active contribution.

Potential mechanics:
- Temporarily committing characters to seasons or modes  
- Sharing in a portion of platform-generated fees  

Key principles:
- Optional participation  
- Activity-based allocation  
- No guaranteed returns  
- No token emissions  

---

## 11. Real Yield Mechanics (Fee-Backed, Non-Inflationary)

StakeWars is designed to generate real yield derived from platform activity, not token emissions.

All yield mechanisms are backed by actual protocol revenue generated from competitive entry fees, tournaments, and platform activity.

Yield is not fixed, guaranteed, or inflationary.
It emerges organically from usage and is distributed according to predefined smart contract rules.

### Yield Design Principles

- No token minting for yield
- No fixed APRs or guaranteed returns
- All distributions sourced from platform-generated fees
- Participation is optional and reversible
- Yield scales with ecosystem activity

### 11.1 Character Commitment Yield (Planned)

Players will be able to temporarily commit characters to competitive seasons, guild pools, or ecosystem roles to earn a share of platform fees.

**Planned mechanics:**

- Characters are assigned to a season or contribution pool
- Committed characters become eligible for fee-sharing rewards

**Rewards are distributed based on:**

- Match participation
- Competitive performance
- Season contribution
- Engagement metrics

**Key properties:**

- Characters are never permanently locked
- Idle characters earn nothing
- No guaranteed payouts
- Higher activity and performance increase reward share

This system reinforces active participation and rewards skill-based contribution rather than capital dominance.

#### Smart Contract Architecture (Conceptual)
```solidity
// Character Commitment Yield Distribution
function distributeSeasonalYield(
    address[] memory participants,
    uint256[] memory performanceScores
) external onlyAuthorized {
    uint256 totalFees = platformFees.balance;
    uint256 yieldPool = totalFees * YIELD_SHARE_PERCENTAGE / 100;
    
    // Distribute based on weighted performance
    for (uint i = 0; i < participants.length; i++) {
        uint256 share = calculateShare(performanceScores[i], yieldPool);
        CHAKRA.transfer(participants[i], share);
    }
}

function calculateShare(
    uint256 performanceScore,
    uint256 pool
) internal view returns (uint256) {
    // Share = (Your performance / Total performance) × Pool
    return (pool * performanceScore) / totalPerformanceScore;
}
```

**How it works:**

1. Platform accumulates fees from competitive matches (5% per match)
2. At end of season, a percentage of fees becomes the yield pool
3. Players who committed characters receive shares based on performance metrics:
   - Wins and match completion
   - Competitive ranking
   - Participation consistency
4. High-activity, high-skill players earn proportionally more
5. Idle or low-performing characters earn minimal or no yield

**Example Distribution:**

If the seasonal yield pool is 10,000 CHAKRA and three players participated:
- **Alice** (500 performance points): Receives 50% → 5,000 CHAKRA
- **Bob** (300 performance points): Receives 30% → 3,000 CHAKRA  
- **Charlie** (200 performance points): Receives 20% → 2,000 CHAKRA

This ensures yield rewards active contribution, not passive holding.

### 11.2 Treasury Participation Yield (Planned)

A portion of the 40% CHAKRA treasury accumulation will be distributed to ecosystem contributors.

**Potential participation paths include:**

- Temporarily committing CHAKRA for fixed durations
- Participating in seasonal contribution pools
- Meeting performance or activity thresholds
- Ecosystem-aligned participation (e.g. governance or competitive roles)

**Important constraints:**

- Treasury distributions are capped and discretionary
- All rewards are sourced from real platform fees
- No passive yield for idle capital
- No inflationary emissions
- Treasury participation functions as a reward for ecosystem contribution — not a passive income mechanism.

11.3 Yield Activation & Rollout Strategy

Yield mechanisms are intentionally staged and will only activate once:
- Platform activity reaches sustainable levels
- Fee generation is consistent and verifiable
- Competitive integrity is preserved

This phased rollout prevents early over-incentivization and ensures long-term economic stability.

- Platform activity reaches sustainable levels
- Fee generation is consistent and verifiable
- Competitive integrity is preserved

This phased rollout prevents early over-incentivization and ensures long-term economic stability.

---

## 12. Social & Identity Systems

- Guilds and clans  
- Guild leaderboards  
- Team-based tournaments  
- Live spectating and match replays  
- Social login via Privy  
- Shareable rankings and match outcomes  

StakeWars functions as a competitive social network — not just a game.

---

## 13. Regulatory & Compliance Considerations

StakeWars is a skill-based competitive game, not a game of chance.

- Match outcomes are driven by player decisions and strategy  
- Randomness is limited and non-dominant  
- Competitive modes may be restricted by region or age  

### Fair Play & Anti-Dominance Design

To prevent capital-based dominance:
- Entry limits per account or character  
- Rank-based matchmaking  
- Tactical buff restrictions in competitive modes  
- Character fatigue to encourage rotation  
- Fixed entry structures  

These safeguards ensure skill remains the primary determinant of success.

---

## 14. Technical Implementation

- **Frontend:** Next.js, React, TypeScript  
- **Blockchain:** Mantle, Viem, Wagmi  
- **Authentication:** Privy  
- **Smart Contracts:** ERC-1155 (Characters), ERC-20 (CHAKRA)  
- **Backend:** Firebase (Firestore, Functions)  
- **Styling:** Tailwind CSS  

---

## 15. Getting Started

```bash
git clone <repo-url>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 16. Learn More

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Mantle Documentation](https://docs.mantle.xyz/) - learn about Mantle blockchain
- [Privy Documentation](https://docs.privy.io/) - learn about Privy authentication

You can check out the project repository for more information and to contribute.