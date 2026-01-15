# StakeWars: A Self-Sustaining GameFi & Social Gaming Ecosystem on Mantle

## Table of Contents

1. [What is StakeWars?](#1-what-is-stakewars)
2. [Game Design & One-Pager Pitch](#2-game-design--one-pager-pitch)
3. [Token Economy (CHAKRA)](#3-token-economy-chakra)
4. [Regulatory & Compliance Considerations](#4-regulatory--compliance-considerations)
5. [Technical Implementation](#5-technical-implementation)
6. [Getting Started](#6-getting-started)
7. [Learn More](#7-learn-more)

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

### Core Game Pillars

- Skill-based competition  
- Player-funded competition  
- Deflationary economy  
- Social identity & reputation  
- Low-friction Web2 onboarding  

---

## 2. Game Design & One-Pager Pitch

One pager pitch - https://docs.google.com/document/d/1ih9By_Q3o3LMtYI3Je3LZ1qpuVjmvY4P0LDUn6cCsAk/edit?usp=sharing

Game Design Development - https://docs.google.com/document/d/1iejj8LmnvepIPk7qU-pczgmFsE2ZqH8rPx2CfUSNRSE/edit?usp=sharing

Demo Video - https://youtu.be/W8_AwXnfQDQ

Pitch Video - https://youtu.be/e3YkIhn7yJg

Live website - https://stakewars.fun/

### Problem

Most GameFi projects rely on inflationary token rewards to attract players.  
This leads to:
- Short-lived player engagement  
- Unsustainable token emissions  
- Capital dominance over skill  
- Players farming rewards instead of playing for fun  

As rewards decline, players leave, and the economy collapses.

---

### Solution

StakeWars replaces inflationary rewards with **competitive, player-funded gameplay**.

Unlike traditional GameFi projects that rely on emissions, StakeWars uses:
- Skill-based PvP competition  
- Social rivalry and reputation  
- Player-funded prize pools  
- Protocol-owned fees  

Value is generated through gameplay activity, not token printing.

Players compete for:
- Social status  
- Leaderboard dominance  
- Tournament prestige  
- Seasonal recognition  

Blockchain ensures fairness and ownership — not speculation.

---

### Game Design Philosophy

- Skill > capital  
- Activity > passive holding  
- Identity > yield farming  
- Competition > inflation  

Players can compete:
- With CHAKRA (competitive entry)
- Or without CHAKRA (social clout, practice, tournaments)

Fees are a **secondary mechanic**, not the core hook.

---

### Business Model

StakeWars generates protocol revenue through:
- Competitive match platform fees (5%)
- Tournament entry fees
- Character unlock fees
- Sponsored events

Revenue is:
- Player-generated
- Usage-backed
- Non-inflationary

A portion of protocol revenue is redistributed seasonally to:
- Skilled players
- Active participants
- Top competitors

No fixed APRs. No guaranteed returns.

---

### Roadmap (3–6 Months)

**Phase 1 (Month 1): Core Gameplay MVP**
- Turn-based PvP combat
- Character system
- Free onboarding flow
- Basic matchmaking

**Phase 2 (Month 2): Wager & Tournament Smart Contracts**
- Competitive entry matches
- Tournament brackets
- Fee routing logic
- Treasury accumulation

**Phase 3 (Month 4): Social & Competitive Expansion**
- Leaderboards
- Guilds and rivalries
- Match replays and spectating
- Seasonal rankings

**Phase 4 (Month 3): Seasonal Rewards & Revenue Sharing**
- Seasonal revenue distribution
- Performance-based rewards
- Treasury-backed incentives

---

## 3. Token Economy (CHAKRA)

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

## 4. Regulatory & Compliance Considerations

StakeWars does not issue, offer, or promote regulated financial assets or investment products.

- **CHAKRA** is a utility token used exclusively for in-game actions such as match entry, character unlocking, and gameplay participation. It is not marketed or designed as an investment, security, or financial instrument.
- **Character NFTs (ERC-1155)** represent in-game characters and progression rights. They do not confer ownership, profit-sharing rights, dividends, or claims on protocol revenue.
- **Yield and reward distributions**, where applicable, are derived solely from platform-generated gameplay fees and are performance-based. They are not fixed, guaranteed, or passive returns.

StakeWars does not offer:
- Fixed or guaranteed returns  
- Passive income mechanisms  
- Interest-bearing instruments  
- Investment contracts  

StakeWars is designed and positioned as a skill-based competitive game and social platform, not a financial product.

---

## 5. Technical Implementation

- **Frontend:** Next.js, React, TypeScript  
- **Blockchain:** Mantle, Viem, Wagmi  
- **Authentication:** Privy  
- **Smart Contracts:** ERC-1155 (Characters), ERC-20 (CHAKRA)  
- **Backend:** Firebase (Firestore, Functions)  
- **Styling:** Tailwind CSS  

---

## 6. Getting Started

```bash
git clone <repo-url>
npm install
input your firebase env variables
npm run dev
