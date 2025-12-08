"use client";

import React from "react";
import { MissionType } from "./Missions";
import { Progress } from "@radix-ui/react-progress";
import { Button } from "./ui/button";
import { toast } from "react-toastify";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase";
import { useMissionsStore } from "@/store/useMission";

type CompletedMissionsProps = {
  missions: MissionType[];
};

export default function CompletedMissions({ missions }: CompletedMissionsProps) {
  const { authenticated } = usePrivy();
  const { wallets } = useWallets();
  const { setCompleted } = useMissionsStore();

  // Get wallet address from Privy (Mantle/Ethereum address)
  const walletAddress = wallets[0]?.address || '';

  const sortedMissions = [...missions].sort((a, b) => {
    if (a.claimed === b.claimed) return 0;
    return a.claimed ? 1 : -1; // claimed go last
  });

  const addXP = async (mission: MissionType) => {
    try {
      if (!walletAddress || !authenticated) {
        toast.error("Wallet not connected!");
        return;
      }

      if (!mission.id) {
        toast.error("Mission ID not found");
        return;
      }

      toast.info("Claiming XP...");

      // Claim XP via API
      const response = await fetch("/api/claim-mission-xp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          walletAddress: walletAddress,
          missionId: mission.id,
          xpAmount: mission.reward,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to claim XP");
      }

      // Update mission as claimed in Firebase
      const missionRef = doc(db, "missions", mission.id);
      await updateDoc(missionRef, { claimed: true });

      // Update local state
      setCompleted(
        missions.map((m) =>
          m.id === mission.id ? { ...m, claimed: true } : m
        )
      );

      toast.success(`Successfully claimed ${mission.reward} XP!`);
    } catch (error) {
      console.error("Failed to claim XP:", error);
      toast.error(`Failed to claim XP: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };


  return (
    <div>
      {sortedMissions.map((mission, index) => {
        const startedAtMs = mission.startedAt ? mission.startedAt.toDate().getTime() : 0;
        const elapsedSeconds = Math.floor((Date.now() - startedAtMs) / 1000);

        return (
          <div
            key={index}
            className={`px-7 py-4 ${
              !mission.claimed ? "bg-[#373636]" : ""
            } border-t-[0.5px] border-b-[0.5px] border-t-[#6A6868] border-b-[#6A6868]`}
          >
            <div className="flex items-center justify-between gap-8 mb-2">
              <h1 className="font-bold text-wrap text-xs sm:text-base">
                {mission.name}
              </h1>
              {mission.claimed ? (
                <div className="flex gap-2 items-center">
                  <img
                    src="/completed.svg"
                    alt="completed"
                    width={18}
                    height={18}
                    className="size-3 sm:size[18px]"
                  />
                  <span className="text-[#BFE528] text-xs md:text-sm">
                    Completed
                  </span>
                </div>
              ) : (
                <Button onClick={() => addXP(mission)} className="flex bg-[#232320] rounded-[5px] shadow-2xl shadow-[#FFF1763B] cursor-pointer items-center gap-2.5">
                  <img src="/xp.png" alt="xp coin" />
                  <span className="text-[#FFD95E] text-sm font-medium">
                    claim XP
                  </span>
                </Button>
              )}

            </div>
            {mission.claimed ? <></> : (
              <div>
                <div className="flex items-center gap-2 my-3 mb-2">
                  <span className="text-[#BFE528] text-sm">Completed</span>
                  <div className="flex items-center gap-2.5">
                    <img src="/xp.png" alt="xp coin" />
                    <span className="text-[#FFD95E] text-sm">
                      {mission.reward} XP
                    </span>
                  </div>
                </div>

                <div>
                  <Progress
                    value={
                      ((elapsedSeconds > mission.duration ? 100 : elapsedSeconds) /
                        mission.duration) *
                      100
                    }
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-5">
              <div className="flex items-center gap-2">
                <img src="/star.svg" width={15} height={15} alt="star" />
                <span className="text-[#FFCE31] capitalize text-xs">
                  Mission level:{" "}
                  <span className="text-white">{mission.difficulty}</span>
                </span>
              </div>
              <div
                className={`flex items-center gap-1 ${
                  mission.claimed ? "block" : "hidden"
                }`}
              >
                <img className="size-3" src="/xp.png" alt="xp coin" />
                <span className="text-[#FFD95E] text-xs sm:text-sm">
                  {mission.reward} XP
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

